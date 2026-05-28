// get product
const product = JSON.parse(localStorage.getItem("selectedProduct"));

const BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:3000"
    : "https://investomedia.onrender.com";

if (!product) {
    alert("No product found. Redirecting...");
    window.location.href = "index.html";
}

// DISPLAY PRODUCT
document.getElementById("productName").textContent = product.name;
document.getElementById("productPrice").textContent = product.price;


// loader 
function showLoader() {
    if (document.getElementById("loader")) return;

    const loader = document.createElement("div");
    loader.id = "loader";
    loader.style.position = "fixed";
    loader.style.top = "0";
    loader.style.left = "0";
    loader.style.width = "100%";
    loader.style.height = "100%";
    loader.style.background = "rgba(0,0,0,0.7)";
    loader.style.color = "#fff";
    loader.style.display = "flex";
    loader.style.alignItems = "center";
    loader.style.justifyContent = "center";
    loader.style.fontSize = "20px";
    loader.style.zIndex = "9999";
    loader.innerText = "Processing your payment...";
    document.body.appendChild(loader);
}


// wait for paypal sdk
function waitForPaypal(callback) {
    if (window.paypal) {
        callback();
    } else {
        console.log("Waiting for PayPal SDK...");
        setTimeout(() => waitForPaypal(callback), 100);
    }
}


// success handler (reuse);
async function handleSuccess(orderID) {

    console.log("Handling success for:", orderID);

    // SAVE LOCALLY
    localStorage.setItem("paidProduct", JSON.stringify(product));
    localStorage.setItem("paidOrderID", orderID);

    try {
        const response = await fetch(`${BACKEND_URL}/verify-payment`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                orderID,
                productId: product.id
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log("VERIFIED!");

            // slight delay para safe sa redirect
            setTimeout(() => {
                window.location.href = "download.html"; // success payment;
            }, 800);

        } else {
            console.warn("Verification failed");
            alert("Payment verification failed.");
            window.location.href = "payment.html";
        }

    } catch (error) {
        console.error("SERVER ERROR:", error);
        alert("Server error. Try again.");
        window.location.href = "payment.html";
    }
}


// init paypal button;
waitForPaypal(() => {

    console.log("PayPal SDK Loaded");

    paypal.Buttons({

        // create an order;
        createOrder: (data, actions) => {
            return actions.order.create({
                purchase_units: [{
                    description: product.name,
                    amount: {
                        currency_code: "PHP",
                        value: product.price.toString()
                    }
                }]
            });
        },

        // approve (bulletproof version);
        onApprove: async (data) => {

    console.log("APPROVED ORDER:", data.orderID);
    showLoader();

    try {
        const response = await fetch(`${BACKEND_URL}/capture-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                orderID: data.orderID,
                productId: product.id
            })
        });

        const result = await response.json();

        if (result.success) {
            console.log("CAPTURED & VERIFIED!");

            localStorage.setItem("paidProduct", JSON.stringify(product));
            localStorage.setItem("paidOrderID", data.orderID);

            window.location.href = "download.html";
        } else {
            alert("Payment failed.");
        }

    } catch (err) {
        console.error("ERROR:", err);
        alert("Server error.");
    }
},

        // order cancel;
        onCancel: () => {
            console.warn("Payment cancelled");
            alert("Payment cancelled.");
        },

        // error;
        onError: (err) => {
            console.error("PAYPAL ERROR:", err);
            alert("Payment error occurred.");
        }

    }).render("#paypal-button-container");

});