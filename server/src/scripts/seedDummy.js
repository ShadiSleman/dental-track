// Dummy data seed — creates work orders across all stages + messages + notifications
// Run AFTER seed.js: node server/src/scripts/seedDummy.js
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const STAGES = [
  'scan_received','order_opened','cad_design','awaiting_approval','approved',
  'manufacturing','finishing','quality_check','ready_to_ship','with_courier','delivered',
]
const WORK_TYPES = ['crown','bridge','implant','veneer','denture','nightguard','other']
const PATIENT_CODES = [
  'P001','P002','P003','P004','P005','P006','P007','P008','P009','P010',
  'P011','P012','P013','P014','P015','P016',
]

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

const doctorRef  = { _id: 'user_doctor',  name: 'ד"ר כהן',      role: 'doctor' }
const techRef    = { _id: 'user_tech',    name: 'טכנאי יוסי',   role: 'technician' }
const labRef     = { _id: 'user_lab',     name: 'מנהל מעבדה',   role: 'lab_manager' }

function buildHistory(stages, userRef) {
  return stages.map((stage, i) => ({
    stage,
    by:     userRef,
    note:   `שלב ${stage} הושלם`,
    at:     daysAgo(stages.length - i).toISOString(),
    images: [],
  }))
}

async function main() {
  console.log('🌱 Seeding dummy work orders…')

  // Clear existing work orders (cascades messages + notifications)
  await prisma.workOrder.deleteMany({})
  console.log('  🗑️  Cleared existing work orders')

  const year = new Date().getFullYear()
  let orderCount = 0

  const orders = []
  for (let i = 0; i < 16; i++) {
    const stageIdx  = i % STAGES.length
    const stage     = STAGES[stageIdx]
    const stagesSoFar = STAGES.slice(0, stageIdx + 1)
    const workType  = WORK_TYPES[i % WORK_TYPES.length]
    const patient   = PATIENT_CODES[i]
    const isDelayed = i % 4 === 3

    orders.push({
      orderNumber: `WO-${year}-${String(i + 1).padStart(4, '0')}`,
      patientCode: patient,
      workType,
      currentStage: stage,
      dueDate:  daysAgo(-7 + i),
      notes:    `עבודה לדוגמה — ${workType} עבור מטופל ${patient}`,
      isDelayed,
      requiresDoctorApproval: stage === 'awaiting_approval',
      doctorId: 'user_doctor',
      clinicId: 'clinic_main',
      labId:    'lab_main',
      assignedTechnicianId: stageIdx >= 2 ? 'user_tech' : null,
      stageHistory: buildHistory(stagesSoFar, stageIdx < 2 ? doctorRef : techRef),
      files: [],
      createdAt: daysAgo(30 - i * 2),
    })
  }

  for (const o of orders) {
    const order = await prisma.workOrder.create({ data: o })
    orderCount++

    // Add 2 messages per order
    await prisma.message.createMany({
      data: [
        { workOrderId: order.id, senderId: 'user_doctor', text: `עדכון על עבודה ${order.orderNumber} — האם יש עיכובים?`, createdAt: daysAgo(3) },
        { workOrderId: order.id, senderId: 'user_tech',   text: 'העבודה מתקדמת כמתוכנן, נסיים בזמן.', createdAt: daysAgo(2) },
      ],
    })

    // Add notification to doctor
    await prisma.notification.create({
      data: {
        userId:      'user_doctor',
        workOrderId: order.id,
        type:        order.currentStage === 'awaiting_approval' ? 'approval_needed' : 'stage_update',
        title:       order.currentStage === 'awaiting_approval' ? 'ממתין לאישורך' : 'עדכון עבודה',
        body:        `עבודה ${order.orderNumber} — ${order.currentStage}`,
        read:        Math.random() > 0.5,
      },
    })
  }

  // Add a few audit logs
  await prisma.auditLog.createMany({
    data: [
      { actorId: 'user_lab',    action: 'login',         ip: '127.0.0.1', createdAt: daysAgo(1) },
      { actorId: 'user_doctor', action: 'order_created', ip: '127.0.0.1', createdAt: daysAgo(2) },
      { actorId: 'user_tech',   action: 'stage_updated', ip: '127.0.0.1', createdAt: daysAgo(1) },
    ],
  })

  // Add a support ticket
  await prisma.supportTicket.create({
    data: {
      fromId:  'user_doctor',
      subject: 'שאלה על הגדרת מעבדה',
      body:    'היי, כיצד ניתן להוסיף עוד טכנאים למעבדה?',
      status:  'open',
      replies: [],
    },
  })

  console.log(`\n🎉 Done! Created ${orderCount} orders with messages + notifications`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
