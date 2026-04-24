document.addEventListener('DOMContentLoaded', () => {
    // 1. Hamburger Menu Toggle
    const hamburger = document.getElementById('hamburger');
    const navMenu = document.getElementById('nav-menu');

    hamburger.addEventListener('click', () => {
        navMenu.classList.toggle('active');
    });

    // Close menu when a link is clicked
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
        });
    });

    // 2. View Modal Logic
    const modal = document.getElementById('imgModal');
    const modalImg = document.getElementById('modalImg');
    const closeBtn = document.querySelector('.close-modal');

    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const imgSrc = e.target.getAttribute('data-img');
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

    // 3. Auto-Slide for Products
    const slider = document.querySelector('.products-section');
    let isDown = false;
    let startX;
    let scrollLeft;

    // Optional: Auto-slide timer
    setInterval(() => {
        if(!isDown) {
            if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth) {
                slider.scrollTo({ left: 0, behavior: 'smooth' });
            } else {
                slider.scrollBy({ left: 320, behavior: 'smooth' });
            }
        }
    }, 5000);
});

// order section
function showOrder() {
    let orderBox = document.getElementById('orderSection');

    orderBox.style.display = 'block';
}

function placeOrder() {
    let payment = document.getElementById('input[name="payment"]:checked');
    if(payment) {
        alert('Order placed! Payment: ' + payment.value);
    } else {
        alert('Choose a payment method');
    }
}