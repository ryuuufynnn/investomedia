const https = require("https");
const path = require("path");

const isLive = false;

const PAYPAL_CONFIG = {
  sandbox: {
    clientId: "ARfbGN30i9kbDQhVP5ubH0yoHhvP_dKjbqxQj5Et7Ynh9AR5Gw49TQ2BIziMd7fjoaVQ_HmLVBV9Romc",
    secret: "ECDcZTKD1PEGbQozeFpaklSEoF3UDnoN1P-MPLDNUYQ51UUGYKw-sTEWUgcTQ9Cmsy9kl_Tn8ysFrEOz"
  },
  live: {
    clientId: "Ac3mWeki2Y1jErrowdTgeS6lKN30beZr9i54dDWUYgJ49Tle18ymFKPtw06xUQ2BlfKooaiS_zbyq6fk",
    secret: "EDfrSwJYl3tCmzt1rk7N_yqr-eo1wey8IbOqPtTB7Rpeo4byuspSzuPq16MDnsM_bz0bZztFsjxJh03"
  }
};

const PAYPAL_CLIENT_ID = isLive ? PAYPAL_CONFIG.live.clientId : PAYPAL_CONFIG.sandbox.clientId;
const PAYPAL_CLIENT_SECRET = isLive ? PAYPAL_CONFIG.live.secret : PAYPAL_CONFIG.sandbox.secret;
const PAYPAL_BASE_URL = isLive ? "api-m.paypal.com" : "api-m.sandbox.paypal.com";

let paidUsers = [];

const productFiles = {
  free: "BEGINNER STEP BY STEP GUIDE.pdf_20260407_001358_0000.pdf",
  insta: "How to Sell on Instagram The Ultimate Guide.pdf",
  strength: "https://drive.google.com/drive/u/1/folders/10FgRWYxiXXDEoXps76ObCrwT4nCICPg-",
  oxford: "https://drive.google.com/drive/folders/1e5BXBDWSXpHGavbpWs-H6TdIHzUPBNh9",
  facebook: "https://docs.google.com/document/d/1KpPDsFkEdoBJbqUqoFSBQTH7NW_epToGpVrQJxfO-iY/edit?usp=drivesdk"
};

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function getAccessToken() {
  return new Promise((resolve, reject) => {
    const data = "grant_type=client_credentials";
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const options = {
      hostname: PAYPAL_BASE_URL,
      path: "/v1/oauth2/token",
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(body).access_token);
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on("error", reject);
    req.write(data);
    req.end();
  });
}

module.exports = async (req, res) => {
  const endpoint = Array.isArray(req.query.path) ? req.query.path.join("/") : req.query.path;

  if (req.method === "GET" && (!endpoint || endpoint === "ping")) {
    res.statusCode = 200;
    res.end("pong");
    return;
  }

  if (req.method === "POST" && endpoint === "verify-payment") {
    const { orderID, productId } = await readBody(req);
    if (!orderID || !productId) return sendJson(res, 400, { success: false });
    if (!paidUsers.find((p) => p.orderID === orderID)) {
      paidUsers.push({ orderID, productId });
    }
    return sendJson(res, 200, { success: true });
  }

  if (req.method === "POST" && endpoint === "capture-order") {
    try {
      const { orderID, productId } = await readBody(req);
      const accessToken = await getAccessToken();
      const options = {
        hostname: PAYPAL_BASE_URL,
        path: `/v2/checkout/orders/${orderID}/capture`,
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        }
      };

      const request = https.request(options, (response) => {
        let data = "";
        response.on("data", (chunk) => (data += chunk));
        response.on("end", () => {
          try {
            const json = JSON.parse(data);
            if (json.status === "COMPLETED") {
              paidUsers.push({ orderID, productId });
              return sendJson(res, 200, { success: true });
            }
          } catch (err) {}
          return sendJson(res, 200, { success: false });
        });
      });

      request.on("error", () => sendJson(res, 200, { success: false }));
      request.end();
    } catch (err) {
      console.error(err);
      return sendJson(res, 200, { success: false });
    }
    return;
  }

  if (req.method === "GET" && endpoint && endpoint.startsWith("download/")) {
    const orderID = endpoint.replace("download/", "");
    const record = orderID.startsWith("FREE_")
      ? { productId: orderID.replace("FREE_", "") }
      : paidUsers.find((p) => p.orderID === orderID);

    if (!record) {
      res.statusCode = 403;
      res.end("Not paid!");
      return;
    }

    const file = productFiles[record.productId];
    if (!file) {
      res.statusCode = 404;
      res.end("File not found");
      return;
    }

    if (file.startsWith("http")) {
      res.statusCode = 302;
      res.setHeader("Location", file);
      res.end();
      return;
    }

    res.statusCode = 302;
    res.setHeader("Location", `/backend/ebooks/${encodeURIComponent(file)}`);
    res.end();
    return;
  }

  res.statusCode = 404;
  res.end("Not found");
};
