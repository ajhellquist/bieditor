import requests

# ------------------------------------------------------------------------------
# 1. BASIC CONFIGURATION
# ------------------------------------------------------------------------------
GOODDATA_HOST = "https://prod.mavenlinkreports.com"
PROJECT_ID = "vyfe74jrhva0hwwcm30y9m8enafaeag9"
ATTRIBUTE_ID = "4042"   # or "11061150" or any other

# HEADERS
HEADERS = {
    "User-Agent": "MyCustomClient/1.0 (someone@example.com)",
    "Accept": "application/json"
}

# Provide your real GoodData login credentials here
LOGIN_PAYLOAD = {
    "postUserLogin": {
        "login":    "ahellquist+mavenlink@mavenlink.com",
        "password": "EE9pQ@T17@78wH*s",
        "remember": "0",
        "verify_level": 0
    }
}

# ------------------------------------------------------------------------------
# 2. CREATE A SESSION AND LOG IN
# ------------------------------------------------------------------------------
with requests.Session() as session:
    session.headers.update(HEADERS)

    login_url = f"{GOODDATA_HOST}/gdc/account/login"
    resp = session.post(login_url, json=LOGIN_PAYLOAD)
    resp.raise_for_status()  # raise an error if login fails

    # ------------------------------------------------------------------------------
    # 3. GET THE ATTRIBUTE OBJECT
    # ------------------------------------------------------------------------------
    attribute_uri = f"/gdc/md/{PROJECT_ID}/obj/{ATTRIBUTE_ID}"
    obj_url = f"{GOODDATA_HOST}{attribute_uri}"
    resp = session.get(obj_url)
    resp.raise_for_status()
    attribute_data = resp.json()

    # The JSON structure typically looks like: 
    #  {
    #    "attribute": {
    #      "content": {
    #         "displayForms": [
    #            {
    #              "meta": {"uri": "..."},
    #              "links": {"elements": "..."}
    #            },
    #            ...
    #         ]
    #       }
    #     }
    #  }

    # ------------------------------------------------------------------------------
    # 4. FIND LABELS (DISPLAY FORMS) 
    # ------------------------------------------------------------------------------
    display_forms = attribute_data["attribute"]["content"].get("displayForms", [])
    if not display_forms:
        print("No display forms found. Possibly not an attribute or unexpected structure.")
        exit()

    # ------------------------------------------------------------------------------
    # 5. FOR EACH LABEL, GET DISTINCT VALUES
    # ------------------------------------------------------------------------------
    for dform in display_forms:
        label_uri = dform["meta"]["uri"]   # e.g. /gdc/md/<PROJECT_ID>/obj/1234
        label_elements_url = f"{GOODDATA_HOST}{label_uri}/elements"

        print(f"\n=== LABEL: {label_uri} ===")

        offset = 0
        limit = 100  # how many per page
        total_count = None

        while True:
            # Build a query string for paging
            url_with_paging = f"{label_elements_url}?limit={limit}&offset={offset}"

            resp = session.get(url_with_paging)
            resp.raise_for_status()

            data = resp.json()
            elements_info = data["attributeElements"]
            items = elements_info["elements"]       # distinct value items
            paging = elements_info["paging"]
            total_count = paging["total"]

            # Process or print each distinct element
            for elem in items:
                val_title = elem["title"]
                val_uri = elem["uri"]
                print(f" - Value Title: {val_title},  URI: {val_uri}")

            offset += len(items)
            if offset >= total_count:
                break

    print("\nDone!")
