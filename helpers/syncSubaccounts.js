// helpers/syncSubaccounts.js
const Subaccount = require("../models/locations");

// async function syncSubaccounts(accessToken, agencyId) {
//   try {
//     const response = await fetch(`https://services.leadconnectorhq.com`, {
//       headers: { Authorization: `Bearer ${accessToken}` },
//     });
//         if (!response.ok) {
//       console.error("❌ Failed to fetch subaccounts:", response.status, await response.text());
//       return;
//     }

//     const data = await response.json();
//     console.log("subaccounts data:", data);
//     if (!data || !data.locations) {
//       console.error("❌ No subaccounts found:", data);
//       return;
//     }

//     const subaccounts = data.locations.map(loc => ({
//       agencyId,
//       subAccountId: loc.id,
//       name: loc.name,
//       email: loc.email,
//     }));

//     // 🧠 Upsert subaccounts (avoid duplicates)
//     for (const sub of subaccounts) {
//       await Subaccount.updateOne(
//         { subAccountId: sub.subAccountId },
//         { $set: sub },
//         { upsert: true }
//       );
//     }

//     console.log(`✅ Synced ${subaccounts.length} subaccounts`);
//   } catch (err) {
//     console.error("Error syncing subaccounts:", err);
//   }
// }

async function syncSubaccounts(agencyToken, agencyId, appId) {
    if (!agencyId || !appId) {
        console.error("Missing required IDs for subaccount sync.");
        return;
    }

    const apiUrl = 'https://services.leadconnectorhq.com/oauth/installedLocations';
    
    // Mandatorily include companyId (Agency ID) and appId (Client ID)
    const queryParams = new URLSearchParams({
        companyId: agencyId, // This is the ID of the Agency that installed the app
        appId: appId,       // This is your Private App's Client ID
        limit: 100          // Use a reasonable limit, or implement pagination
    });

    const url = `${apiUrl}?${queryParams.toString()}`;

    try {
        console.log(`📡 Fetching subaccounts for Agency: ${agencyId} using URL: ${url}`);

        const locationRes = await fetch(url, {
            method: "GET",
            headers: {
                "Accept": "application/json",
                // Authorization MUST use the Agency Access Token received from OAuth
                "Authorization": `Bearer ${agencyToken}`,
                // GHL mandates a Version header for V2 endpoints
                "Version": "2021-07-28" 
            },
        });

        if (!locationRes.ok) {
            // Log the detailed error response body from GHL
            const errorBody = await locationRes.json();
            console.error("❌ Failed to fetch locations:", locationRes.status, errorBody);
            throw new Error(`GHL API Error fetching locations: ${locationRes.status} ${locationRes.statusText}`);
        }

        const data = await locationRes.json();
        
        console.log(`✅ Successfully retrieved ${data.locations.length} installed subaccounts.`);

        // Process the subaccount data (e.g., save to your database)
        data.locations.forEach(location => {
            console.log(`Location Name: ${location.name}, ID: ${location._id}`);
            // Your logic to save the location details here
        });

        return data.locations;

    } catch (err) {
        console.error("Sync Subaccounts Function Error:", err);
        // You might want to rethrow or handle the error gracefully
        return [];
    }
}


module.exports = syncSubaccounts;
