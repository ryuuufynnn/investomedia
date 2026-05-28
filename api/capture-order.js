const https = require("https");
const crypto = require("crypto");

const isLive = false;
const TOKEN_SECRET = "investomedia-download-token";

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

function sendJson(res, statusCode, payload) {
  res.status(statusCode).json(payload);
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

function createToken(orderID, productId) {
  return crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${orderID}:${productId}`)
    .digest("hex");
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    return sendJson(res, 405, { success: false });
  }

  const { orderID, productId } = req.body || {};
  if (!orderID || !productId) {
    return sendJson(res, 400, { success: false });
  }

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
        try {
          const json = JSON.parse(data);
          if (json.status === "COMPLETED") {
            return sendJson(res, 200, {
              success: true,
              token: createToken(orderID, productId)
            });
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
};
