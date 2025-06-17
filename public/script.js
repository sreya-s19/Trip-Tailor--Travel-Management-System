// script.js -

// ----Google Translate ----
function googleTranslateElementInit() {
    new google.translate.TranslateElement(
        {
            pageLanguage: 'en',
            includedLanguages: 'en,fr,ar,hi,ml,es,de,zh-CN,ta,bn',
            layout: google.translate.TranslateElement.InlineLayout.SIMPLE
        },
        'google_translate_element'
    );
}

let cart = JSON.parse(sessionStorage.getItem('cart')) || [];
function saveCart() { sessionStorage.setItem('cart', JSON.stringify(cart)); }

function generateCaptcha() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789abcdefghijklmnopqrstuvwxyz";
    let captcha = ""; for (let i = 0; i < 6; i++) { captcha += chars.charAt(Math.floor(Math.random() * chars.length)); } return captcha;
}

function generateAndSetCaptcha(modalId) {
    const modal = document.getElementById(modalId); if (!modal) return; const newCaptcha = generateCaptcha(); modal.dataset.captcha = newCaptcha;
    const captchaTextElement = modal.querySelector('.captcha-text');
    if (captchaTextElement) captchaTextElement.textContent = newCaptcha;
}

function openModal(modalId) {
    const modal = document.getElementById(modalId); if (!modal) { console.error(`Modal with ID ${modalId} not found`); return; }
    modal.style.display = "flex"; generateAndSetCaptcha(modalId);
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId); if (!modal) return;
    modal.style.display = "none";
    const inputs = modal.querySelectorAll("input");
    inputs.forEach(input => { if (input.type !== 'submit') input.value = ""; });
}

window.onclick = function(event) { if (event.target.className === 'modal') { event.target.style.display = 'none'; } }

// --- Custom Alert Functionality ---
function showCustomAlert(message, title = "Trip Tailor") {
    const alertModal = document.getElementById('custom-alert-modal');
    const alertTitle = document.getElementById('custom-alert-title');
    const alertMessage = document.getElementById('custom-alert-message');
    if (alertModal && alertTitle && alertMessage) {
        alertTitle.textContent = title;
        alertMessage.textContent = message;
        alertModal.style.display = 'flex';
    }
}

function hideCustomAlert() {
    const alertModal = document.getElementById('custom-alert-modal');
    if (alertModal) {
        alertModal.style.display = 'none';
    }
}


// --- Secure Auth Functions ---
async function handleSignIn(event) {
    event.preventDefault();
    const modal = document.getElementById("signUpModal");
    const captchaValue = modal.dataset.captcha;
    const name = document.getElementById("signUp-name").value.trim();
    const email = document.getElementById("signUp-email").value.trim();
    const username = document.getElementById("signUp-username").value.trim();
    const password = document.getElementById("signUp-password").value.trim();
    const captchaInput = document.getElementById("signUp-captcha-input").value.trim();

    if (!name || !email || !username || !password || !captchaInput) {
        return showCustomAlert("Please fill all fields.", "Incomplete Form");
    }
    if (captchaInput !== captchaValue) {
        generateAndSetCaptcha("signUpModal");
        document.getElementById("signUp-captcha-input").value = "";
        return showCustomAlert("Incorrect CAPTCHA. Please try again.", "Error");
    }

    try {
        const response = await fetch('/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, username, password }),
        });
        const responseData = await response.json();
        if (!response.ok) {
            throw new Error(responseData.message || 'Registration failed.');
        }
        showCustomAlert(`A confirmation email is on its way to ${email}.`, `Account Created for ${name}!`);
        closeModal("signUpModal");
        setUserAuthenticated(responseData);
    } catch (error) {
        showCustomAlert(error.message, "Registration Error");
    }
}

async function handleLogIn(event) {
    event.preventDefault();
    const modal = document.getElementById("logInModal");
    const captchaValue = modal.dataset.captcha;
    const username = document.getElementById("logIn-username").value.trim();
    const password = document.getElementById("logIn-password").value.trim();
    const captchaInput = document.getElementById("logIn-captcha-input").value.trim();

    if (!username || !password || !captchaInput) {
        return showCustomAlert("Please fill all fields.", "Incomplete Form");
    }
    if (captchaInput !== captchaValue) {
        generateAndSetCaptcha("logInModal");
        document.getElementById("logIn-captcha-input").value = "";
        return showCustomAlert("Incorrect CAPTCHA. Please try again.", "Error");
    }

    try {
        const response = await fetch('/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const userData = await response.json();
        if (!response.ok) {
            throw new Error(userData.message || 'Login failed.');
        }
        showCustomAlert(`You are now logged in.`, `Welcome Back, ${userData.name}!`);
        closeModal("logInModal");
        setUserAuthenticated(userData);
    } catch (error) {
        showCustomAlert(error.message, "Login Error");
    }
}

function setUserAuthenticated(userData) {
    sessionStorage.setItem("authenticatedUser", JSON.stringify(userData));
    document.getElementById("sign-in-btn").style.display = "none";
    document.getElementById("log-in-btn").style.display = "none";
    document.getElementById("cart-icon").style.display = "flex";
    document.getElementById("menuToggle").style.display = "flex";
    const menuUsername = document.getElementById("menuUsername");
    if (menuUsername) {
        menuUsername.textContent = userData.name;
    }
    console.log(`User authenticated: ${userData.username}`);
}

function logoutUser() {
    sessionStorage.removeItem("authenticatedUser");
    sessionStorage.removeItem("cart");
    cart = [];
    updateCartBadge();
    showCustomAlert("You have been logged out successfully.", "Logged Out");
    // A simple page reload.
    window.location.reload();
}

function toggleSideMenu() {
    const sideMenu = document.getElementById("sideMenu");
    sideMenu.style.display = sideMenu.style.display === "block" ? "none" : "block";
}

function setupSideMenuClose() {
    window.addEventListener("click", function(e) {
        const sideMenu = document.getElementById("sideMenu");
        const menuToggle = document.getElementById("menuToggle");
        if (sideMenu && menuToggle && !sideMenu.contains(e.target) && !menuToggle.contains(e.target)) {
            sideMenu.style.display = "none";
        }
    });
}

async function showMyOrders() {
    const userJSON = sessionStorage.getItem('authenticatedUser');
    if (!userJSON) { return showCustomAlert("Please log in to view your orders.", "Login Required"); }
    const user = JSON.parse(userJSON);

    try {
        const response = await fetch(`/api/orders/${user.username}`);
        if (!response.ok) throw new Error("Could not fetch orders.");
        const orders = await response.json();
        const ordersList = document.getElementById('my-orders-list');
        if (!ordersList) { return console.error('My Orders list container not found!'); }
        let ordersHTML = orders.length === 0 ? '<p>You have no past orders.</p>' : '';
        orders.forEach(order => {
            let itemsHTML = order.items.map(item => `<li>${item.title} - $${item.price.toFixed(2)}</li>`).join('');
            ordersHTML += `<div class="order-card" style="background-color: #2a2a2a; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;"><h4 style="margin-bottom: 0.5rem; color: #0a9396;">Order ID: ${order.orderId}</h4><p>Date: ${new Date(order.purchaseDate).toLocaleDateString()}</p><ul style="list-style-type: none; padding-left: 0; margin: 0.5rem 0;">${itemsHTML}</ul><p style="text-align: right;"><strong>Total: $${order.totalAmount.toFixed(2)}</strong></p></div>`;
        });
        ordersList.innerHTML = ordersHTML;
        showSection('my-orders');
    } catch (error) {
        showCustomAlert(error.message, "Error");
    }
}

function showAccountDetails() {
    const userJSON = sessionStorage.getItem('authenticatedUser');
    if (!userJSON) { return showCustomAlert("Please log in to view your account details.", "Login Required"); }
    const userData = JSON.parse(userJSON);
    document.getElementById('account-name').textContent = userData.name;
    document.getElementById('account-username').textContent = userData.username;
    document.getElementById('account-email').textContent = userData.email;
    showSection('account-details');
}

// ----Adding to cart---
function addToCart(type, title, description, price) {
    const userJSON = sessionStorage.getItem('authenticatedUser');
    
    // If there is no user in sessionStorage, they are not logged in.
    if (!userJSON) {
        // Shows a helpful message and open the login modal.
        showCustomAlert("You need to log in or create an account to add items to your cart.", "Login Required");
        openModal('logInModal'); // Guides the user to the next logical step.
        return; 
    }
    // --- END OF THE CHECK ---

    // This code will ONLY run if the user is logged in.
    cart.push({ id: Date.now(), type, title, description, price }); 
    saveCart(); 
    updateCartBadge(); 
    showCustomAlert(`${title} has been added to your cart!`, "Item Added");
}

function removeFromCart(itemId) {
    cart = cart.filter(item => item.id !== itemId); saveCart(); updateCartDisplay(); updateCartBadge();
}

function openCart() {
    let cartModal = document.getElementById("cartModal"); if (!cartModal) { cartModal = createCartModal(); document.body.appendChild(cartModal); }
    cartModal.style.display = "flex"; updateCartDisplay();
}

function createCartModal() {
    const modal = document.createElement("div"); modal.id = "cartModal"; modal.className = "modal";
    modal.innerHTML = `<div class="modal-content" style="background-color: #1f1f1f; color: white;"><span class="close-btn" onclick="closeCart()" style="color: white; float: right; font-size: 28px; font-weight: bold; cursor: pointer;">×</span><h2>🛒 Your Cart</h2><div id="cart-items"><p>Your cart is empty!</p></div><div id="cart-total" style="margin-top: 20px; font-weight: bold;">Total: $0</div><button onclick="proceedToCheckout()" style="margin-top: 20px; width: 100%; padding: 12px; background-color: #0a9396; color: white; border: none; border-radius: 5px; cursor: pointer;">Proceed to Checkout</button></div>`;
    return modal;
}

function closeCart() {
    const cartModal = document.getElementById("cartModal"); if (cartModal) cartModal.style.display = "none";
}

function updateCartDisplay() {
    const cartItems = document.getElementById("cart-items"); const cartTotal = document.getElementById("cart-total");
    if (!cartItems || !cartTotal) return;
    if (cart.length === 0) { cartItems.innerHTML = "<p>Your cart is empty!</p>"; cartTotal.innerHTML = "Total: $0"; return; }
    let cartHTML = ""; let total = 0;
    cart.forEach(item => {
        total += item.price;
        cartHTML += `<div class="cart-item" style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #444; padding: 10px 0;"><div><h4>${item.title}</h4><p style="font-size: 0.9rem; color: #ccc;">${item.description}</p></div><div style="min-width: 60px; text-align: right;">$${item.price.toFixed(2)}</div><button class="remove-btn" onclick="removeFromCart(${item.id})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; margin-left: 1rem;">Remove</button></div>`;
    });
    cartItems.innerHTML = cartHTML; cartTotal.innerHTML = `Total: $${total.toFixed(2)}`;
}

function proceedToCheckout() {
    if (cart.length === 0) { return showCustomAlert("Your cart is empty!", "Empty Cart"); }
    closeCart(); showSection('payment');
}

async function handleFinalPayment() {
    const userJSON = sessionStorage.getItem('authenticatedUser');
    if (!userJSON) { return showCustomAlert("You must be logged in to complete the purchase.", "Login Required"); }
    const user = JSON.parse(userJSON);

    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    try {
        const response = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username, items: cart.map(i => ({ title: i.title, type: i.type, price: i.price })), totalAmount: totalAmount }), });
        if (!response.ok) { const errorData = await response.json(); throw new Error(errorData.message || 'Could not process the order.'); }
        const newOrder = await response.json();
        cart = []; saveCart(); updateCartBadge();
        sessionStorage.setItem('latestOrder', JSON.stringify(newOrder));
        window.location.href = 'order-summary.html';
    } catch (error) {
        console.error('Final Payment Error:', error); showCustomAlert(error.message, "Payment Error");
    }
}

function updateCartBadge() {
    const cartBadge = document.getElementById("cart-badge");
    if (cartBadge) { if (cart.length > 0) { cartBadge.textContent = cart.length; cartBadge.style.display = "flex"; } else { cartBadge.style.display = "none"; } }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(sec => sec.classList.remove('active'));
    const targetSection = document.getElementById(sectionId);
    if (targetSection) { targetSection.classList.add('active'); window.scrollTo({ top: targetSection.offsetTop - 80, behavior: 'smooth' }); }
    const sideMenu = document.getElementById("sideMenu"); if (sideMenu) sideMenu.style.display = "none";
}

async function submitFeedback() {
    const feedbackMessage = document.getElementById('feedback-message')?.value.trim();
    if (!feedbackMessage) {
        return showCustomAlert('Please enter your feedback before submitting.', "Empty Feedback");
    }
    const userJSON = sessionStorage.getItem('authenticatedUser');
    if (!userJSON) {
        return showCustomAlert('You must be logged in to submit feedback.', "Login Required");
    }
    const user = JSON.parse(userJSON);
    try {
        const response = await fetch('/api/feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: user.username, message: feedbackMessage }),
        });
        if (!response.ok) {
            throw new Error('Failed to submit feedback. Please try again later.');
        }
        showCustomAlert('Your feedback has been sent successfully.', 'Thank You!');
        document.getElementById('feedback-message').value = '';
    } catch (error) {
        console.error('Feedback submission error:', error);
        showCustomAlert(error.message, "Error");
    }
}

function toggleChatbot() {
    const chatbot = document.getElementById('chatbot-box');
    if (chatbot) chatbot.style.display = chatbot.style.display === 'flex' ? 'none' : 'flex';
}

function sendMessage(e) {
    if (e.key === "Enter") {
        const input = document.getElementById("chatbot-input"); const message = input.value.trim();
        if (message) {
            const messages = document.getElementById("chatbot-messages"); messages.innerHTML += `<div><strong>You:</strong> ${message}</div>`; input.value = ""; let response = ''; const userMessage = message.toLowerCase();
            if (/hello|hi|hey/.test(userMessage)) response = 'Hi there! How can I assist you today?';
            else if (/flight/.test(userMessage)) response = 'Sure! I can help with flight bookings. What destination are you interested in?';
            else if (/hotel/.test(userMessage)) response = 'Looking for a hotel? What city are you traveling to?';
            else if (/payment/.test(userMessage)) response = 'You can proceed to the Payment section using the navigation above.';
            else if (/contact/.test(userMessage)) response = 'You can reach us at +91 89217 16475 or support@triptailor.com.';
            else if (/feedback/.test(userMessage)) response = 'We value your feedback! Please visit the Feedback section to submit yours.';
            else response = 'Sorry, I didn\'t understand that. Please try asking something else!';
            messages.innerHTML += `<div><strong>Bot:</strong> ${response}</div>`; messages.scrollTop = messages.scrollHeight;
        }
    }
}

document.addEventListener("DOMContentLoaded", function() {
    setupSideMenuClose();
    const cartIcon = document.getElementById("cart-icon");
    if (cartIcon) cartIcon.addEventListener("click", openCart);
    const menuToggle = document.getElementById("menuToggle");
    if (menuToggle) menuToggle.addEventListener("click", toggleSideMenu);
    
    // Setup for custom alert OK button
    const alertOkBtn = document.getElementById('custom-alert-ok-btn');
    if (alertOkBtn) {
        alertOkBtn.addEventListener('click', hideCustomAlert);
    }
    
    // Checks if user is already logged in from a previous session
    const userJSON = sessionStorage.getItem("authenticatedUser");
    if (userJSON) {
        const userData = JSON.parse(userJSON);
        setUserAuthenticated(userData);
    }
    
    updateCartBadge();
    console.log("Trip Tailor application initialized successfully!");
});