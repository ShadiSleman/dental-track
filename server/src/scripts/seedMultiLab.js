// Seed multi-lab demo data
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding multi-lab demo data...')
  const hash = (p) => bcrypt.hash(p, 10)

  // Lab 2 — Smile Pro
  const lab2 = await prisma.lab.upsert({
    where:  { id: 'lab_smile_pro' },
    update: { name: 'Smile Pro Lab', logoUrl: null },
    create: { id: 'lab_smile_pro', name: 'Smile Pro Lab', address: 'דיזנגוף 50, תל אביב', phone: '03-9876543', email: 'info@smilepro.co.il', logoUrl: null },
  })

  // Lab 3 — Pearl Tech
  const lab3 = await prisma.lab.upsert({
    where:  { id: 'lab_pearl_tech' },
    update: { name: 'Pearl Tech Lab', logoUrl: null },
    create: { id: 'lab_pearl_tech', name: 'Pearl Tech Lab', address: 'ויצמן 8, חיפה', phone: '04-1234567', email: 'lab@pearltech.co.il', logoUrl: null },
  })

  // Update GAZI DENT (lab_main) name
  await prisma.lab.updateMany({
    where: { id: 'lab_main' },
    data: { name: 'GAZI DENT' },
  })

  // Clinic for Smile Pro's doctors
  const clinic2 = await prisma.clinic.upsert({
    where:  { id: 'clinic_smile' },
    update: {},
    create: { id: 'clinic_smile', name: 'מרפאת ד"ר לוי', address: 'אלנבי 30, תל אביב', phone: '03-5551234' },
  })

  // Clinic for Pearl Tech's doctors
  const clinic3 = await prisma.clinic.upsert({
    where:  { id: 'clinic_pearl' },
    update: {},
    create: { id: 'clinic_pearl', name: 'מרפאת ד"ר מזרחי', address: 'הנביאים 15, חיפה', phone: '04-9998765' },
  })

  // Lab manager for Smile Pro
  await prisma.user.upsert({
    where:  { email: 'manager@smilepro.co.il' },
    update: { labId: lab2.id },
    create: { id: 'user_smile_mgr', name: 'מנהלת Smile Pro', email: 'manager@smilepro.co.il', passwordHash: await hash('local123'), role: 'lab_manager', labId: lab2.id },
  })

  // Lab manager for Pearl Tech
  await prisma.user.upsert({
    where:  { email: 'manager@pearltech.co.il' },
    update: { labId: lab3.id },
    create: { id: 'user_pearl_mgr', name: 'מנהל Pearl Tech', email: 'manager@pearltech.co.il', passwordHash: await hash('local123'), role: 'lab_manager', labId: lab3.id },
  })

  // Doctor who works with multiple labs (no labId)
  await prisma.user.upsert({
    where:  { email: 'dr.levi@dental.co.il' },
    update: { labId: null },
    create: { id: 'user_dr_levi', name: 'ד"ר לוי', email: 'dr.levi@dental.co.il', passwordHash: await hash('local123'), role: 'doctor', clinicId: clinic2.id, labId: null },
  })

  // Remove labId from Roger (existing doctor) so he can choose lab per order
  await prisma.user.updateMany({
    where: { email: 'roger@dental.co.il' },
    data: { labId: null },
  })

  // Subscriptions for new labs
  await prisma.subscription.upsert({
    where:  { id: 'sub_smile_pro' },
    update: {},
    create: { id: 'sub_smile_pro', labId: lab2.id, plan: 'lab_basic', status: 'active', price: 499, validUntil: new Date(Date.now() + 365 * 86400000) },
  })
  await prisma.subscription.upsert({
    where:  { id: 'sub_pearl_tech' },
    update: {},
    create: { id: 'sub_pearl_tech', labId: lab3.id, plan: 'lab_basic', status: 'active', price: 499, validUntil: new Date(Date.now() + 365 * 86400000) },
  })

  console.log('✅ Multi-lab seed complete!')
  console.log('New users (password: local123):')
  console.log('  manager@smilepro.co.il  — lab_manager (Smile Pro Lab)')
  console.log('  manager@pearltech.co.il — lab_manager (Pearl Tech Lab)')
  console.log('  dr.levi@dental.co.il    — doctor (multi-lab)')
  console.log('Roger (roger@dental.co.il) — labId removed, can choose lab per order')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => prisma.$disconnect())
