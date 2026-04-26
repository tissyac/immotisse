// models/Request.js
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  // Infos identiques au formulaire user
  name: String,
  firstName: String,
  birthDate: Date,
  birthPlace: String,
  nin: String,
  ninDocument: String,
  phone: String,

  companyName: String,
  companyAddress: String,
  companyLocation: String,
  companyPhone: String,
  companyEmail: String,
  rcNumber: String,
  rcDocument: String,
  hasAgreement: Boolean,

  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  adminNote: String
}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);