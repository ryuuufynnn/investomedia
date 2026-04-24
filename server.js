const express = require("express");
const app = express();

app.use(express.json());

// TEMP STORAGE (simulate database)
let paidUsers = [];

// VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
    const { orderID } = req.body;

    // In real case: verify with PayPal API
    // For now: accept all sandbox success
    paidUsers.push(orderID);

    res.json({ success: true });
});

// DOWNLOAD (protected)
app.get("/download/:orderID", (req, res) => {
    const orderID = req.params.orderID;

    if (!paidUsers.includes(orderID)) {
        return res.status(403).send("Not paid!");
    }

    res.download(__dirname + "/ebooks/instagram.pdf");
});

app.listen(3000, () => console.log("Server running on port 3000"));