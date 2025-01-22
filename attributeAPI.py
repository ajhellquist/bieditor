import requests

# ------------------------------------------------------------------------------
# 1. BASIC CONFIGURATION
# ------------------------------------------------------------------------------

GOODDATA_HOST = "https://prod.mavenlinkreports.com"
PROJECT_ID = "vyfe74jrhva0hwwcm30y9m8enafaeag9"  # Replace with your real project ID

# GoodData requires a custom User-Agent header.
HEADERS = {
    "User-Agent": "MyCustomClient/1.0 (myemail@example.com)",
    "Accept": "application/json"
}

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
    
    # Perform login:
    resp = session.post(login_url, json=LOGIN_PAYLOAD)
    print("DEBUG status code:", resp.status_code)
    print("DEBUG body:", resp.text)

    resp.raise_for_status()  # Raise an error if login failed

    # ------------------------------------------------------------------------------
    # 3. GET ALL ATTRIBUTES FOR THIS PROJECT
    # ------------------------------------------------------------------------------
    attributes_url = f"{GOODDATA_HOST}/gdc/md/{PROJECT_ID}/query/attributes"

    resp = session.get(attributes_url)
    resp.raise_for_status()

    data = resp.json()
    # The JSON structure looks like:
    # {
    #   "query": {
    #     "entries": [
    #       {
    #         "link": "/gdc/md/<project-id>/obj/123",
    #         "title": "Your attribute title",
    #         "summary": "...",
    #         ...
    #       }, ...
    #     ]
    #   }
    # }

    attributes = data["query"]["entries"]

    # ------------------------------------------------------------------------------
    # 4. PRINT OR STORE THE ATTRIBUTE NAMES & THEIR URI
    # ------------------------------------------------------------------------------
    for attr in attributes:
        title = attr.get("title")
        link = attr.get("link")  # e.g. "/gdc/md/<project-id>/obj/11061150"

        # Extract the numeric ID after '/obj/'
        obj_id = link.split("/obj/")[-1]

        # Print CSV-like line: "title,id"
        print(f"{title},attribute,{obj_id},NA")

