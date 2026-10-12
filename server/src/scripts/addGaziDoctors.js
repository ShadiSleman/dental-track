// addGaziDoctors.js — adds 3 new doctors + realistic work orders for GAZI DENT
// Run: node server/src/scripts/addGaziDoctors.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const LAB_ID  = 'lab_main'   // GAZI DENT
const TECH_ID = 'user_tech'  // יוסי הטכנאי
const YEAR    = new Date().getFullYear()

const daysAgo  = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)
const daysAhead = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)

const STAGES = [
  'scan_received','order_opened','cad_design','awaiting_approval','approved',
  'manufacturing','finishing','quality_check','ready_to_ship','with_courier','delivered',
]
const WORK_TYPES = ['crown','bridge','implant','veneer','denture','nightguard','other']

function buildHistory(stagesArr, doctorRef, techRef) {
  return stagesArr.map((stage, i) => ({
    stage,
    by:   stagesArr.indexOf(stage) < 2 ? doctorRef : techRef,
    note: stageNote(stage),
    at:   daysAgo(stagesArr.length - i + 1).toISOString(),
    images: [],
  }))
}

function stageNote(stage) {
  const notes = {
    scan_received:     'הסריקה התקבלה בהצלחה',
    order_opened:      'העבודה נפתחה במעבדה',
    cad_design:        'תכנון CAD הושלם',
    awaiting_approval: 'ממתין לאישור הרופא',
    approved:          'הרופא אישר את העיצוב',
    manufacturing:     'הייצור החל',
    finishing:         'גימור וצביעה',
    quality_check:     'בקרת איכות עברה בהצלחה',
    ready_to_ship:     'מוכן למשלוח',
    with_courier:      'נמסר לשליח',
    delivered:         'נמסר למרפאה',
  }
  return notes[stage] || stage
}

async function main() {
  console.log('🌱 Adding doctors + work orders for GAZI DENT…\n')

  const hash = (p) => bcrypt.hash(p, 10)

  // ─── 1. Create clinics ──────────────────────────────────────────────────────
  const clinic_sharon = await prisma.clinic.upsert({
    where:  { id: 'clinic_sharon' },
    update: {},
    create: { id: 'clinic_sharon', name: 'מרפאת שרון — ד"ר שרון', address: 'דרך מנחם בגין 10, תל אביב', phone: '03-5551234', email: 'sharon@clinic.co.il' },
  })
  const clinic_mizrahi = await prisma.clinic.upsert({
    where:  { id: 'clinic_mizrahi' },
    update: {},
    create: { id: 'clinic_mizrahi', name: 'מרפאת מזרחי בע"מ', address: 'שד׳ ירושלים 30, פתח תקווה', phone: '03-5559876', email: 'mizrahi@clinic.co.il' },
  })
  const clinic_ben_david = await prisma.clinic.upsert({
    where:  { id: 'clinic_ben_david' },
    update: {},
    create: { id: 'clinic_ben_david', name: 'מרפאת בן-דוד', address: 'רחוב בן גוריון 55, ראשון לציון', phone: '03-9521111', email: 'bendavid@clinic.co.il' },
  })
  console.log('✅ Clinics ready')

  // ─── 2. Create doctors ──────────────────────────────────────────────────────
  const dr_sharon = await prisma.user.upsert({
    where:  { id: 'user_dr_sharon' },
    update: {},
    create: {
      id: 'user_dr_sharon',
      name: 'ד"ר שרון',
      email: 'dr.sharon@dentaltrack.co.il',
      passwordHash: await hash('local123'),
      role: 'doctor',
      phone: '050-1112222',
      clinicId: clinic_sharon.id,
    },
  })
  const dr_mizrahi = await prisma.user.upsert({
    where:  { id: 'user_dr_mizrahi' },
    update: {},
    create: {
      id: 'user_dr_mizrahi',
      name: 'ד"ר מזרחי',
      email: 'dr.mizrahi@dentaltrack.co.il',
      passwordHash: await hash('local123'),
      role: 'doctor',
      phone: '050-3334444',
      clinicId: clinic_mizrahi.id,
    },
  })
  const dr_ben_david = await prisma.user.upsert({
    where:  { id: 'user_dr_ben_david' },
    update: {},
    create: {
      id: 'user_dr_ben_david',
      name: 'ד"ר בן-דוד',
      email: 'dr.bendavid@dentaltrack.co.il',
      passwordHash: await hash('local123'),
      role: 'doctor',
      phone: '050-5556666',
      clinicId: clinic_ben_david.id,
    },
  })
  console.log('✅ Doctors ready: ד"ר שרון, ד"ר מזרחי, ד"ר בן-דוד')

  // ─── 3. Build work orders ───────────────────────────────────────────────────
  // Find the highest order number to continue from
  const lastOrder = await prisma.workOrder.findFirst({
    orderBy: { orderNumber: 'desc' },
    select:  { orderNumber: true },
  })
  const lastNum = lastOrder ? parseInt(lastOrder.orderNumber.split('-').pop(), 10) : 0
  let seq = lastNum + 1

  const doctors = [
    { user: dr_sharon,    clinic: clinic_sharon,    firstName: 'שרון', orders: 7 },
    { user: dr_mizrahi,   clinic: clinic_mizrahi,   firstName: 'מזרחי', orders: 6 },
    { user: dr_ben_david, clinic: clinic_ben_david, firstName: 'בן-דוד', orders: 5 },
  ]

  // Patient names (first+last)
  const PATIENTS = [
    { first: 'יוסי',    last: 'אביב',    code: 'PA001' },
    { first: 'מרים',   last: 'כהן',     code: 'PA002' },
    { first: 'דוד',    last: 'לוי',     code: 'PA003' },
    { first: 'רחל',    last: 'ברק',     code: 'PA004' },
    { first: 'אמיר',   last: 'שלום',    code: 'PA005' },
    { first: 'נועה',   last: 'גולן',    code: 'PA006' },
    { first: 'עמית',   last: 'דוידוב',  code: 'PA007' },
    { first: 'תמר',    last: 'פרץ',     code: 'PA008' },
    { first: 'אליאב',  last: 'שמיר',   code: 'PA009' },
    { first: 'ליאת',   last: 'נחום',    code: 'PA010' },
    { first: 'שי',     last: 'אורן',    code: 'PA011' },
    { first: 'גלית',   last: 'מנדל',   code: 'PA012' },
    { first: 'רועי',   last: 'ציון',    code: 'PA013' },
    { first: 'הדס',    last: 'ארד',     code: 'PA014' },
    { first: 'ניב',    last: 'שיר',     code: 'PA015' },
    { first: 'אורטל',  last: 'דגן',    code: 'PA016' },
    { first: 'בן',     last: 'אריאל',   code: 'PA017' },
    { first: 'שירה',   last: 'קרן',     code: 'PA018' },
  ]

  let patientIdx = 0
  let totalOrders = 0

  for (const { user, clinic, firstName, orders: orderCount } of doctors) {
    const drRef   = { _id: user.id,  name: user.name,  role: 'doctor' }
    const techRef = { _id: TECH_ID,  name: 'טכנאי יוסי', role: 'technician' }

    console.log(`\n📋 Creating ${orderCount} orders for ${user.name}…`)

    for (let i = 0; i < orderCount; i++) {
      const patient   = PATIENTS[patientIdx++ % PATIENTS.length]
      const stageIdx  = i % STAGES.length
      const stage     = STAGES[stageIdx]
      const stagesSoFar = STAGES.slice(0, stageIdx + 1)
      const workType  = WORK_TYPES[i % WORK_TYPES.length]
      const isDelayed = stage !== 'delivered' && i === orderCount - 1  // last order of each doctor is delayed
      const needsApproval = stage === 'awaiting_approval'
      const isOld     = i < 2  // first 2 are older orders (delivered/near-done)

      const orderNum = `WO-${YEAR}-${String(seq++).padStart(4, '0')}`
      const createdAgo = isOld ? 45 - i * 5 : 14 - i * 2

      const order = await prisma.workOrder.create({
        data: {
          orderNumber: orderNum,
          patientCode: patient.code + '_' + firstName.slice(0, 2).toUpperCase(),
          firstName:   patient.first,
          lastName:    patient.last,
          gender:      i % 2 === 0 ? 'זכר' : 'נקבה',
          birthDate:   new Date(1975 + (i * 7 % 30), (i * 3) % 12, 1),
          scanDate:    daysAgo(createdAgo + 2),
          workType,
          currentStage: stage,
          dueDate:     isOld ? daysAgo(5) : daysAhead(7 + i * 3),
          notes:       `עבודת ${workType} עבור מטופל ${patient.first} ${patient.last}. ${isDelayed ? '⚠️ יש לזרז!' : ''}`,
          isDelayed,
          requiresDoctorApproval: needsApproval,
          doctorId:    user.id,
          clinicId:    clinic.id,
          labId:       LAB_ID,
          assignedTechnicianId: stageIdx >= 2 ? TECH_ID : null,
          stageHistory: buildHistory(stagesSoFar, drRef, techRef),
          files: [],
          createdAt: daysAgo(createdAgo),
        },
      })

      // Add a couple of messages per order
      await prisma.message.createMany({
        data: [
          {
            workOrderId: order.id,
            senderId:    user.id,
            text:        `שלום, האם ניתן לעדכן לגבי עבודה ${orderNum} למטופל ${patient.first}?`,
            createdAt:   daysAgo(createdAgo - 1),
          },
          {
            workOrderId: order.id,
            senderId:    TECH_ID,
            text:        stageIdx >= 2 ? `העבודה נמצאת בשלב ${stageNote(stage)}, הכל תקין.` : 'ממתינים לפתיחת העבודה.',
            createdAt:   daysAgo(createdAgo - 2),
          },
        ],
      })

      // Notification for the doctor
      if (needsApproval || isDelayed) {
        await prisma.notification.create({
          data: {
            userId:      user.id,
            workOrderId: order.id,
            type:        needsApproval ? 'approval_needed' : 'delayed',
            title:       needsApproval ? 'ממתין לאישורך' : '⚠️ עבודה מאחרת',
            body:        `${orderNum} — ${patient.first} ${patient.last}`,
            read:        false,
          },
        })
      }

      totalOrders++
      console.log(`  ✅ ${orderNum} | ${patient.first} ${patient.last} | ${stage} | ${workType}${isDelayed ? ' 🔴' : ''}${needsApproval ? ' ⏳' : ''}`)
    }
  }

  console.log(`\n🎉 Done! Added 3 doctors + ${totalOrders} work orders to GAZI DENT`)
  console.log('\n📋 New doctor logins (all password: local123):')
  console.log('  dr.sharon@dentaltrack.co.il')
  console.log('  dr.mizrahi@dentaltrack.co.il')
  console.log('  dr.bendavid@dentaltrack.co.il')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
