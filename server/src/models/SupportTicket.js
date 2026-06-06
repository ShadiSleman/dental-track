const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema({
  from:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: String, required: true },
  body:    { type: String, required: true },
  status:  { type: String, enum: ['open','in_progress','resolved'], default: 'open' },
  replies: [{
    sender: { type: String },
    text:   { type: String },
    at:     { type: Date, default: Date.now },
  }],
}, { timestamps: true })

module.exports = mongoose.model('SupportTicket', ticketSchema)
