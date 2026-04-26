const mongoose = require('mongoose');

const auditSchema = new mongoose.Schema({
  action: { type: String, required: true }, // create, update, delete, approve, reject
  entity: { type: String, required: true }, // offer, request, contact, user
  entityId: mongoose.Schema.Types.ObjectId,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  changes: mongoose.Schema.Types.Mixed,
  oldValues: mongoose.Schema.Types.Mixed,
  newValues: mongoose.Schema.Types.Mixed,
  ipAddress: String,
  userAgent: String,
  status: String,
  notes: String,
  createdAt: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now, index: true }
});

module.exports = mongoose.model('Audit', auditSchema);
