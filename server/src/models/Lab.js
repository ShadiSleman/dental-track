const mongoose = require('mongoose')

const labSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  address: { type: String },
  phone:   { type: String },
  email:   { type: String, lowercase: true },
  logoUrl: { type: String },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('Lab', labSchema)
