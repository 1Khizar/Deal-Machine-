// Background service worker for DealMachine Scraper Extension

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "startScraping") {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.url.includes("dealmachine.com")) {
        sendResponse({
          success: false,
          error: "Please navigate to dealmachine.com first.",
        });
        return;
      }

      if (!request.token) {
        sendResponse({
          success: false,
          error: "Missing authentication token.",
        });
        return;
      }

      chrome.tabs.sendMessage(
        tab.id,
        { action: "executeScraper", token: request.token },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "Error forwarding to content script:",
              chrome.runtime.lastError
            );
            sendResponse({
              success: false,
              error: chrome.runtime.lastError.message,
            });
          } else {
            sendResponse(response);
          }
        }
      );
    });
    return true; // keep message channel open for async sendResponse
  }

  if (request.action === "checkAuth") {
    chrome.storage.local.get(["authToken"], (result) => {
      sendResponse({
        isAuthenticated: !!result.authToken,
        token: result.authToken,
      });
    });
    return true;
  }

  if (request.action === "saveAuth") {
    chrome.storage.local.set(
      {
        authToken: request.token,
        userInfo: request.userInfo,
      },
      () => {
        sendResponse({ success: true });
      }
    );
    return true;
  }

  if (request.action === "logout") {
    chrome.storage.local.clear(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

chrome.runtime.onInstalled.addListener(() => {
  console.log("DealMachine Scraper Extension installed");
});
