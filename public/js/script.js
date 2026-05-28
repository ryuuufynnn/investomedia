document.addEventListener('DOMContentLoaded', () => {

    // hamburger menu
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // image modal
    const modal = document.getElementById('imgModal');
    const modalImg = document.getElementById('modalImg');
    const closeBtn = document.querySelector('.close-modal');

    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const imgSrc = btn.dataset.img;
            modal.style.display = 'flex';
            modalImg.src = imgSrc;
        });
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.style.display = 'none';
    });

    // auto slider every 5 secs;
    const slider = document.querySelector('.products-section');

    setInterval(() => {
        if (slider) {
            if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: 320, behavior: 'smooth' });
            }
        }
    }, 5000);

    // free product;
    document.querySelectorAll(".free").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();

            const product = {
                id: btn.dataset.id,
                name: "The beginner's steps guide to digital products",
                price: 0
            };

            // Save as PAID (since free)
            localStorage.setItem("paidProduct", JSON.stringify(product));
            localStorage.setItem("paidOrderID", "FREE_" + product.id);

            // Go directly to download.html;
            window.location.href = "download.html";
        });
    });

    // paid products (3 items);
    document.querySelectorAll(".btn-buy").forEach(btn => {
        btn.addEventListener("click", () => {

            const product = {
                id: btn.dataset.id,
                name: btn.dataset.name,
                price: parseFloat(btn.dataset.price)
            };

            // Save selected product
            localStorage.setItem("selectedProduct", JSON.stringify(product));

            // Clear old payment data (important)
            localStorage.removeItem("paidProduct");
            localStorage.removeItem("paidOrderID");

            // Go to payment page
            window.location.href = "payment.html";
        });
    });

});


// optional function (reuse);
function buyProduct(id, name, price) {
    const product = { id, name, price };

    localStorage.setItem("selectedProduct", JSON.stringify(product));

    localStorage.removeItem("paidProduct");
    localStorage.removeItem("paidOrderID");

    window.location.href = "payment.html";
}