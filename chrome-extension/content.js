// content.js
console.log("DealMachine Scraper Content Script Loaded.");

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action !== "executeScraperInContent") {
    return;
  }

  const jwt = request.token;
  const siteToken = localStorage.getItem("token");

  if (!jwt || !siteToken) {
    console.error("Missing tokens - JWT:", !!jwt, "Site Token:", !!siteToken);
    sendResponse({ success: false, count: 0, error: "Missing authentication tokens" });
    return true;
  }

  console.log("🚀 Starting scraper with tokens...");

  // Fetch one page of leads
  async function fetchLeadsPage(page, pageSize = 100) {
    const payload = {
      token: siteToken,
      sort_by: "date_created_desc",
      limit: pageSize,
      begin: (page - 1) * pageSize,
      search: "",
      search_type: "address",
      filters: null,
      old_filters: null,
      list_id: "all_leads",
      list_history_id: null,
      get_updated_data: false,
      property_flags: "",
      property_flags_and_or: "or",
    };

    const res = await fetch("https://api.dealmachine.com/v2/leads/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`DealMachine API error ${res.status}`);
    }

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
        [
          "Street",
          "City",
          "State",
          "Zip",
          "PhoneNumber",
          "FirstName",
          "LastName",
        ],
      ];

      console.log("📊 Starting to fetch leads...");

      while (true) {
        console.log(`⏳ Fetching page ${page}...`);
        const json = await fetchLeadsPage(page, pageSize);
        const props = (json.results && json.results.properties) || [];
        
        console.log(`📄 Page ${page}: got ${props.length} properties`);

        if (props.length === 0) {
          console.log("✅ No more properties, stopping pagination");
          break;
        }

        for (const p of props) {
          const street = p.property_address || "";
          const city = p.property_address_city || "";
          const state = p.property_address_state || "";
          const zip = p.property_address_zip || "";

          const phoneNumbers = p.phone_numbers || [];
          
          for (const ph of phoneNumbers) {
            // Only wireless AND carrier contains "Wireless"
            const carrier = (ph.carrier || "").toLowerCase();
            const isWireless = ph.type === "W" && carrier.includes("wireless");

            if (isWireless) {
              const c = ph.contact || {};
              for (const key of ["phone_1", "phone_2", "phone_3"]) {
                const num = c[key];
                if (num && !seen.has(num)) {
                  seen.add(num);
                  total++;
                  rows.push([
                    street,
                    city,
                    state,
                    zip,
                    num,
                    c.given_name || "",
                    c.surname || "",
                  ]);
                }
              }
            }
          }
        }

        if (props.length < pageSize) {
          console.log("✅ Last page reached");
          break;
        }
        
        page++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      console.log(`🎉 Scraping complete! Total unique wireless numbers: ${total}`);

      if (total === 0) {
        console.warn("⚠️ No wireless numbers found");
        sendResponse({ 
          success: false, 
          count: 0, 
          error: "No wireless numbers found in your leads",
          shouldLog: true,
          logData: { dataCount: 0, status: "completed", jwt }
        });
        return;
      }

      // Build CSV text
      const csvText = rows
        .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
        .join("\r\n");

      // Trigger CSV download
      const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const timestamp = new Date().toISOString().slice(0, 10);
      link.href = URL.createObjectURL(blob);
      link.download = `dealmachine_wireless_${timestamp}_${total}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();

      console.log("💾 CSV file downloaded");

      // Send success response with logging info
      sendResponse({ 
        success: true, 
        count: total,
        shouldLog: true,
        logData: { dataCount: total, status: "completed", jwt }
      });

    } catch (err) {
      console.error("🚨 Scraper Error:", err);
      
      sendResponse({ 
        success: false, 
        count: 0, 
        error: err.message || "Unknown error occurred",
        shouldLog: true,
        logData: { dataCount: 0, status: "failed", jwt }
      });
    }
  })();

  return true; // keep the message channel open for async response
});