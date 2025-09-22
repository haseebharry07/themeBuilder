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
                { email: identifier }
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
    let { rlNo, email, themeData, selectedTheme, bodyFont,agencyId } = req.body;

    if (!email && !rlNo) {
        return res.status(400).json({ message: "Either email or rlNo is required" });
    }

    // Normalize email if provided
    if (email) email = email.toLowerCase();
    try {
        // ✅ Prefer email for lookup, fallback to rlNo
        let query = email ? { email } : { rlNo };

        let existingTheme = await Theme.findOne(query);

        if (!existingTheme) {
            // Create a new record if none exists
            const newTheme = new Theme({
                rlNo,
                email,
                themeData,
                agencyId,
                selectedTheme,
                bodyFont,
                updatedAt: new Date(),
                isActive: true,
            });

            const savedTheme = await newTheme.save();
            console.log('here updated themeadataas',themeData,bodyFont);
            // Also update CSS file
            // await updateCSSFile(themeData, bodyFont);

            return res.status(201).json({ message: "New theme created successfully", theme: savedTheme });
        }

        // If record exists, check eligibility
        if (!existingTheme.isActive) {
            return res.status(403).json({ message: "User is not eligible to update the theme" });
        }

        // ✅ Update existing record
        if (email) existingTheme.email = email; // always prioritize email
        if (rlNo) existingTheme.rlNo = rlNo; // save rlNo if provided

        existingTheme.themeData = themeData;
        existingTheme.selectedTheme = selectedTheme;
        existingTheme.bodyFont = bodyFont;
        existingTheme.updatedAt = new Date();

        const updatedTheme = await existingTheme.save();

        // Also update CSS file
        // await updateCSSFile(themeData, bodyFont);

        res.json({ message: "Theme updated successfully"});
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});
router.get("/file", originCheck, async (req, res) => {
  try {
    const agencyId = req.query.agencyId;

    if (!agencyId) {
      return res.status(400).json({ message: "agencyId is required" });
    }

    const theme = await Theme.findOne({ agencyId, isActive: true });

    if (!theme) {
      return res.status(403).json({ message: "Invalid or inactive agencyId" });
    }

    console.log("Got the theme ", theme);

    const cssFilePath = path.join(__dirname, "../public/style.css");
    const cssContent = await fs.promises.readFile(cssFilePath, "utf8");

    const encodedCSS = Buffer.from(cssContent, "utf-8").toString("base64");
    const themeData = theme.themeData || {};

    res.json({
      css: encodedCSS,
      themeData: themeData
    });
  } catch (err) {
    console.error("❌ API error:", err.message);
    res.status(500).json({ message: "Error loading CSS" });
  }
});




async function updateCSSFile(themeData, bodyFont) {
    const cssFilePath = path.join(__dirname, "..", "public", "style.css");

    // 1️⃣ Read existing CSS
    let cssContent = "";
    try {
        cssContent = await fs.promises.readFile(cssFilePath, "utf8");
    } catch {
        console.log("No existing CSS, starting fresh.");
    }

    // 2️⃣ Function to update/add variables inside a :root block
    function updateRootBlock(block, updates) {
    let lines = block.split("\n").map(line => line.trim());
    let vars = {};

    // Collect existing variables safely
    lines.forEach(line => {
        if (line.startsWith("--")) {
            const index = line.lastIndexOf(":"); // ✅ FIX
            if (index > -1) {
                const prop = line.slice(0, index).trim();
                const val = line.slice(index + 1).trim().replace(/;$/, "");
                vars[prop] = val;
            }
        }
    });

    // Apply updates
    for (const [key, value] of Object.entries(updates)) {
        vars[key] = value;
    }

    // Rebuild block safely
    let newBlock = ":root {\n";
    for (const [prop, val] of Object.entries(vars)) {
        newBlock += `  ${prop}: ${val};\n`;
    }
    newBlock += "}";

    return newBlock;
}

    // 3️⃣ Match :root blocks
    const rootRegex = /:root\s*{[^}]*}/gm;
    let rootBlocks = cssContent.match(rootRegex);

    if (rootBlocks && rootBlocks.length > 0) {
        cssContent = cssContent.replace(
            rootBlocks[0],
            updateRootBlock(rootBlocks[0], {
                ...themeData,
                "--body-font": bodyFont || "Arial, sans-serif"
            })
        );
    } else {
        // No :root → create new
        let newRootBlock = updateRootBlock(":root {}", {
            ...themeData,
            "--body-font": bodyFont || "Arial, sans-serif"
        });
        cssContent = newRootBlock + "\n\n" + cssContent;
    }

    // 4️⃣ Ensure body font rule exists
    if (!/body\s*{[^}]*font-family:/m.test(cssContent)) {
        cssContent += `
body {
  font-family: var(--body-font, Arial, sans-serif);
}
`;
    }

    // 5️⃣ Save back
    await fs.promises.writeFile(cssFilePath, cssContent, "utf8");
}

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
