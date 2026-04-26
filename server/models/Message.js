const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  type: { type: String, enum: ['client_to_admin', 'company_to_admin', 'admin_to_company', 'admin_to_client'], required: true },
  relatedOffer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' },
  isRead: { type: Boolean, default: false },
  attachments: [String], // URLs des fichiers attachés
  status: { type: String, enum: ['sent', 'delivered', 'read'], default: 'sent' }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);