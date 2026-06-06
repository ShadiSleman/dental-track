const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  actor:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action:      { type: String, required: true },
  target:      { type: String },
  targetModel: { type: String },
  meta:        { type: mongoose.Schema.Types.Mixed },
  ip:          { type: String },
}, { timestamps: true })

module.exports = mongoose.model('AuditLog', auditLogSchema)
