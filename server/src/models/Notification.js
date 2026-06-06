const mongoose = require('mongoose')

const notificationSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['stage_update','approval_needed','message','delayed','delivered'] },
  title:       { type: String },
  body:        { type: String },
  workOrderId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder' },
  read:        { type: Boolean, default: false },
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
