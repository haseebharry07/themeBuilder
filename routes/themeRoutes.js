// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const Theme = require('../models/UserTheme');

// Get theme for a user
router.get('/:identifier', async (req, res) => {
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
router.post('/', async (req, res) => {
    let { rlNo, email, themeData, selectedTheme, bodyFont } = req.body;

    if (!email && !rlNo) {
        return res.status(400).json({ message: 'Either email or rlNo is required' });
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
                selectedTheme,
                bodyFont,
                updatedAt: new Date(),
                isActive: true
            });

            const savedTheme = await newTheme.save();
            return res.status(201).json({ message: 'New theme created successfully', theme: savedTheme });
        }

        // If record exists, check eligibility
        if (!existingTheme.isActive) {
            return res.status(403).json({ message: 'User is not eligible to update the theme' });
        }

        // ✅ Update existing record
        if (email) existingTheme.email = email;   // always prioritize email
        if (rlNo) existingTheme.rlNo = rlNo;      // save rlNo if provided

        existingTheme.themeData = themeData;
        existingTheme.selectedTheme = selectedTheme;
        existingTheme.bodyFont = bodyFont;
        existingTheme.updatedAt = new Date();

        const updatedTheme = await existingTheme.save();
        res.json({ message: 'Theme updated successfully', theme: updatedTheme });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

const fs = require('fs');
const path = require('path');

// Get encoded CSS file for a user (email or rlNo)
router.get('/file/:identifier', async (req, res) => {
    try {
        const identifier = req.params.identifier.toLowerCase();
        // Find user eligibility
        const theme = await Theme.findOne({
            $or: [
                { rlNo: identifier },
                { email: identifier }
            ],
            isActive: true
        });

        if (!theme) {
            return res.status(403).json({ message: "❌ Not authorized to get CSS file" });
        }

        // Read the CSS base64 file
        const filePath = path.join(__dirname, '../public/style-base64.txt');
        const encodedCSS = fs.readFileSync(filePath, 'utf8');

        res.type('text/plain').send(encodedCSS.trim());
    } catch (err) {
        console.error("Error fetching file:", err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});


module.exports = router;
