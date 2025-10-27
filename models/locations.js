// models/subAccount.js
const mongoose = require("mongoose");

const subAccountSchema = new mongoose.Schema({
  agencyId: { type: String, required: true },
  subAccountId: { type: String, required: true, unique: true },
  name: String,
  email: String,
});

module.exports = mongoose.model("locations", subAccountSchema);
