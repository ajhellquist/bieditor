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
        "login":    "ahellquist+mavenlink@mavenlink.com",  # Replace with your real user
        "password": "EE9pQ@T17@78wH*s",                    # Replace with your real password
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
    """Return True if the attribute name *contains* any skip pattern."""
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
    resp.raise_for_status()  # error if login fails

    # If the CSV file already exists, remove it to start fresh
    if os.path.exists(CSV_FILENAME):
        os.remove(CSV_FILENAME)

    # Open CSV in write mode and create the header
    with open(CSV_FILENAME, mode="w", newline="", encoding="utf-8") as csvfile:
        writer = csv.writer(csvfile)
        writer.writerow(["name", "type", "value", "elementId"])  # columns

        # ------------------------------------------------------------------------------
        # 3. GET ALL ATTRIBUTES, WRITE THEM + THEIR VALUES
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

            # Always write the attribute row
            writer.writerow([attr_title, "attribute", obj_id, "NA"])

            # If attribute name contains skip pattern => do NOT fetch values
            if should_skip_values_for_attribute(attr_title):
                continue

            # Otherwise, let's fetch the attribute's display forms => get values
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

                        # Combined name => "AttributeTitle: ValueTitle"
                        combined_name = f"{attr_title}: {val_title}"

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

        # ------------------------------------------------------------------------------
        # 5. WRITE METRICS ROWS
        # ------------------------------------------------------------------------------
        for m in metrics:
            metric_title = m.get("title", "")
            metric_link = m.get("link", "")
            metric_obj_id = metric_link.split("/obj/")[-1]

            # For metrics => name = metric_title
            # type = "metric"
            # value = numeric ID
            # elementId = "NA"
            writer.writerow([metric_title, "metric", metric_obj_id, "NA"])

    print(f"\nDone! Check {CSV_FILENAME} for results.")
