// helpers/syncSubaccounts.js
const fetch = require("node-fetch");
const Subaccount = require("../models/locations");

async function syncSubaccounts(accessToken, agencyId) {
  try {
    const response = await fetch("https://api.msgsndr.com/api/v2/locations/", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await response.json();

    if (!data || !data.locations) {
      console.error("❌ No subaccounts found:", data);
      return;
    }

    const subaccounts = data.locations.map(loc => ({
      agencyId,
      subAccountId: loc.id,
      name: loc.name,
      email: loc.email,
    }));

    // 🧠 Upsert subaccounts (avoid duplicates)
    for (const sub of subaccounts) {
      await Subaccount.updateOne(
        { subAccountId: sub.subAccountId },
        { $set: sub },
        { upsert: true }
      );
    }

    console.log(`✅ Synced ${subaccounts.length} subaccounts`);
  } catch (err) {
    console.error("Error syncing subaccounts:", err);
  }
}

module.exports = syncSubaccounts;
