import requests
import csv
import os

# ------------------------------------------------------------------------------
# 1. BASIC CONFIGURATION
# ------------------------------------------------------------------------------
GOODDATA_HOST = "https://prod.mavenlinkreports.com"
PROJECT_ID = "vyfe74jrhva0hwwcm30y9m8enafaeag9"
CSV_FILENAME = "projectvariables.csv"

HEADERS = {
    "User-Agent": "MyCustomClient/1.0 (myemail@example.com)",
    "Accept": "application/json"
}

LOGIN_PAYLOAD = {
    "postUserLogin": {
        "login":    "ahellquist+mavenlink@mavenlink.com",   # Your actual user
        "password": "EE9pQ@T17@78wH*s",                     # Your actual password
        "remember": "0",
        "verify_level": 0
    }
}

# Patterns to skip for attribute names
SKIP_PATTERNS = [
    "Date (",
    "Day of Week (Mon-Sun) (",
    "Day of Week (Sun-Sat) (",
    "Month (",
    "Month/Year (",
    "Month of Quarter (",
    "Week (Mon-Sun) (",
    "Week (Sun-Sat) (",
    "Week (Mon-Sun)/Year (",
    "Week (Sun-Sat)/Year (",
    "Week (Mon-Sun) of Qtr (",
    "Week (Sun-Sat) of Qtr (",
    "Day of Quarter (",
    "Day of Month (",
    "Day of Year (",
    "Quarter (",
    "Quarter/Year (",
    "Year (",
    ": ID",
    ": Name"
]

def should_skip_attribute(attr_title: str) -> bool:
    """Return True if 'attr_title' starts with any of the date/time patterns in SKIP_PATTERNS."""
    for pattern in SKIP_PATTERNS:
        if attr_title.startswith(pattern):
            return True
    return False

# ------------------------------------------------------------------------------
# 2. CREATE A SESSION & LOG IN
# ------------------------------------------------------------------------------
with requests.Session() as session:
    session.headers.update(HEADERS)

    login_url = f"{GOODDATA_HOST}/gdc/account/login"
    resp = session.post(login_url, json=LOGIN_PAYLOAD)
    resp.raise_for_status()  # raise an error if login fails

    # ------------------------------------------------------------------------------
    # 3. FETCH ALL ATTRIBUTES
    # ------------------------------------------------------------------------------
    attributes_url = f"{GOODDATA_HOST}/gdc/md/{PROJECT_ID}/query/attributes"
    resp = session.get(attributes_url)
    resp.raise_for_status()

    data = resp.json()
    attributes = data["query"]["entries"]  # each has "link", "title", etc.

    # If CSV exists, remove so we start fresh
    if os.path.exists(CSV_FILENAME):
        os.remove(CSV_FILENAME)

    # Open CSV and write the header row
    with open(CSV_FILENAME, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["name", "type", "value", "elementId"])  # columns

        # Filter out attributes whose name starts with any skip pattern
        filtered_attributes = []
        for attr in attributes:
            attr_title = attr.get("title", "")
            if should_skip_attribute(attr_title):
                # Skip date/time-like attribute
                continue
            
            # Otherwise, store it & write the "attribute" row
            filtered_attributes.append(attr)

            link = attr.get("link")
            obj_id = link.split("/obj/")[-1]
            writer.writerow([attr_title, "attribute", obj_id, "NA"])

        # ------------------------------------------------------------------------------
        # 4. For each "kept" attribute, fetch distinct values if total records <= 20
        # ------------------------------------------------------------------------------
        for attr in filtered_attributes:
            attr_title = attr.get("title", "")
            link = attr.get("link", "")
            obj_id = link.split("/obj/")[-1]

            # 4A) Retrieve the attribute object
            attribute_url = f"{GOODDATA_HOST}{link}"
            resp = session.get(attribute_url)
            resp.raise_for_status()
            attribute_data = resp.json()

            display_forms = attribute_data["attribute"]["content"].get("displayForms", [])
            if not display_forms:
                continue  # no labels => skip

            # 4B) For each label, check the total "records"
            for dform in display_forms:
                label_uri = dform["meta"]["uri"]  # e.g. /gdc/md/<proj>/obj/1234
                label_elements_url = f"{GOODDATA_HOST}{label_uri}/elements?limit=1&offset=0"

                # First, do a 'light' request just to see how many total records
                r = session.get(label_elements_url)
                r.raise_for_status()
                elem_data = r.json()

                elements_info = elem_data["attributeElements"]
                # overall record count for the entire label
                # stored in elementsMeta["records"]
                record_count = int(elements_info["elementsMeta"]["records"])

                if record_count > 20:
                    # skip fetching all values
                    continue

                # If record_count <= 20, do paging & fetch them all
                offset = 0
                limit = 100
                while True:
                    # Build full paging URL
                    page_url = f"{GOODDATA_HOST}{label_uri}/elements?limit={limit}&offset={offset}"
                    pr = session.get(page_url)
                    pr.raise_for_status()
                    page_data = pr.json()

                    page_elements_info = page_data["attributeElements"]
                    items = page_elements_info["elements"]
                    paging = page_elements_info["paging"]
                    total_count = int(paging["total"])

                    for elem in items:
                        val_title = elem["title"]
                        val_uri = elem["uri"]

                        # parse element ID from "?id="
                        if "?id=" in val_uri:
                            element_id = val_uri.split("?id=")[-1]
                        else:
                            element_id = "UNKNOWN"

                        writer.writerow([val_title, "attribute value", obj_id, element_id])

                    offset += len(items)
                    if offset >= total_count:
                        break

    print(f"\nDone! Check {CSV_FILENAME} for results.")
