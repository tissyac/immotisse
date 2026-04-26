const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer', required: true },
  status: String,
  previousStatus: String,
  changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reason: String,
  notes: String,
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('History', historySchema);
