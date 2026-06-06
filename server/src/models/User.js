const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  phone:        { type: String },
  role:         { type: String, enum: ['doctor','lab_manager','technician','courier','super_admin'], required: true },
  avatarUrl:    { type: String },
  labId:        { type: mongoose.Schema.Types.ObjectId, ref: 'Lab' },
  clinicId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic' },
  isActive:     { type: Boolean, default: true },
  lastLogin:    { type: Date },
}, { timestamps: true })

userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

userSchema.statics.hashPassword = (plain) => bcrypt.hash(plain, 10)

module.exports = mongoose.model('User', userSchema)
