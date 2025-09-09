// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const Theme = require('../models/UserTheme');

// Get theme for a user
router.get('/:rlNo', async (req, res) => {
  try {
    const theme = await Theme.findOne({ rlNo: req.params.rlNo });
    console.log("Finding Record");
    if (!theme) {
      return res.status(404).json({ message: "Theme not found" });
    }
    res.json(theme);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Save or update theme for a user
router.post('/', async (req, res) => {
    const { rlNo, primaryColor, primaryBgColor, sidebarBgColor, sidebarTabsBgColor, sidebarTabsTextColor, selectedTheme } = req.body;

    if (!rlNo) return res.status(400).json({ message: 'rlNo is required' });
    console.log('Finding The Record');
    try {
        const updatedTheme = await Theme.findOneAndUpdate(
            { rlNo },
            { primaryColor, primaryBgColor, sidebarBgColor, sidebarTabsBgColor, sidebarTabsTextColor, selectedTheme, updatedAt: new Date() },
            { upsert: true, new: true }
            
        );
        console.log('Record Updated');
        res.json({ message: 'Theme saved successfully', theme: updatedTheme });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err });
    }
});

module.exports = router;
