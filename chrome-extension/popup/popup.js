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

  const API_BASE_URL = "https://deal-machine-scraper.onrender.com/api";

  function showToast(message, isSuccess) {
    console.log(`Toast: ${message} (${isSuccess ? 'success' : 'error'})`);
    const toast = document.createElement("div");
    toast.className = `toast ${isSuccess ? "success" : "error"}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${isSuccess ? "✓" : "✗"}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add("show"), 10);

    setTimeout(() => {
      toast.classList.remove("show");
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  function setOnlineStatus(isOnline) {
    if (isOnline) {
      statusDot.style.backgroundColor = "#00ff41";
      statusText.textContent = "ONLINE";
      statusIndicator.classList.add("online");
      statusIndicator.classList.remove("offline");
    } else {
      statusDot.style.backgroundColor = "#ff0040";
      statusText.textContent = "OFFLINE";
      statusIndicator.classList.add("offline");
      statusIndicator.classList.remove("online");
    }
  }

  // Log scraping session to backend
  async function logScrapingSession(dataCount, status, jwt) {
    try {
      const response = await fetch(`${API_BASE_URL}/scraping/log`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ dataCount, status }),
      });

      if (!response.ok) {
        console.error("Failed to log scraping session:", response.status);
      } else {
        console.log("✅ Scraping session logged successfully");
      }
    } catch (err) {
      console.error("Error logging scraping session:", err);
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
        } else {
          await chrome.storage.local.remove("jwtToken");
        }
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      setOnlineStatus(false);
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
        showToast(data.error || data.message || "Authentication failed.", false);
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
        registerFormElement.reset();
        setTimeout(() => showLoginForm(), 1000);
      } else {
        showToast(data.error || data.message || "Registration failed.", false);
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

  scrapeButton.addEventListener("click", async (e) => {
    e.preventDefault();
    console.log("Scrape button clicked");
    
    const { jwtToken } = await chrome.storage.local.get("jwtToken");
    console.log("JWT Token exists:", !!jwtToken);
    
    if (!jwtToken) {
      showToast("Authentication required.", false);
      return;
    }

    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];
    
    console.log("Current tab URL:", tab?.url);

    if (!tab || !tab.url) {
      showToast("Cannot detect current tab.", false);
      return;
    }

    if (!tab.url.includes("app.dealmachine.com/leads")) {
      showToast("Navigate to the Leads page first.", false);
      return;
    }

    scrapeButton.disabled = true;
    scraperStatus.textContent = "SCRAPING...";
    scraperStatus.className = "scraper-status scraping";
    showToast("Starting scrape...", true);

    console.log("Attempting to send message to content script...");

    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      console.log("Content script injected");
    } catch (err) {
      console.log("Content script injection failed (may already be loaded):", err.message);
    }

    setTimeout(() => {
      chrome.tabs.sendMessage(
        tab.id,
        { action: "executeScraperInContent", token: jwtToken },
        async (resp) => {
          console.log("Response from content script:", resp);

          scrapeButton.disabled = false;
          scraperStatus.textContent = "READY";
          scraperStatus.className = "scraper-status ready";

          if (chrome.runtime.lastError) {
            console.error("Chrome runtime error:", chrome.runtime.lastError);
            showToast("Communication error. Refresh page and try again.", false);
          } else if (resp) {
            // Log to backend if needed
            if (resp.shouldLog && resp.logData) {
              await logScrapingSession(
                resp.logData.dataCount,
                resp.logData.status,
                resp.logData.jwt
              );
            }

            // Show result to user
            if (resp.success) {
              showToast(`Success! Found ${resp.count} wireless numbers!`, true);
            } else {
              showToast(`Scrape failed: ${resp.error}`, false);
            }
          } else {
            showToast("Scrape failed: No response from content script", false);
          }
        }
      );
    }, 500);
  });

  checkAuthStatus();
});