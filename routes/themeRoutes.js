// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const Theme = require('../models/UserTheme');
const fs = require("fs");
const path = require("path");
const originCheck = require("../middleware/originCheck");
const AgencyLoader = require('../models/loaderSchema');

router.get("/_debug-test", (req, res) => {
  console.log("✅ Theme routes active");
  res.json({ ok: true });
});
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
    // if (emailList.length > 0) existingTheme.email = emailList;
    // if (rlNo) existingTheme.rlNo = rlNo;

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
router.get("/merged-css", async (req, res) => {
  try {
    const agencyId = req.query.agencyId;

    if (!agencyId) {
      return res.status(400).json({ message: "agencyId is required" });
    }

    // ✅ Fetch active theme
    const theme = await Theme.findOne({ agencyId, isActive: true });
    if (!theme) {
      return res.status(404).json({ message: "Theme not found or inactive" });
    }

    const themeData = theme.themeData || {};
    const selectedTheme = theme?.selectedTheme || "";

    // ✅ Theme-based login CSS logic (simplified & fast)
    let logincss = "";
    const themeCssFiles = {
      "BlueWave Theme": "bluewavelogin.css",
      "Default Theme": "glitchgonelogin.css",
      "ForestGreen Theme": "whitegreenlogin.css",
      "OceanMist Theme (White Header Sidebar Radius 0)": "oceanmefistlogin.css",
      "GlitchGone Theme": "glitchgonelogin.css",
      "JetBlack Luxury Gold Theme": "jetblacklogin.css",
    };

    if (themeCssFiles[selectedTheme]) {
      const cssFilePath = path.join(__dirname, "../public", themeCssFiles[selectedTheme]);
      try {
        logincss = await fs.promises.readFile(cssFilePath, "utf8");
      } catch (err) {
        console.error(`⚠️ Could not read ${themeCssFiles[selectedTheme]}:`, err);
      }
    }

    // ✅ Helper: Pulsating Logo CSS
    const generatePulsatingLogoCSS = (logoUrl) => `
      /* Hide platform default loaders */
      .hl-loader-container, .lds-ring, .app-loader,
      #app + .app-loader, #app.loading + .app-loader {
        display: none !important;
      }

      #custom-global-loader {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100vh;
        background: linear-gradient(180deg, #0074f7 0%, #00c0f7 100%);
        display: flex; justify-content: center; align-items: center;
        z-index: 999999;
      }

      #custom-global-loader::before {
        content: "";
        width: 120px; height: 120px;
        background: url("${logoUrl}") center/contain no-repeat;
        animation: fadeIn 1s ease-in-out infinite alternate;
      }

      @keyframes fadeIn {
        0% { opacity: 0.7; transform: scale(0.95); }
        100% { opacity: 1; transform: scale(1.05); }
      }
    `;

    // ✅ Helper: Bouncing Logo CSS
    const generateBouncingLogoCSS = (logoUrl) => `
      .hl-loader-container, .lds-ring, .app-loader,
      #app + .app-loader, #app.loading + .app-loader {
        display: none !important;
      }

      #custom-global-loader {
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100vh;
        background: linear-gradient(180deg, #0074f7 0%, #00c0f7 100%);
        display: flex; justify-content: center; align-items: center;
        z-index: 999999;
      }

      #custom-global-loader::before {
        content: "";
        width: 120px; height: 120px;
        background: url("${logoUrl}") center/contain no-repeat;
        animation: bounceLogo 1s ease-in-out infinite;
      }

      @keyframes bounceLogo {
        0%, 100% { transform: translateY(0); }
        25% { transform: translateY(-30px); }
        50% { transform: translateY(0); }
        75% { transform: translateY(-15px); }
      }
    `;

    // ✅ Select Loader
    const companyLogoUrl = themeData["--loader-company-url"];
    const animationSetting = themeData["--animation-settings"];

    let loaderCSS = "";
    if (companyLogoUrl && companyLogoUrl.trim() !== "") {
      loaderCSS =
        animationSetting === "BouncingLogo"
          ? generateBouncingLogoCSS(companyLogoUrl)
          : generatePulsatingLogoCSS(companyLogoUrl);
    } else {
      const activeLoader = await AgencyLoader.findOne({ agencyId, isActive: true });
      loaderCSS = activeLoader?.loaderCSS || "";
    }

    // ✅ Read main CSS
    const cssFilePath = path.join(__dirname, "../public/style.css");
    const cssContent = await fs.promises.readFile(cssFilePath, "utf8");

    // ✅ Dynamic theme variables
    const dynamicVariables = Object.entries(themeData)
      .map(([key, value]) => `${key}: ${value};`)
      .join("\n");

    // ✅ Merge all CSS
    const finalCss = `
${loaderCSS}
${logincss}
:root {
${dynamicVariables}
}

${cssContent}
`;

    res.setHeader("Content-Type", "text/css");
    res.send(finalCss);

  } catch (error) {
    console.error("❌ Error merging CSS:", error);
    res.status(500).json({ message: "Server Error merging CSS" });
  }
});


// 🟢 Create or update a loader for an agency
router.post("/loader-css", async (req, res) => {
  try {
    const { agencyId, loaderName, loaderCSS, previewImage, isActive } = req.body;
    
    // ✅ Validate required fields
    if (!agencyId || !loaderName || !loaderCSS) {
      return res.status(400).json({
        message: "agencyId, loaderName, and loaderCSS are required"
      });
    }
    
    // ✅ If this loader is marked active, deactivate others for same agency
    if (isActive) {
      await AgencyLoader.updateMany({ agencyId }, { isActive: false });
    }
    
    // ✅ Create a new loader record
    const newLoader = new AgencyLoader({
      agencyId,
      loaderName,
      loaderCSS,
      previewImage: previewImage || null,
      isActive: !!isActive,
      updatedAt: new Date()
    });
    
    await newLoader.save();
    
    res.status(201).json({
      message: "Loader saved successfully",
      loader: newLoader
    });
  } catch (err) {
    console.error("❌ Error saving loader:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
// 🟡 Get all loaders for an agency
router.get("/Get-loader-css", async (req, res) => {
  try {
    const { agencyId } = req.query;
    if (!agencyId) {
      return res.status(400).json({ success: false, message: "agencyId is required" });
    }
    const loaders = await AgencyLoader.find({ agencyId });
    if (!loaders || loaders.length === 0) {
      return res.status(404).json({ success: false, message: "No loaders found for this agency" });
    }
    res.json({ success: true, loaders });
  } catch (err) {
    console.error("❌ Error fetching loaders:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
});

// ✅ Update loader isActive status
router.put("/loader-css/status", async (req, res) => {
  try {
    const { _id, isActive } = req.body;

    // ✅ Validate input
    if (!_id || typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "_id and boolean isActive are required",
      });
    }

    // ✅ Find the loader by ID
    const loader = await AgencyLoader.findById(_id);
    if (!loader) {
      return res.status(404).json({ message: "Loader not found" });
    }

    // ✅ If activating this loader, deactivate all others for same agency
    if (isActive) {
      await AgencyLoader.updateMany(
        { agencyId: loader.agencyId },
        { isActive: false }
      );
    }

    // ✅ Update the target loader
    loader.isActive = isActive;
    loader.updatedAt = new Date();
    await loader.save();

    res.status(200).json({
      message: `Loader ${isActive ? "activated" : "deactivated"} successfully`,
      loader,
    });
  } catch (err) {
    console.error("❌ Error updating loader status:", err);
    res.status(500).json({ message: "Server error", error: err.message });
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
