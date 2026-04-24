// Load product
const product = JSON.parse(localStorage.getItem("selectedProduct"));

document.getElementById("productName").textContent = product.name;
document.getElementById("productPrice").textContent = product.price;

/*function payNow() {
    const selected = document.querySelector('input[name="payment"]:checked');

    if (!selected) {
        alert("Select payment method");
        return;
    }

    if (selected.value === "paypal") {
        document.getElementById("paypal-button-container").style.display = "block";
    }
}*/
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

/*document.querySelectorAll('input[name="payment"]').forEach(input => {
    input.addEventListener('change', () => {
        if (input.value === "paypal") {
            document.getElementById("paypal-button-container").style.display = "block";
        } else {
            document.getElementById("paypal-button-container").style.display = "none";
        }
    });
});*/

// paypal integration;
paypal.Buttons({
    createOrder: function(data, actions) {
        return actions.order.create({
            purchase_units: [{
                amount: {
                    value: product.price.toString()
                }
            }]
        });
    },
    onApprove: function(data, actions) {
        return actions.order.capture().then(function(details) {
            alert("Payment successful by " + details.payer.name.given_name);
        });
    }
}).render('#paypal-button-container');