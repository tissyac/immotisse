// models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  // Information gérant
  name: { type: String, required: true },
  firstName: { type: String, required: true },
  birthDate: { type: Date, required: true },
  birthPlace: { type: String, required: true },
  nin: { type: String, required: true },
  ninDocument: { type: String }, // URL du fichier uploadé
  phone: { type: String, required: true },

  // Information entreprise
  companyName: { type: String, required: true },
  companyAddress: { type: String, required: true },
  companyLocation: { type: String }, // option géolocalisation
  companyPhone: { type: String, required: true },
  companyEmail: { type: String, required: true, unique: true },
  rcNumber: { type: String },
  rcDocument: { type: String }, // URL du fichier uploadé
  hasAgreement: { type: Boolean, default: false },

  // Login / statut
  username: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin','promoter'], default: 'promoter' },
  status: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);