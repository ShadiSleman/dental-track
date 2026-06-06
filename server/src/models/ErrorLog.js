const mongoose = require('mongoose')

const errorLogSchema = new mongoose.Schema({
  message: { type: String },
  stack:   { type: String },
  route:   { type: String },
}, { timestamps: true })

module.exports = mongoose.model('ErrorLog', errorLogSchema)
