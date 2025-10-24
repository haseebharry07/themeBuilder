// models/Agency.js
const mongoose = require("mongoose");

const agencySchema = new mongoose.Schema({
  agencyId: String,
  accessToken: String,
  refreshToken: String,
  domain: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Agency", agencySchema);
