const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  startDate: Date,
  endDate: Date,
}, { _id: false });

const offerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  mainCategory: { type: String, enum: ['promotion', 'vente', 'location'], required: true },
  subCategory: { type: String, enum: ['maison', 'terrain', 'locaux_commerciaux', 'courte_duree', 'longue_duree', ''], default: '' },
  title: { type: String, required: true },
  description: String,
  address: String,
  city: String,
  area: Number,
  price: Number,
  paymentTerms: String,
  propertyType: String,
  apartmentTypes: [String],
  totalUnits: Number,
  totalFloors: Number,
  elevator: Boolean,
  parking: Boolean,
  floor: Number,
  projectStatus: { type: String, enum: ['conception', 'en_construction', 'pret_livraison', ''], default: '' },
  finishingState: { type: String, enum: ['brut', 'semi_fini', 'fini', ''], default: '' },
  availability: { type: String, enum: ['livraison_date', 'immediatement', 'sur_plan', ''], default: '' },
  deliveryDate: Date,
  // Champs spécifiques aux sous-catégories
  access: String, // Pour terrain
  viabilise: Boolean, // Pour terrain
  changeable: Boolean, // Pour terrain - possibilité d'échange
  facadeCount: Number, // Pour locaux commerciaux
  furnished: Boolean, // Pour location longue durée (meublé ou non)
  advance: String, // Pour location longue durée (avances)
  equipment: [String], // Pour location courte durée
  images: [String],
  videos: [String],
  availabilityCalendar: [availabilitySchema], // Pour location courte durée
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isPublished: { type: Boolean, default: false },
  isDraft: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  interactions: { type: Number, default: 0 },
  adminNote: String,
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
