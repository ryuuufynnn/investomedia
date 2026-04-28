// Load product
const product = JSON.parse(localStorage.getItem("selectedProduct"));

if (!product) {
    alert("No product found. Redirecting...");
    window.location.href = "index.html";
}

document.getElementById("productName").textContent = product.name;
document.getElementById("productPrice").textContent = product.price;

function payNow() {
    const selected = document.querySelector('input[name="payment"]:checked');

    if (!selected) {
        alert("Please select payment method");
        return;
    }

    if (selected.value === "paypal") {
        window.location.href = "paypal.html";
    } else if (selected.value === "gcash") {
        window.location.href = "gcash.html";
    }
}