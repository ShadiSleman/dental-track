const mongoose = require('mongoose')

const STAGES = [
  'scan_received','order_opened','cad_design','awaiting_approval',
  'approved','manufacturing','finishing','quality_check',
  'ready_to_ship','with_courier','delivered',
]

const stageHistorySchema = new mongoose.Schema({
  stage:  { type: String, enum: STAGES },
  at:     { type: Date, default: Date.now },
  by:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note:   { type: String },
  images: [{ type: String }],
}, { _id: false })

const fileSchema = new mongoose.Schema({
  url:        { type: String, required: true },
  type:       { type: String },
  name:       { type: String },
  uploadedAt: { type: Date, default: Date.now },
}, { _id: false })

const workOrderSchema = new mongoose.Schema({
  orderNumber:           { type: String, unique: true },
  clinic:                { type: mongoose.Schema.Types.ObjectId, ref: 'Clinic', required: true },
  doctor:                { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lab:                   { type: mongoose.Schema.Types.ObjectId, ref: 'Lab', required: true },
  assignedTechnician:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  patientCode:           { type: String, required: true },
  workType:              { type: String, enum: ['crown','bridge','implant','veneer','denture','nightguard','other'], required: true },
  dueDate:               { type: Date, required: true },
  currentStage:          { type: String, enum: STAGES, default: 'scan_received' },
  stageHistory:          [stageHistorySchema],
  files:                 [fileSchema],
  isDelayed:             { type: Boolean, default: false },
  requiresDoctorApproval:{ type: Boolean, default: false },
  returnReason:          { type: String },
  notes:                 { type: String },
  signature:             { type: String },
}, { timestamps: true })

workOrderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    const rand = Math.floor(1000 + Math.random() * 9000)
    this.orderNumber = `DT-${Date.now().toString().slice(-6)}-${rand}`
  }
  if (this.dueDate && new Date(this.dueDate) < new Date() && this.currentStage !== 'delivered') {
    this.isDelayed = true
  }
  next()
})

module.exports = mongoose.model('WorkOrder', workOrderSchema)
