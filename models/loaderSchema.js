const mongoose = require('mongoose');

const loaderSchema = new mongoose.Schema({
  agencyId: { type: String, required: true },
  loaderName: { type: String, required: true }, // Example: 'BlueGradientSpinner'
  loaderCSS: { type: String, required: true }, // Store complete CSS of the loader as text
  previewImage: { type: String, default: null }, // (Optional) URL for visual preview
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now   },
  isActive: { type: Boolean, default: false } // Only one loader per agency should be active at a time
}, { 
  collection: 'agencyLoaders' 
});

// Automatically update `updatedAt` when document changes
loaderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('AgencyLoader', loaderSchema);
