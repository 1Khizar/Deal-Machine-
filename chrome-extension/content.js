// content.js
console.log("DealMachine Scraper Content Script Loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "executeScraperInContent") return;

  const jwt = request.token;
  const siteToken = localStorage.getItem("token");

  if (!jwt || !siteToken) {
    sendResponse({ success: false, count: 0, error: "Missing tokens" });
    return;
  }

  // Fetch one page of leads via backend proxy
  async function fetchLeadsPage(page, pageSize = 100) {
    const res = await fetch("https://deal-machine-scraper.onrender.com/api/leads", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ token: siteToken, page, pageSize }),
    });

    if (!res.ok) throw new Error(`Backend API error ${res.status}`);
    return res.json();
  }

  (async () => {
    try {
      const pageSize = 100;
      let page = 1;
      const seen = new Set();
      let total = 0;

      // CSV header
      const rows = [
        ["Street", "City", "State", "Zip", "PhoneNumber", "FirstName", "LastName"],
      ];

      while (true) {
        const json = await fetchLeadsPage(page, pageSize);
        const props = (json.results && json.results.properties) || [];
        console.log(`⏳ Page ${page}: got ${props.length} properties`);
        if (props.length === 0) break;

        for (const p of props) {
          const street = p.property_address || "";
          const city = p.property_address_city || "";
          const state = p.property_address_state || "";
          const zip = p.property_address_zip || "";

          for (const ph of p.phone_numbers || []) {
            const carrier = (ph.carrier || "").toLowerCase();
            if (ph.type === "W" && carrier.includes("wireless")) {
              const c = ph.contact || {};
              for (const key of ["phone_1", "phone_2", "phone_3"]) {
                const num = c[key];
                if (num && !seen.has(num)) {
                  seen.add(num);
                  total++;
                  rows.push([street, city, state, zip, num, c.given_name || "", c.surname || ""]);
                }
              }
            }
          }
        }

        if (props.length < pageSize) break;
        page++;
      }

      console.log(`🎉 Done — unique wireless = ${total}`);

      // Build CSV
      const csvText = rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(",")).join("\r\n");
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `dealmachine_wireless_${total}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      // Log session to backend
      await fetch("https://deal-machine-scraper.onrender.com/api/scraping/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ dataCount: total, status: "completed" }),
      });

      sendResponse({ success: true, count: total });

    } catch (err) {
      console.error("🚨 Scraper Error:", err);

      await fetch("https://deal-machine-scraper.onrender.com/api/scraping/log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ dataCount: 0, status: "failed" }),
      });

      sendResponse({ success: false, count: 0, error: err.message });
    }
  })();

  return true;
});
