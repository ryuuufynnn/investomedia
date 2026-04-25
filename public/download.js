// GET PRODUCT AND ORDER ID
const product = JSON.parse(localStorage.getItem("paidProduct"));
const orderID = localStorage.getItem("paidOrderID");

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
    free: "free.jpeg",
    insta: "insta.png",
    strength: "strength.png",
    oxford: "oxford.png"
};

// CHECK PRODUCT
if (files[product.id]) {

    // 🔥 FIXED LOGIC
    const downloadParam = orderID && !orderID.startsWith("FREE_") 
        ? orderID 
        : "FREE_" + product.id;

    downloadBtn.style.display = "inline-block";

    downloadBtn.addEventListener("click", () => {
        window.location.href = `https://investomedia.onrender.com/download/${downloadParam}`;
    });

} else {
    console.warn("Unknown product ID:", product.id);
    alert("Unknown product");
}