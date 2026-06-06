require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const User = require('../models/User')
const Lab = require('../models/Lab')
const Clinic = require('../models/Clinic')
const Subscription = require('../models/Subscription')

async function seed() {
  await mongoose.connect(process.env.MONGO_URI)
  console.log('Connected to MongoDB')

  // Create lab
  const lab = await Lab.findOneAndUpdate(
    { name: 'מעבדת שיניים לדוגמה' },
    { name: 'מעבדת שיניים לדוגמה', address: 'רחוב הרצל 1, תל אביב', phone: '03-1234567', email: 'lab@demo.co.il' },
    { upsert: true, new: true }
  )
  console.log('Lab:', lab.name)

  // Create clinic
  const clinic = await Clinic.findOneAndUpdate(
    { name: 'מרפאת שיניים לדוגמה' },
    { name: 'מרפאת שיניים לדוגמה', address: 'שדרות רוטשילד 5, תל אביב', phone: '03-7654321', email: 'clinic@demo.co.il' },
    { upsert: true, new: true }
  )
  console.log('Clinic:', clinic.name)

  const users = [
    { name: 'מנהל מערכת',   email: 'admin@dentaltrack.co.il',       role: 'super_admin', password: 'admin123' },
    { name: 'ד"ר כהן',      email: 'doctor@demo.co.il',             role: 'doctor',      password: 'demo123', clinicId: clinic._id, labId: lab._id },
    { name: 'מנהל מעבדה',   email: 'labmanager@demo.co.il',         role: 'lab_manager', password: 'demo123', labId: lab._id },
    { name: 'ישראל טכנאי',  email: 'technician@demo.co.il',         role: 'technician',  password: 'demo123', labId: lab._id },
    { name: 'שליח',         email: 'courier@demo.co.il',            role: 'courier',     password: 'demo123' },
  ]

  for (const u of users) {
    const passwordHash = await User.hashPassword(u.password)
    await User.findOneAndUpdate(
      { email: u.email },
      { name: u.name, email: u.email, role: u.role, passwordHash, labId: u.labId, clinicId: u.clinicId, isActive: true },
      { upsert: true, new: true }
    )
    console.log(`User created: ${u.email} / ${u.password}`)
  }

  // Create subscriptions
  await Subscription.findOneAndUpdate(
    { accountId: lab._id, accountModel: 'Lab' },
    { accountId: lab._id, accountModel: 'Lab', accountName: lab.name, plan: 'lab_pro', status: 'active' },
    { upsert: true, new: true }
  )
  await Subscription.findOneAndUpdate(
    { accountId: clinic._id, accountModel: 'Clinic' },
    { accountId: clinic._id, accountModel: 'Clinic', accountName: clinic.name, plan: 'clinic_pro', status: 'active' },
    { upsert: true, new: true }
  )

  console.log('\n✅ Seed complete!')
  console.log('Login credentials:')
  users.forEach(u => console.log(`  ${u.role}: ${u.email} / ${u.password}`))
  process.exit(0)
}

seed().catch(err => { console.error(err); process.exit(1) })
