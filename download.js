// GET PRODUCT
const product = JSON.parse(localStorage.getItem("paidProduct"));

// VALIDATE
if (!product) {
    alert("No purchase found");
    window.location.href = "index.html";
}

// DISPLAY NAME
document.getElementById("productName").textContent = product.name;

// GET BUTTON
const downloadBtn = document.getElementById("downloadBtn");

// FILE MAPPING (BY ID)
const files = {
    "free": "ebooks/free.jpeg",
    "insta": "ebooks/insta.png",
    "strength": "ebooks/strength.png",
    "oxford": "ebooks/oxford.png"
};

// ASSIGN FILE
if (files[product.id]) {
    downloadBtn.href = files[product.id];
} else {
    console.warn("Unknown product ID:", product.id);
    downloadBtn.href = "ebooks/insta.png"; // fallback
}