// routes/themeRoutes.js
const express = require('express');
const router = express.Router();
const Theme = require('../models/UserTheme');

// Get theme for a user
router.get('/:rlNo', async (req, res) => {
    console.log('rlNo', req.params.rlNo);
    try {
        // Only pick the record if isActive is explicitly true
        const theme = await Theme.findOne({ 
            rlNo: req.params.rlNo, 
            isActive: { $eq: true } 
        });

        console.log("Record",theme);

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
    const { rlNo, themeData, selectedTheme, bodyFont } = req.body;

    if (!rlNo) return res.status(400).json({ message: 'rlNo is required' });

    try {
        // Find the theme document first
        let existingTheme = await Theme.findOne({ rlNo });

        if (!existingTheme) {
            // Create a new record if none exists
            const newTheme = new Theme({
                rlNo,
                themeData,
                selectedTheme,
                bodyFont,
                updatedAt: new Date(),
                isActive: true   // 👈 always true for a new record
            });

            const savedTheme = await newTheme.save();
            return res.status(201).json({ message: 'New theme created successfully', theme: savedTheme });
        }

        // If record exists, check eligibility
        if (!existingTheme.isActive) {
            return res.status(403).json({ message: 'User is not eligible to update the theme' });
        }

        // Update existing record
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


module.exports = router;
