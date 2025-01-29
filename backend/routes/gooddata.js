// backend/routes/gooddata.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const cors = require('cors');
const corsOptions = require('../config/cors');
const Variable = require('../models/Variable');
const axios = require('axios');

// For GoodData session cookies:
const { wrapper } = require('axios-cookiejar-support');
const tough = require('tough-cookie');

// Hard-coded GoodData credentials (or retrieve from ENV):
const GOODDATA_HOST = "https://prod.mavenlinkreports.com";
const GOODDATA_LOGIN = "ahellquist+mavenlink@mavenlink.com";
const GOODDATA_PASSWORD = "EE9pQ@T17@78wH*s";

// Patterns to skip attribute values
const SKIP_PATTERNS = [
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
  "Resource: Title",
  "ID",
  "Resource Name"
];
function shouldSkipValuesForAttribute(attrTitle) {
  return SKIP_PATTERNS.some((pattern) => attrTitle.includes(pattern));
}

// Apply CORS specifically for this route
router.use(cors(corsOptions));

/**
 * POST /gooddata/sync
 * Initiates the synchronization process with GoodData.
 * Responds immediately to avoid Heroku H12 timeout.
 * Handles the sync process asynchronously.
 */
router.post('/sync', auth, async (req, res) => {
  // Add CORS headers explicitly for this endpoint
  const origin = req.headers.origin;
  if (corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Respond immediately to the client
  res.status(202).json({ 
    message: "GoodData sync initiated. You will receive updates once completed." 
  });

  // Start the sync process asynchronously
  (async () => {
    try {
      const { projectId, pidRecordId } = req.body;
      if (!projectId || !pidRecordId) {
        console.error("Missing 'projectId' or 'pidRecordId' in request body.");
        return;
      }

      // 1) Create an Axios instance that handles cookies with longer timeout
      const cookieJar = new tough.CookieJar();
      const client = wrapper(axios.create({ 
        jar: cookieJar,
        timeout: 300000 // 5 minute timeout
      }));

      // 2) Log into GoodData
      await client.post(`${GOODDATA_HOST}/gdc/account/login`, {
        postUserLogin: {
          login: GOODDATA_LOGIN,
          password: GOODDATA_PASSWORD,
          remember: "0",
          verify_level: 0
        }
      });

      // 3) Fetch attributes
      const attributesUrl = `${GOODDATA_HOST}/gdc/md/${projectId}/query/attributes`;
      const respAttrList = await client.get(attributesUrl);
      const attributes = respAttrList.data.query.entries || [];

      for (const attr of attributes) {
        const attrTitle = attr.title || "";
        const link = attr.link || "";
        const objId = link.split("/obj/").pop();

        // Save attribute if not already present
        const existingAttr = await Variable.findOne({
          pidId: pidRecordId,
          name: attrTitle.replace(/,/g, ""),
          type: "Attribute",
          value: objId
        });
        if (!existingAttr) {
          await Variable.create({
            pidId: pidRecordId,
            name: attrTitle.replace(/,/g, ""),
            type: "Attribute",
            value: objId,
            elementId: "NA"
          });
        }

        // Skip attribute values if the title matches skip patterns
        if (shouldSkipValuesForAttribute(attrTitle)) {
          continue;
        }

        // Fetch the attribute details for display forms => attribute values
        const attributeUrl = `${GOODDATA_HOST}${link}`;
        const respAttrObj = await client.get(attributeUrl);
        const attributeDetails = respAttrObj.data;
        const displayForms = attributeDetails.attribute.content?.displayForms || [];

        for (const dForm of displayForms) {
          const labelUri = dForm.meta.uri;
          const labelElementsUrl = `${GOODDATA_HOST}${labelUri}/elements`;

          let offset = 0;
          const limit = 100;
          let totalCount = Infinity;

          while (offset < totalCount) {
            const pageUrl = `${labelElementsUrl}?limit=${limit}&offset=${offset}`;
            const pageResp = await client.get(pageUrl);
            const pageData = pageResp.data.attributeElements;
            const items = pageData.elements || [];
            totalCount = parseInt(pageData.paging.total, 10);

            for (const elem of items) {
              const valTitle = elem.title.trim() || "empty value";
              const valUri = elem.uri;
              let elementId = "UNKNOWN";
              if (valUri.includes("?id=")) {
                elementId = valUri.split("?id=")[1];
              }
              const combinedName = `${attrTitle.replace(/,/g, "")}: ${valTitle.replace(/,/g, "")}`;

              // Insert if not found
              const existingVal = await Variable.findOne({
                pidId: pidRecordId,
                name: combinedName,
                type: "Attribute Value",
                value: objId,
                elementId: elementId
              });
              if (!existingVal) {
                await Variable.create({
                  pidId: pidRecordId,
                  name: combinedName,
                  type: "Attribute Value",
                  value: objId,
                  elementId
                });
              }
            }

            offset += items.length;
            if (offset >= totalCount) break;
          }
        }
      }

      // 4) Fetch metrics
      const metricsUrl = `${GOODDATA_HOST}/gdc/md/${projectId}/query/metrics`;
      const respMetrics = await client.get(metricsUrl);
      const metrics = respMetrics.data.query.entries || [];

      for (const m of metrics) {
        const metricTitle = m.title || "";
        const metricLink = m.link || "";
        const metricObjId = metricLink.split("/obj/").pop();

        const existingMetric = await Variable.findOne({
          pidId: pidRecordId,
          name: metricTitle.replace(/,/g, ""),
          type: "Metric",
          value: metricObjId
        });
        if (!existingMetric) {
          await Variable.create({
            pidId: pidRecordId,
            name: metricTitle.replace(/,/g, ""),
            type: "Metric",
            value: metricObjId,
            elementId: "NA"
          });
        }
      }

      console.log("GoodData sync complete for PID:", pidRecordId);
    } catch (error) {
      console.error("Error during GoodData sync:", error);
      // Optionally, implement error notifications or logging
    }
  })();
});

module.exports = router;
