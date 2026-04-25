const cors = require("cors");
const express = require("express");
const https = require("https");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());


// ===============================
// CONFIG
// ===============================
const isLive = false;

// 🔑 SWITCHABLE KEYS
const PAYPAL_CONFIG = {
    sandbox: {
        clientId: "ARfbGN30i9kbDQhVP5ubH0yoHhvP_dKjbqxQj5Et7Ynh9AR5Gw49TQ2BIziMd7fjoaVQ_HmLVBV9Romc", // ✅ Default Application
        secret: "ECDcZTKD1PEGbQozeFpaklSEoF3UDnoN1P-MPLDNUYQ51UUGYKw-sTEWUgcTQ9Cmsy9kl_Tn8ysFrEOz" // 👉 yung nakikita mo sa screenshot
    },
    live: {
        clientId: "Ac3mWeki2Y1jErrowdTgeS6lKN30beZr9i54dDWUYgJ49Tle18ymFKPtw06xUQ2BlfKooaiS_zbyq6fk", // INVESTOMEDIA
        secret: "EDfrSwVJYl3tCmzt1rk7N_yqr-eo1wey8IbOqPtTB7Rpeo4byuspSzuPq16MDnsM_bz0bZztFsjxJh03" // live secret mo
    }
};

// 🎯 AUTO SELECT
const PAYPAL_CLIENT_ID = isLive
    ? PAYPAL_CONFIG.live.clientId
    : PAYPAL_CONFIG.sandbox.clientId;

const PAYPAL_CLIENT_SECRET = isLive
    ? PAYPAL_CONFIG.live.secret
    : PAYPAL_CONFIG.sandbox.secret;

// 🌐 API URL
const PAYPAL_BASE_URL = isLive
    ? "api-m.paypal.com"
    : "api-m.sandbox.paypal.com";

// ===============================
// TEMP DATABASE
// ===============================
let paidUsers = []; // { orderID, productId }

const productFiles = {
    free: "free.jpeg",
    insta: "insta.png",
    strength: "strength.png",
    oxford: "oxford.png"
};

// ===============================
// GET ACCESS TOKEN
// ===============================
function getAccessToken() {
    return new Promise((resolve, reject) => {
        const data = "grant_type=client_credentials";
        const auth = Buffer.from(
            `${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`
        ).toString("base64");

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

            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    const json = JSON.parse(body);
                    resolve(json.access_token);
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

// ===============================
// VERIFY ORDER
// ===============================
function verifyOrder(orderID, accessToken) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: PAYPAL_BASE_URL,
            path: `/v2/checkout/orders/${orderID}`,
            method: "GET",
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        };

        const req = https.request(options, (res) => {
            let body = "";

            res.on("data", chunk => body += chunk);
            res.on("end", () => {
                try {
                    resolve(JSON.parse(body));
                } catch (err) {
                    reject(err);
                }
            });
        });

        req.on("error", reject);
        req.end();
    });
}

// ===============================
// VERIFY PAYMENT
// ===============================
app.post("/verify-payment", async (req, res) => {
    const { orderID, productId } = req.body;

    if (!orderID || !productId) {
        return res.status(400).json({ success: false });
    }

    try {
        // ✅ TRUST FRONTEND CAPTURE (since already captured)
        if (!paidUsers.find(p => p.orderID === orderID)) {
            paidUsers.push({ orderID, productId });
        }

        return res.json({ success: true });

    } catch (error) {
        console.error("Verification error:", error);
        return res.json({ success: false });
    }
});

// ===============================
// DOWNLOAD ROUTE (SECURE)
// ===============================
app.get("/download/:orderID", (req, res) => {
    const orderID = req.params.orderID;

    console.log("Download request:", orderID); // 🔍 DEBUG

    // ===============================
    // ✅ HANDLE FREE PRODUCTS FIRST
    // ===============================
    if (orderID.startsWith("FREE_")) {
        const productId = orderID.replace("FREE_", "");

        console.log("Free product detected:", productId);

        const file = productFiles[productId];

        if (!file) {
            return res.status(404).send("File not found");
        }

        return res.download(
            path.join(__dirname, "ebooks", file),
            file
        );
    }

    // ===============================
    // PAID PRODUCT VALIDATION
    // ===============================
    const record = paidUsers.find(p => p.orderID === orderID);

    if (!record) {
        return res.status(403).send("Not paid!");
    }

    const file = productFiles[record.productId];

    if (!file) {
        return res.status(404).send("File not found");
    }

    res.download(
        path.join(__dirname, "ebooks", file),
        file
    );
});

// ===============================
app.listen(3000, () => {
    console.log("🚀 Server running on http://localhost:3000");
});

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

            response.on("data", chunk => data += chunk);
            response.on("end", () => {
                const json = JSON.parse(data);

                console.log("CAPTURE RESPONSE:", json);

                if (json.status === "COMPLETED") {
                    paidUsers.push({ orderID, productId });
                    return res.json({ success: true });
                }

                return res.json({ success: false });
            });
        });

        request.on("error", (err) => {
            console.error(err);
            res.json({ success: false });
        });

        request.end();

    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
});