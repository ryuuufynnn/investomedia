const express = require("express");
const cors = require("cors");
const https = require("https");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// ===============================
// CONFIG
// ===============================
const isLive = false;

const PAYPAL_CONFIG = {
    sandbox: {
        clientId: "YOUR_SANDBOX_ID",
        secret: "YOUR_SANDBOX_SECRET"
    },
    live: {
        clientId: "YOUR_LIVE_ID",
        secret: "YOUR_LIVE_SECRET"
    }
};

const PAYPAL_CLIENT_ID = isLive
    ? PAYPAL_CONFIG.live.clientId
    : PAYPAL_CONFIG.sandbox.clientId;

const PAYPAL_CLIENT_SECRET = isLive
    ? PAYPAL_CONFIG.live.secret
    : PAYPAL_CONFIG.sandbox.secret;

const PAYPAL_BASE_URL = isLive
    ? "api-m.paypal.com"
    : "api-m.sandbox.paypal.com";

// ===============================
// TEMP DATABASE
// ===============================
let paidUsers = [];

const productFiles = {
    free: "free.jpeg",
    insta: "insta.png",
    strength: "strength.png",
    oxford: "oxford.png"
};

// ===============================
// VERIFY PAYMENT (simple version)
// ===============================
app.post("/verify-payment", (req, res) => {
    const { orderID, productId } = req.body;

    if (!orderID || !productId) {
        return res.status(400).json({ success: false });
    }

    if (!paidUsers.find(p => p.orderID === orderID)) {
        paidUsers.push({ orderID, productId });
    }

    return res.json({ success: true });
});

// ===============================
// DOWNLOAD
// ===============================
app.get("/download/:orderID", (req, res) => {
    const orderID = req.params.orderID;

    if (orderID.startsWith("FREE_")) {
        const productId = orderID.replace("FREE_", "");
        const file = productFiles[productId];

        if (!file) return res.status(404).send("File not found");

        return res.download(
            path.join(__dirname, "ebooks", file),
            file
        );
    }

    const record = paidUsers.find(p => p.orderID === orderID);

    if (!record) return res.status(403).send("Not paid!");

    const file = productFiles[record.productId];

    if (!file) return res.status(404).send("File not found");

    res.download(
        path.join(__dirname, "ebooks", file),
        file
    );
});

// ===============================
// ROOT CHECK
// ===============================
app.get("/", (req, res) => {
    res.send("Backend running 🚀");
});

// ===============================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});