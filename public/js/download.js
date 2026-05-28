// GET PRODUCT AND ORDER ID
const product = JSON.parse(localStorage.getItem("paidProduct"));
const orderID = localStorage.getItem("paidOrderID");

const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://investomedia-1.onrender.com";

// VALIDATE
if (!product) {
    alert("No purchase found");
    window.location.href = "index.html";
}

// DISPLAY NAME
document.getElementById("productName").textContent = product.name;

// GET BUTTON
const downloadBtn = document.getElementById("downloadBtn");

// FILE MAPPING
const files = {
    free: "BEGINNER STEP BY STEP GUIDE.pdf_20260407_001358_0000.pdf",
    insta: "How to Sell on Instagram The Ultimate Guide.pdf",
    strength: "https://drive.google.com/drive/u/1/folders/10FgRWYxiXXDEoXps76ObCrwT4nCICPg-",
    oxford: "https://drive.google.com/drive/folders/1e5BXBDWSXpHGavbpWs-H6TdIHzUPBNh9",
    facebook: "https://docs.google.com/document/d/1KpPDsFkEdoBJbqUqoFSBQTH7NW_epToGpVrQJxfO-iY/edit?usp=drivesdk"
};

// CHECK PRODUCT
if (files[product.id]) {

    // FIXED LOGIC
    const downloadParam = orderID && !orderID.startsWith("FREE_") 
        ? orderID 
        : "FREE_" + product.id;

    downloadBtn.style.display = "inline-block";

    downloadBtn.addEventListener("click", () => {
        if (files[product.id].startsWith("http")) {
            window.location.href = files[product.id];
        } else {
            window.location.href = `${BACKEND_URL}/download/${downloadParam}`;
        }
    });

} else {
    console.warn("Unknown product ID:", product.id);
    alert("Unknown product");
}