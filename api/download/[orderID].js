import fs from "fs";
import path from "path";

export default function handler(req, res) {
    const { orderID } = req.query;

    console.log("Download request:", orderID);

    const productFiles = {
        free: "free.jpeg",
        insta: "insta.png",
        strength: "strength.png",
        oxford: "oxford.png"
    };

    // ===============================
    // FREE PRODUCTS
    // ===============================
    if (orderID.startsWith("FREE_")) {
        const productId = orderID.replace("FREE_", "");
        const file = productFiles[productId];

        if (!file) {
            return res.status(404).send("File not found");
        }

        const filePath = path.join(process.cwd(), "ebooks", file);
        const fileData = fs.readFileSync(filePath);

        res.setHeader("Content-Disposition", `attachment; filename="${file}"`);
        return res.send(fileData);
    }

    // ===============================
    // PAID (temporary logic)
    // ===============================
    // ⚠️ dito mo lalagay DB / verification later

    return res.status(403).send("Not paid!");
}