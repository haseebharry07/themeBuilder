// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const Theme = require('../models/UserTheme');
const fs = require("fs");
const path = require("path");
const originCheck = require("../middleware/originCheck");

// Get theme for a user
router.get('/code/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier;

        // Find theme where rlNo OR email matches AND isActive = true
         const theme = await Theme.findOne({
            $or: [
                { rlNo: identifier },
                { email: { $in: [identifier] } }  // ✅ check if email array contains identifier
            ],
            isActive: true
            });

        if (!theme) {
            return res.status(404).json({ message: "Theme not found or user is not eligible" });
        }

        res.json(theme);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});
// Save or update theme for a user
router.post("/", async (req, res) => {
  let { rlNo, email, themeData, selectedTheme, bodyFont, agencyId } = req.body;

  if (!email && !rlNo) {
    return res.status(400).json({ message: "Either email or rlNo is required" });
  }

  try {
    // ✅ Normalize emails
    let emailList = [];
    if (email) {
      if (Array.isArray(email)) {
        emailList = email.map((e) => e.toLowerCase());
      } else {
        emailList = [email.toLowerCase()];
      }
    }

    // ✅ Build query with agencyId check
    let query = {};
    if (emailList.length > 0) {
        query = { 
            email: { $regex: emailList.join('|'), $options: 'i' },
            agencyId
        }    } else if (rlNo) {
      query = { rlNo: rlNo, agencyId: agencyId };
    }

    let existingTheme = await Theme.findOne(query);
    console.log("Here is the Data:", existingTheme);

    // ❗️Check if theme exists
    if (!existingTheme) {
      return res.status(404).json({ message: "No theme found for the provided email/rlNo and agencyId" });
    }

    // ✅ If found but inactive
    if (!existingTheme.isActive) {
      return res
        .status(403)
        .json({ message: "User is not eligible to update the theme" });
    }

    // ✅ Update existing theme
    if (emailList.length > 0) existingTheme.email = emailList;
    if (rlNo) existingTheme.rlNo = rlNo;

    existingTheme.themeData = themeData;
    existingTheme.selectedTheme = selectedTheme;
    existingTheme.bodyFont = bodyFont;
    existingTheme.updatedAt = new Date();

    await existingTheme.save();

    res.json({ message: "Theme updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
});



router.get("/file", async (req, res) => {
  try {
    const agencyId = req.query.agencyId;

    if (!agencyId) {
      return res.status(400).json({ message: "agencyId is required" });
    }

    const theme = await Theme.findOne({ agencyId, isActive: true });
    if (!theme) {
      return res.status(403).json({ message: "Invalid or inactive agencyId" });
    }

    const cssFilePath = path.join(__dirname, "../public/style.css");
    const cssContent = await fs.promises.readFile(cssFilePath, "utf8");

    const encodedCSS = Buffer.from(cssContent, "utf-8").toString("base64");
    const themeData = theme.themeData || {};
    const selectedtheme = theme.selectedTheme;

    res.json({
      css: encodedCSS,
      themeData: themeData,
      selectedtheme:selectedtheme
    });
  } catch (err) {
    console.error("❌ API error:", err.message);
    res.status(500).json({ message: "Error loading CSS" });
  }
});

// ✅ New API: Find theme by email
router.get("/:email", async (req, res) => {
    try {
        const email = req.params.email;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const theme = await Theme.findOne({ email: email, isActive: true });

        if (!theme) {
            return res.json({ success: false }); // ❌ Not found or inactive
        }

        return res.json({ success: true }); // ✅ Found and active
    } catch (err) {
        console.error("❌ API Error:", err.message);
        res.status(500).json({ success: false, message: "Server error" });
    }
});
module.exports = router;
