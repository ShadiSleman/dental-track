const mongoose = require('mongoose')

const PLANS = ['clinic_basic','clinic_pro','lab_basic','lab_pro','enterprise']
const STATUSES = ['active','trial','overdue','cancelled']
const PLAN_PRICES = { clinic_basic:99, clinic_pro:199, lab_basic:499, lab_pro:999, enterprise:0 }

const subscriptionSchema = new mongoose.Schema({
  accountId:    { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'accountModel' },
  accountModel: { type: String, enum: ['Lab', 'Clinic'], required: true },
  accountName:  { type: String },
  plan:         { type: String, enum: PLANS, required: true },
  price:        { type: Number },
  status:       { type: String, enum: STATUSES, default: 'trial' },
  renewsAt:     { type: Date },
  trialEndsAt:  { type: Date },
  payments:     [{ amount: Number, paidAt: Date, note: String }],
}, { timestamps: true })

subscriptionSchema.pre('save', function (next) {
  if (!this.price) this.price = PLAN_PRICES[this.plan] || 0
  if (!this.renewsAt) {
    const d = new Date()
    d.setMonth(d.getMonth() + 1)
    this.renewsAt = d
  }
  next()
})

module.exports = mongoose.model('Subscription', subscriptionSchema)
