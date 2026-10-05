// Seed script — creates base data: lab, clinic, 5 users, subscription
// Run: node server/src/scripts/seed.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })

const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding DentalTrack (Prisma/PostgreSQL)…')

  // ─── Lab ───────────────────────────────────────────────────────────────────
  const lab = await prisma.lab.upsert({
    where:  { id: 'lab_main' },
    update: {},
    create: {
      id:      'lab_main',
      name:    'מעבדת שיניים מרכזית',
      address: 'רחוב הרצל 45, תל אביב',
      phone:   '03-1234567',
      email:   'lab@dentaltrack.co.il',
    },
  })

  // ─── Clinic ────────────────────────────────────────────────────────────────
  const clinic = await prisma.clinic.upsert({
    where:  { id: 'clinic_main' },
    update: {},
    create: {
      id:      'clinic_main',
      name:    'מרפאת שיניים ד"ר כהן',
      address: 'שדרות רוטשילד 12, תל אביב',
      phone:   '03-7654321',
      email:   'clinic@dentaltrack.co.il',
    },
  })

  // ─── Users ─────────────────────────────────────────────────────────────────
  const hash = (p) => bcrypt.hash(p, 10)

  const users = [
    {
      id:           'user_admin',
      name:         'מנהל מערכת',
      email:        'admin@dentaltrack.co.il',
      passwordHash: await hash('admin123'),
      role:         'super_admin',
    },
    {
      id:           'user_lab',
      name:         'מנהל מעבדה',
      email:        'lab@dentaltrack.co.il',
      passwordHash: await hash('lab123'),
      role:         'lab_manager',
      labId:        lab.id,
    },
    {
      id:           'user_tech',
      name:         'טכנאי יוסי',
      email:        'tech@dentaltrack.co.il',
      passwordHash: await hash('tech123'),
      role:         'technician',
      labId:        lab.id,
    },
    {
      id:           'user_doctor',
      name:         'ד"ר כהן',
      email:        'doctor@dentaltrack.co.il',
      passwordHash: await hash('doctor123'),
      role:         'doctor',
      clinicId:     clinic.id,
      labId:        lab.id,
    },
    {
      id:           'user_courier',
      name:         'שליח דוד',
      email:        'courier@dentaltrack.co.il',
      passwordHash: await hash('courier123'),
      role:         'courier',
    },
  ]

  for (const u of users) {
    await prisma.user.upsert({ where: { email: u.email }, update: {}, create: u })
    console.log(`  ✅ User: ${u.email}`)
  }

  // ─── Subscription ──────────────────────────────────────────────────────────
  await prisma.subscription.upsert({
    where:  { id: 'sub_lab_main' },
    update: {},
    create: {
      id:     'sub_lab_main',
      labId:  lab.id,
      plan:   'lab_pro',
      status: 'active',
      price:  999,
      validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    },
  })

  console.log('\n🎉 Seed complete!')
  console.log('──────────────────────────────────')
  console.log('Users:')
  console.log('  admin@dentaltrack.co.il   / admin123  (super_admin)')
  console.log('  lab@dentaltrack.co.il     / lab123    (lab_manager)')
  console.log('  tech@dentaltrack.co.il    / tech123   (technician)')
  console.log('  doctor@dentaltrack.co.il  / doctor123 (doctor)')
  console.log('  courier@dentaltrack.co.il / courier123 (courier)')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
