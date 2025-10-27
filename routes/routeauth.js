require("dotenv").config();
const express = require("express");
const router = express.Router();

router.get("/oauth/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // Exchange code for access token
        const params = new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID,
        client_secret: process.env.GHL_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.GHL_REDIRECT_URI,
        });

        const tokenRes = await fetch("https://api.msgsndr.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        });

    const data = await tokenRes.json();

    if (!data.access_token) {
      console.error("OAuth error:", data);
      return res.status(500).send("Failed to get token");
    }

    console.log("✅ Access Token:", data.access_token);
    res.redirect(`/connected?token=${data.access_token}`);
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("Server error during OAuth");
  }
});
router.get("/oauth/callbackv2", async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send("Missing OAuth code");

  try {
    // Exchange code for access token
        const params = new URLSearchParams({
        client_id: process.env.GHL_CLIENT_ID_v2,
        client_secret: process.env.GHL_CLIENT_SECRET_v2,
        grant_type: "authorization_code",
        code,
        redirect_uri: process.env.GHL_REDIRECT_URI_v2,
        });

        const tokenRes = await fetch("https://api.msgsndr.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
        });

    const data = await tokenRes.json();

    if (!data.access_token) {
      console.error("OAuth error:", data);
      return res.status(500).send("Failed to get token");
    }

    console.log("✅ Access Token:", data.access_token);
    res.redirect(`/connected?token=${data.access_token}`);
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("Server error during OAuth");
  }
});
module.exports = router;
