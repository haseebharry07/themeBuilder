const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  rlNo: { type: String, required: true, unique: true },
  primaryColor: String,
  primaryBgColor: String,
  sidebarBgColor: String,
  sidebarTabsBgColor: String,
  sidebarTabsTextColor: String,
  selectedTheme: String,
  updatedAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true } 
}, { collection: 'userThemes' }); // 👈 force correct collection name

module.exports = mongoose.model('Theme', themeSchema);
