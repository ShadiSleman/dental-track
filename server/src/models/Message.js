const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  workOrderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'WorkOrder', required: true },
  sender:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text:          { type: String, required: true },
  attachmentUrl: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Message', messageSchema)
