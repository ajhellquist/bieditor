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

# Patterns that skip attribute values (NOT the attribute row).
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
    ": Id",
    ": Name"
]


def should_skip_values(attr_title: str) -> bool:
    """
    Return True if 'attr_title' starts with any pattern,
    meaning we won't fetch or write attribute values for it.
    """
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

    # If CSV exists, remove it so we start fresh
    if os.path.exists(CSV_FILENAME):
        os.remove(CSV_FILENAME)

    # Open CSV and write the header row
    with open(CSV_FILENAME, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["name", "type", "value", "elementId"])  # columns

        # --------------------------------------------------------------------------
        # 4. WRITE ALL ATTRIBUTES INTO CSV
        # --------------------------------------------------------------------------
        for attr in attributes:
            attr_title = attr.get("title", "")
            link = attr.get("link", "")
            obj_id = link.split("/obj/")[-1]  # numeric part

            # Write the attribute row: name => attribute title
            writer.writerow([attr_title, "attribute", obj_id, "NA"])

            # If skip-values pattern => do NOT fetch attribute values
            if should_skip_values(attr_title):
                continue

            # ----------------------------------------------------------------------
            # 5. Fetch attribute values if not skipping
            # ----------------------------------------------------------------------
            # Retrieve the attribute object
            attribute_url = f"{GOODDATA_HOST}{link}"
            resp_attr = session.get(attribute_url)
            resp_attr.raise_for_status()
            attribute_data = resp_attr.json()

            display_forms = attribute_data["attribute"]["content"].get("displayForms", [])
            if not display_forms:
                continue

            # For each label, fetch distinct elements
            for dform in display_forms:
                label_uri = dform["meta"]["uri"]  # e.g. /gdc/md/.../obj/1234
                label_elements_url = f"{GOODDATA_HOST}{label_uri}/elements"

                offset = 0
                limit = 100
                while True:
                    page_url = f"{label_elements_url}?limit={limit}&offset={offset}"
                    r = session.get(page_url)
                    r.raise_for_status()
                    page_data = r.json()

                    elements_info = page_data["attributeElements"]
                    items = elements_info["elements"]
                    paging = elements_info["paging"]
                    total_count = int(paging["total"])

                    for elem in items:
                        val_title = elem["title"]
                        val_uri = elem["uri"]

                        # If attribute value name is blank, replace with "empty value"
                        if not val_title.strip():
                            val_title = "empty value"

                        # The final "name" column => "AttributeTitle: ValueTitle"
                        combined_name = f"{attr_title}: {val_title}"

                        # parse the element ID from "?id="
                        if "?id=" in val_uri:
                            element_id = val_uri.split("?id=")[-1]
                        else:
                            element_id = "UNKNOWN"

                        # CSV row => name, type=attribute value, value=obj_id, elementId=the element_id
                        writer.writerow([combined_name, "attribute value", obj_id, element_id])

                    offset += len(items)
                    if offset >= total_count:
                        break

    print(f"\nDone! Check {CSV_FILENAME} for results.")
