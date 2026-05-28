const express = require("express");
const cors = require("cors");
const https = require("https");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

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

app.get("/", (req, res) => {
  res.send("Backend is alive");
});

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

app.post("/capture-order", async (req, res) => {
  const { orderID, productId } = req.body;
  try {
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
        const json = JSON.parse(data);
        if (json.status === "COMPLETED") {
          paidUsers.push({ orderID, productId });
          return res.json({ success: true });
        }
        return res.json({ success: false });
      });
    });

    request.on("error", () => res.json({ success: false }));
    request.end();
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

app.post("/verify-payment", (req, res) => {
  const { orderID, productId } = req.body;
  if (!orderID || !productId) {
    return res.status(400).json({ success: false });
  }
  if (!paidUsers.find((p) => p.orderID === orderID)) {
    paidUsers.push({ orderID, productId });
  }
  return res.json({ success: true });
});

app.get("/ping", (req, res) => {
  res.send("pong");
});

app.get("/download/:orderID", (req, res) => {
  const orderID = req.params.orderID;
  if (orderID.startsWith("FREE_")) {
    const productId = orderID.replace("FREE_", "");
    const file = productFiles[productId];
    if (!file) return res.status(404).send("File not found");
    if (file.startsWith("http")) return res.redirect(file);
    return res.download(path.join(__dirname, "..", "backend", "ebooks", file), file);
  }

  const record = paidUsers.find((p) => p.orderID === orderID);
  if (!record) return res.status(403).send("Not paid!");

  const file = productFiles[record.productId];
  if (!file) return res.status(404).send("File not found");
  if (file.startsWith("http")) return res.redirect(file);
  return res.download(path.join(__dirname, "..", "backend", "ebooks", file), file);
});

module.exports = app;
