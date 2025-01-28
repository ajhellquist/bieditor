import requests
import csv
import os

# ------------------------------------------------------------------------------
# 1. BASIC CONFIGURATION
# ------------------------------------------------------------------------------
GOODDATA_HOST = "https://prod.mavenlinkreports.com"
PROJECT_ID = "qurj3o0kcilkzzvhxp9r2wn1bs9xrjdt"
CSV_FILENAME = "projectvariables.csv"

HEADERS = {
    "User-Agent": "MyCustomClient/1.0 (myemail@example.com)",
    "Accept": "application/json"
}

LOGIN_PAYLOAD = {
    "postUserLogin": {
        "login":    "ahellquist+mavenlink@mavenlink.com",  # Your actual user
        "password": "EE9pQ@T17@78wH*s",                    # Your actual password
        "remember": "0",
        "verify_level": 0
    }
}

# If attribute name CONTAINS any of these strings,
# we skip fetching/writing attribute values (but still write the attribute row).
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
    ": Name",
    ": Description",
    ": Number",
    "Budget Used",
    "ͺ",
    "Submission ID",
    "Parent",
    "Top Level",
    "Aggregate",
    "Note",
    "Title",
    "ID",
    "Resource Name"
]

def should_skip_values_for_attribute(attr_title: str) -> bool:
    """
    Return True if the attribute name *contains* any skip pattern,
    in which case we do NOT fetch its values (but we still write the attribute row).
    """
    for pattern in SKIP_PATTERNS:
        if pattern in attr_title:
            return True
    return False

# ------------------------------------------------------------------------------
# 2. CREATE A SESSION & LOG IN
# ------------------------------------------------------------------------------
with requests.Session() as session:
    session.headers.update(HEADERS)

    login_url = f"{GOODDATA_HOST}/gdc/account/login"
    resp = session.post(login_url, json=LOGIN_PAYLOAD)
    resp.raise_for_status()  # Raise an error if login fails

    # If the CSV file already exists, remove it to start fresh
    if os.path.exists(CSV_FILENAME):
        os.remove(CSV_FILENAME)

    # Open CSV in write mode and create the header
    with open(CSV_FILENAME, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["name", "type", "value", "elementId"])

        # ------------------------------------------------------------------------------
        # 3. GET ALL ATTRIBUTES
        # ------------------------------------------------------------------------------
        attributes_url = f"{GOODDATA_HOST}/gdc/md/{PROJECT_ID}/query/attributes"
        resp_attr_list = session.get(attributes_url)
        resp_attr_list.raise_for_status()

        attr_data = resp_attr_list.json()
        attributes = attr_data["query"]["entries"]

        for attr in attributes:
            attr_title = attr.get("title", "")
            link = attr.get("link", "")
            obj_id = link.split("/obj/")[-1]

            # Remove commas from the attribute title
            attr_title_clean = attr_title.replace(",", "")

            # Always write the attribute row
            writer.writerow([attr_title_clean, "attribute", obj_id, "NA"])

            # If skip pattern => do not fetch values
            if should_skip_values_for_attribute(attr_title):
                continue

            # Otherwise, fetch attribute's display forms => get values
            attribute_url = f"{GOODDATA_HOST}{link}"
            resp_attr_obj = session.get(attribute_url)
            resp_attr_obj.raise_for_status()
            attribute_details = resp_attr_obj.json()

            display_forms = attribute_details["attribute"]["content"].get("displayForms", [])
            if not display_forms:
                continue

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

                        if not val_title.strip():
                            val_title = "empty value"

                        # Remove commas from both attribute and value
                        val_title_clean = val_title.replace(",", "")
                        attr_title_clean_no_comma = attr_title_clean  # Already stripped above

                        # Combined => "<AttributeTitle>: <ValueTitle>"
                        combined_name = f"{attr_title_clean_no_comma}: {val_title_clean}"
                        # If there's a chance combined_name has commas, remove them too:
                        combined_name = combined_name.replace(",", "")

                        if "?id=" in val_uri:
                            element_id = val_uri.split("?id=")[-1]
                        else:
                            element_id = "UNKNOWN"

                        writer.writerow([combined_name, "attribute value", obj_id, element_id])

                    offset += len(items)
                    if offset >= total_count:
                        break

        # ------------------------------------------------------------------------------
        # 4. GET ALL METRICS
        # ------------------------------------------------------------------------------
        metrics_url = f"{GOODDATA_HOST}/gdc/md/{PROJECT_ID}/query/metrics"
        resp_metrics = session.get(metrics_url)
        resp_metrics.raise_for_status()

        metrics_data = resp_metrics.json()
        metrics = metrics_data["query"]["entries"]

        for m in metrics:
            metric_title = m.get("title", "")
            metric_link = m.get("link", "")
            metric_obj_id = metric_link.split("/obj/")[-1]

            # remove commas from metric name
            metric_title_clean = metric_title.replace(",", "")

            # row => name=metric_title_clean, type="metric", value=metric_obj_id, elementId="NA"
            writer.writerow([metric_title_clean, "metric", metric_obj_id, "NA"])

    print(f"\nDone! Check {CSV_FILENAME} for results.")
