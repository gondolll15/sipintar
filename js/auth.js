/* =================================
   SIPINTAR - LOGIN ADMIN
================================= */

const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "sipintar123";

const loginForm = document.getElementById("login-form");
const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("login-message");

const loginScreen = document.getElementById("login-screen");
const dashboardScreen = document.getElementById("dashboard-screen");
const logoutButton = document.getElementById("logout-button");

// Proses login
loginForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    if (
        username === ADMIN_USERNAME &&
        password === ADMIN_PASSWORD
    ) {

        loginMessage.textContent = "Login berhasil!";
        loginMessage.style.color = "green";

        loginScreen.classList.add("hidden");
        dashboardScreen.classList.remove("hidden");

    } else {

        loginMessage.textContent =
            "Username atau password salah!";

        loginMessage.style.color = "red";

    }

});

// Proses logout
logoutButton.addEventListener("click", function() {

    dashboardScreen.classList.add("hidden");
    loginScreen.classList.remove("hidden");

    loginForm.reset();
    loginMessage.textContent = "";

});