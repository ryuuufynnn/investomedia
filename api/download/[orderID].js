const crypto = require("crypto");

const TOKEN_SECRET = "investomedia-download-token";

const productFiles = {
  free: "BEGINNER STEP BY STEP GUIDE.pdf_20260407_001358_0000.pdf",
  insta: "How to Sell on Instagram The Ultimate Guide.pdf",
  strength: "https://drive.google.com/drive/u/1/folders/10FgRWYxiXXDEoXps76ObCrwT4nCICPg-",
  oxford: "https://drive.google.com/drive/folders/1e5BXBDWSXpHGavbpWs-H6TdIHzUPBNh9",
  facebook: "https://docs.google.com/document/d/1KpPDsFkEdoBJbqUqoFSBQTH7NW_epToGpVrQJxfO-iY/edit?usp=drivesdk"
};

function verifyToken(orderID, productId, token) {
  const expected = crypto
    .createHmac("sha256", TOKEN_SECRET)
    .update(`${orderID}:${productId}`)
    .digest("hex");
  return token === expected;
}

module.exports = async (req, res) => {
  const { orderID } = req.query;
  const token = req.query.token;

  if (!orderID) {
    return res.status(400).send("Missing order ID");
  }

  if (orderID.startsWith("FREE_")) {
    const productId = orderID.replace("FREE_", "");
    const file = productFiles[productId];
    if (!file) return res.status(404).send("File not found");
    if (file.startsWith("http")) return res.redirect(file);
    res.writeHead(302, { Location: `/backend/ebooks/${encodeURIComponent(file)}` });
    return res.end();
  }

  const productId = req.query.productId;
  if (!productId || !token || !verifyToken(orderID, productId, token)) {
    return res.status(403).send("Not paid!");
  }

  const file = productFiles[productId];
  if (!file) return res.status(404).send("File not found");
  if (file.startsWith("http")) return res.redirect(file);

  res.writeHead(302, { Location: `/backend/ebooks/${encodeURIComponent(file)}` });
  return res.end();
};
