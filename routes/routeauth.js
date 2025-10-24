// routes/authRoutes.js
const express = require("express");
const fetch = require("node-fetch");
const router = express.Router();

router.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // Exchange code for access token
    const tokenRes = await fetch("https://api.msgsndr.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.GHL_REDIRECT_URI
      })
    });

    const data = await tokenRes.json();

    if (!data.access_token) {
      console.error("OAuth error:", data);
      return res.status(500).send("Failed to get token");
    }

    // Store the token + agency info in your DB
    // You can decode agencyId using the token or call the GHL /users/me endpoint
    console.log("✅ Access Token:", data.access_token);

    // Example redirect to your dashboard
    res.redirect(`/connected?token=${data.access_token}`);
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("Server error during OAuth");
  }
});

module.exports = router;
