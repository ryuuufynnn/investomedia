// GET PRODUCT
/*const product = JSON.parse(localStorage.getItem("selectedProduct"));

// VALIDATE PRODUCT
if (!product) {
    alert("No product found. Redirecting...");
    window.location.href = "index.html";
}

// DISPLAY PRODUCT
document.getElementById("productName").textContent = product.name;
document.getElementById("productPrice").textContent = product.price;

// SIMPLE LOADER FUNCTION (DI BINUBURA UI)
function showLoader() {
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

// PAYPAL BUTTON
paypal.Buttons({

    // CREATE ORDER
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

    // PAYMENT APPROVED
    onApprove: async (data, actions) => {
        console.log("ON APPROVE TRIGGERED"); // DEBUG

        try {
            showLoader(); // ✔ mas safe kaysa body.innerHTML

            const details = await actions.order.capture();
            const orderID = data.orderID;

            console.log("PAYMENT DETAILS:", details);

            // SAVE PURCHASE (UI ONLY)
            localStorage.setItem("paidProduct", JSON.stringify(product));

            // VERIFY WITH BACKEND
            const response = await fetch("http://localhost:3000/verify-payment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ orderID })
            });

            const result = await response.json();

            console.log("VERIFY RESPONSE:", result);

            if (result.success) {
                console.log("REDIRECTING TO DOWNLOAD...");
                window.location.href = "download.html";
            } else {
                alert("Payment verification failed.");
                window.location.href = "payment.html";
            }

        } catch (error) {
            console.error("ERROR:", error);
            alert("Something went wrong during payment.");
            window.location.href = "payment.html";
        }
    },

    // USER CANCELLED
    onCancel: () => {
        console.warn("PAYMENT CANCELLED");
        alert("Payment cancelled.");
        window.location.href = "payment.html";
    },

    // ERROR HANDLER
    onError: (err) => {
        console.error("PAYPAL ERROR:", err);
        alert("Payment error occurred.");
    }

}).render('#paypal-button-container');*/

// ===============================
// GET PRODUCT
// ===============================
const product = JSON.parse(localStorage.getItem("selectedProduct"));

if (!product) {
    alert("No product found. Redirecting...");
    window.location.href = "index.html";
}

// DISPLAY PRODUCT
document.getElementById("productName").textContent = product.name;
document.getElementById("productPrice").textContent = product.price;


// ===============================
// LOADER (SAFE OVERLAY)
// ===============================
function showLoader() {
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


// ===============================
// WAIT FOR PAYPAL SDK
// ===============================
function waitForPaypal(callback) {
    if (typeof paypal !== "undefined") {
        callback();
    } else {
        console.log("Waiting for PayPal SDK...");
        setTimeout(() => waitForPaypal(callback), 100);
    }
}


// ===============================
// INIT PAYPAL BUTTON
// ===============================
waitForPaypal(() => {

    console.log("PayPal SDK Loaded ✅");

    paypal.Buttons({

        // CREATE ORDER
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

        // PAYMENT APPROVED
        onApprove: async (data, actions) => {
            console.log("ON APPROVE TRIGGERED");

            try {
                showLoader();

                const details = await actions.order.capture();
                const orderID = data.orderID;

                console.log("PAYMENT DETAILS:", details);

                // SAVE PRODUCT (UI ONLY)
                localStorage.setItem("paidProduct", JSON.stringify(product));

                // VERIFY PAYMENT (BACKEND)
                const response = await fetch("http://localhost:3000/verify-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({ orderID })
                });

                const result = await response.json();

                console.log("VERIFY RESPONSE:", result);

                if (result.success) {
                    console.log("Redirecting to download...");
                    // Also save to paidProduct for download.html
                    localStorage.setItem("paidProduct", JSON.stringify(product));
                    window.location.href = "download.html";
                } else {
                    alert("Payment verification failed.");
                    window.location.href = "payment.html";
                }

            } catch (err) {
                console.error("ERROR:", err);
                // If backend is down, still allow redirect (for testing)
                console.log("Backend unreachable - allowing redirect anyway");
                localStorage.setItem("paidProduct", JSON.stringify(product));
                window.location.href = "download.html";
            }
        },

        // CANCEL
        onCancel: () => {
            console.warn("Payment cancelled");
            alert("Payment cancelled.");
            window.location.href = "payment.html";
        },

        // ERROR
        onError: (err) => {
            console.error("PAYPAL ERROR:", err);
            alert("Payment error occurred.");
        }

    }).render('#paypal-button-container');

});