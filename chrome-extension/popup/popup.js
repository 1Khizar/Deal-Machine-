// Popup JavaScript for DealMachine Scraper Extension

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const registerForm = document.getElementById("registerForm");
  const dashboard = document.getElementById("dashboard");

  const showRegisterButton = document.getElementById("showRegister");
  const showLoginButton = document.getElementById("showLogin");

  const loginFormElement = document.getElementById("loginFormElement");
  const registerFormElement = document.getElementById("registerFormElement");

  const loginEmailInput = document.getElementById("loginEmail");
  const loginPasswordInput = document.getElementById("loginPassword");

  const registerFirstNameInput = document.getElementById("registerFirstName");
  const registerLastNameInput = document.getElementById("registerLastName");
  const registerEmailInput = document.getElementById("registerEmail");
  const registerPasswordInput = document.getElementById("registerPassword");

  const scrapeButton = document.getElementById("scrapeButton");
  const scraperStatus = document.getElementById("scraperStatus");
  const userNameDisplay = document.getElementById("userName");
  const userStatusDisplay = document.getElementById("userStatus");
  const logoutButton = document.getElementById("logoutButton");

  const statusIndicator = document.getElementById("statusIndicator");
  const statusDot = statusIndicator.querySelector(".status-dot");
  const statusText = statusIndicator.querySelector(".status-text");

  const toastContainer = document.getElementById("toastContainer");

  const API_BASE_URL = "https://leads-scraper2.onrender.com/api"; // Your backend API base URL

  function showToast(message, isSuccess) {
    const toast = document.createElement("div");
    toast.className = `toast ${isSuccess ? "success" : "error"}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${isSuccess ? "✓" : "✗"}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;
    toastContainer.appendChild(toast);

    // Add show class for animation
    setTimeout(() => toast.classList.add("show"), 10);

    // Remove toast after 3 seconds
    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function setOnlineStatus(isOnline) {
    if (isOnline) {
      statusDot.style.backgroundColor = "#00ff41"; // Cyberpunk green
      statusText.textContent = "ONLINE";
      statusIndicator.classList.add("online");
      statusIndicator.classList.remove("offline");
    } else {
      statusDot.style.backgroundColor = "#ff0040"; // Cyberpunk red
      statusText.textContent = "OFFLINE";
      statusIndicator.classList.add("offline");
      statusIndicator.classList.remove("online");
    }
  }

  async function checkAuthStatus() {
    try {
      const result = await chrome.storage.local.get("jwtToken");
      if (result.jwtToken) {
        const response = await fetch(`${API_BASE_URL}/auth/verify`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${result.jwtToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            showDashboard(data.user);
            setOnlineStatus(true);
            return;
          }
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    }

    showLoginForm();
    setOnlineStatus(false);
  }

  function showLoginForm() {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    dashboard.classList.add("hidden");
  }

  function showRegisterForm() {
    loginForm.classList.add("hidden");
    registerForm.classList.remove("hidden");
    dashboard.classList.add("hidden");
  }

  function showDashboard(user) {
    loginForm.classList.add("hidden");
    registerForm.classList.add("hidden");
    dashboard.classList.remove("hidden");
    userNameDisplay.textContent = `${user.firstName} ${user.lastName}`;
    userStatusDisplay.textContent = user.isApproved ? "APPROVED" : "PENDING";
    userStatusDisplay.className = user.isApproved
      ? "user-status approved"
      : "user-status pending";

    if (!user.isApproved) {
      scrapeButton.disabled = true;
      scraperStatus.textContent = "APPROVAL PENDING";
      scraperStatus.className = "scraper-status pending";
    } else {
      scrapeButton.disabled = false;
      scraperStatus.textContent = "READY";
      scraperStatus.className = "scraper-status ready";
    }
  }

  // Event Listeners
  showRegisterButton.addEventListener("click", (e) => {
    e.preventDefault();
    showRegisterForm();
  });

  showLoginButton.addEventListener("click", (e) => {
    e.preventDefault();
    showLoginForm();
  });

  loginFormElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = loginEmailInput.value.trim();
    const password = loginPasswordInput.value;

    if (!email || !password) {
      showToast("Please fill in all fields.", false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        await chrome.storage.local.set({ jwtToken: data.token });
        showToast("Authentication successful!", true);
        setTimeout(() => checkAuthStatus(), 500);
      } else {
        showToast(data.message || "Authentication failed.", false);
      }
    } catch (error) {
      console.error("Login error:", error);
      showToast("Network error. Server offline.", false);
      setOnlineStatus(false);
    }
  });

  registerFormElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const firstName = registerFirstNameInput.value.trim();
    const lastName = registerLastNameInput.value.trim();
    const email = registerEmailInput.value.trim();
    const password = registerPasswordInput.value;

    if (!firstName || !lastName || !email || !password) {
      showToast("Please fill in all fields.", false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast("Registration successful! Awaiting admin approval.", true);
        // Clear form
        registerFormElement.reset();
        setTimeout(() => showLoginForm(), 1000);
      } else {
        showToast(data.message || "Registration failed.", false);
      }
    } catch (error) {
      console.error("Registration error:", error);
      showToast("Network error. Server offline.", false);
      setOnlineStatus(false);
    }
  });

  logoutButton.addEventListener("click", async (e) => {
    e.preventDefault();
    await chrome.storage.local.remove("jwtToken");
    showToast("Session terminated.", true);
    showLoginForm();
    setOnlineStatus(false);
  });
  // … earlier code unchanged …

  // popup.js
  scrapeButton.addEventListener("click", async (e) => {
    e.preventDefault();
    const { jwtToken } = await chrome.storage.local.get("jwtToken");
    if (!jwtToken) {
      showToast("Authentication required.", false);
      return;
    }

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab.url.includes("app.dealmachine.com/leads")) {
      showToast("Navigate to the Leads page first.", false);
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "executeScraperInContent", token: jwtToken },
      (resp) => {
        if (chrome.runtime.lastError) {
          showToast("Comm error. Try refreshing the page.", false);
        } else if (resp.success) {
          showToast(`Found ${resp.count} wireless numbers!`, true);
        } else {
          showToast(`Scrape failed: ${resp.error}`, false);
        }
      }
    );
  });

  // Initialize popup
  checkAuthStatus();
});
