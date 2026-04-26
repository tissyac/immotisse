// models/Promotion.js
const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // lien vers le promoteur
  title: { type: String, required: true },
  description: String,
  city: String,
  images: [String], // URLs
  video: String, // URL
  apartmentTypes: [String], // ex: ['F2','F3']
  totalUnits: Number,
  totalFloors: Number,
  hasElevator: Boolean,
}, { timestamps: true });

module.exports = mongoose.model('Promotion', promotionSchema);