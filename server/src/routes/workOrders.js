const router    = require('express').Router()
const multer    = require('multer')
const prisma    = require('../lib/prisma')
const { uploadToR2 } = require('../lib/r2')
const authJwt   = require('../middleware/authJwt')
const roleGuard = require('../middleware/roleGuard')
const { auditLogger } = require('../middleware/auditLogger')
const { withId } = require('../lib/withId')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

// Prisma include spec — same shape as Mongoose populate
const orderInclude = {
  doctor:             { select: { id: true, name: true, email: true, role: true } },
  clinic:             { select: { id: true, name: true, address: true, phone: true } },
  lab:                { select: { id: true, name: true, address: true, phone: true } },
  assignedTechnician: { select: { id: true, name: true, email: true } },
}

// Generate next order number — WO-YYYY-NNNN
const nextOrderNumber = async () => {
  const year  = new Date().getFullYear()
  const count = await prisma.workOrder.count()
  return `WO-${year}-${String(count + 1).padStart(4, '0')}`
}

// Notify a user (fire-and-forget)
const notify = (userId, workOrderId, type, title, body) =>
  prisma.notification.create({ data: { userId, workOrderId, type, title, body } }).catch(() => {})

router.use(authJwt)

// ─── GET /api/work-orders/stats ───────────────────────────────────────────────
router.get('/stats', roleGuard('lab_manager', 'super_admin'), async (req, res) => {
  try {
    const labFilter = req.user.role === 'lab_manager' ? { labId: req.user.labId } : {}

    const [total, open, delayed, delivered] = await Promise.all([
      prisma.workOrder.count({ where: labFilter }),
      prisma.workOrder.count({ where: { ...labFilter, currentStage: { not: 'delivered' } } }),
      prisma.workOrder.count({ where: { ...labFilter, isDelayed: true } }),
      prisma.workOrder.count({ where: { ...labFilter, currentStage: 'delivered' } }),
    ])

    // By stage
    const byStageRaw = await prisma.workOrder.groupBy({
      by: ['currentStage'],
      where: labFilter,
      _count: { id: true },
    })
    const byStage = byStageRaw.map(r => ({ _id: r.currentStage, count: r._count.id }))

    // By work type
    const byTypeRaw = await prisma.workOrder.groupBy({
      by: ['workType'],
      where: labFilter,
      _count: { id: true },
    })
    const byType = byTypeRaw.map(r => ({ _id: r.workType, count: r._count.id }))

    // By month (last 6)
    const now    = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = await prisma.workOrder.count({
        where: { ...labFilter, createdAt: { gte: start, lt: end } },
      })
      const label = start.toLocaleString('he-IL', { month: 'short', year: '2-digit' })
      months.push({ month: label, count })
    }

    // By technician (top 5)
    const byTechRaw = await prisma.workOrder.groupBy({
      by:    ['assignedTechnicianId'],
      where: { ...labFilter, assignedTechnicianId: { not: null } },
      _count: { id: true },
      _sum:   { isDelayed: true },
      orderBy: { _count: { id: 'desc' } },
      take:  5,
    })
    const byTech = await Promise.all(
      byTechRaw.map(async r => {
        const user = await prisma.user.findUnique({
          where: { id: r.assignedTechnicianId },
          select: { id: true, name: true },
        })
        return {
          _id:     r.assignedTechnicianId,
          name:    user?.name || 'לא ידוע',
          orders:  r._count.id,
          delayed: 0, // groupBy _sum on boolean not supported in Prisma easily — skip for now
        }
      })
    )

    res.json({ total, open, delayed, delivered, byStage, byType, byMonth: months, byTech })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET /api/work-orders/mine ────────────────────────────────────────────────
router.get('/mine', async (req, res) => {
  try {
    const u = req.user
    let where = {}
    if (u.role === 'doctor')      where = { doctorId: u.id }
    if (u.role === 'lab_manager') where = { labId: u.labId }
    if (u.role === 'technician')  where = { assignedTechnicianId: u.id }
    if (u.role === 'courier')     where = { currentStage: { in: ['ready_to_ship', 'with_courier'] } }

    const orders = await prisma.workOrder.findMany({
      where,
      include:  orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json(withId(orders))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET /api/work-orders ─────────────────────────────────────────────────────
router.get('/', roleGuard('lab_manager', 'super_admin', 'courier'), async (req, res) => {
  try {
    const where = {}
    if (req.user.role === 'lab_manager') where.labId = req.user.labId
    if (req.query.stage) where.currentStage = { in: req.query.stage.split(',') }

    const orders = await prisma.workOrder.findMany({
      where,
      include:  orderInclude,
      orderBy: { createdAt: 'desc' },
    })
    res.json(withId(orders))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET /api/work-orders/:id ─────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const order = await prisma.workOrder.findUnique({
      where: { id: req.params.id },
      include: orderInclude,
    })
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── POST /api/work-orders ────────────────────────────────────────────────────
router.post('/', roleGuard('doctor'), upload.array('files'), auditLogger('order_created'), async (req, res) => {
  try {
    const { firstName, lastName, gender, birthDate, scanDate, notes } = req.body
    const doctor = req.user

    if (!doctor.clinicId || !doctor.labId)
      return res.status(400).json({ error: 'Doctor must be associated with a clinic and lab' })

    if (!firstName || !lastName)
      return res.status(400).json({ error: 'יש למלא שם פרטי ושם משפחה' })

    if (!scanDate)
      return res.status(400).json({ error: 'יש למלא תאריך סריקת עבודה' })

    // Upload files to R2 (skipped gracefully if R2 not configured)
    const files = []
    for (const f of (req.files || [])) {
      const url = await uploadToR2(f.buffer, f.mimetype, f.originalname, 'orders')
      if (url) files.push({ url, type: f.mimetype, name: f.originalname, uploadedAt: new Date().toISOString() })
    }

    const stageHistory = [{
      stage: 'scan_received',
      by:    { _id: doctor.id, name: doctor.name, role: doctor.role },
      note:  'עבודה נשלחה מהמרפאה',
      at:    new Date().toISOString(),
      images: [],
    }]

    const order = await prisma.workOrder.create({
      data: {
        orderNumber: await nextOrderNumber(),
        patientCode: `${firstName} ${lastName}`,
        firstName,
        lastName,
        gender:    gender   || null,
        birthDate: birthDate ? new Date(birthDate) : null,
        scanDate:  scanDate  ? new Date(scanDate)  : null,
        workType: 'other',
        notes,
        doctorId: doctor.id,
        clinicId: doctor.clinicId,
        labId:    doctor.labId,
        currentStage: 'scan_received',
        stageHistory,
        files,
      },
      include: orderInclude,
    })

    // Notify all lab_managers of this lab
    const labManagers = await prisma.user.findMany({
      where: { labId: doctor.labId, role: 'lab_manager', isActive: true },
      select: { id: true },
    })
    labManagers.forEach(m =>
      notify(m.id, order.id, 'stage_update', 'עבודה חדשה התקבלה 📥',
        `עבודה ${order.orderNumber} — ${firstName} ${lastName} נשלחה ממרפאה`)
    )

    res.status(201).json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PATCH /api/work-orders/:id/stage ────────────────────────────────────────
router.patch('/:id/stage', roleGuard('technician', 'lab_manager', 'super_admin'), auditLogger('stage_updated'), async (req, res) => {
  try {
    const { stage, note } = req.body
    const existing = await prisma.workOrder.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const stageHistory = [
      ...(Array.isArray(existing.stageHistory) ? existing.stageHistory : []),
      {
        stage,
        by:   { _id: req.user.id, name: req.user.name, role: req.user.role },
        note: note || '',
        at:   new Date().toISOString(),
        images: [],
      },
    ]

    const order = await prisma.workOrder.update({
      where: { id: req.params.id },
      data: {
        currentStage:           stage,
        requiresDoctorApproval: stage === 'awaiting_approval',
        stageHistory,
      },
      include: orderInclude,
    })

    // Notify doctor (polling delivers it in ≤4 s)
    notify(
      existing.doctorId,
      existing.id,
      stage === 'awaiting_approval' ? 'approval_needed' : 'stage_update',
      stage === 'awaiting_approval' ? 'ממתין לאישורך' : 'עדכון עבודה',
      `עבודה ${existing.orderNumber} — ${stage}`,
    )

    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PATCH /api/work-orders/:id/approve ──────────────────────────────────────
router.patch('/:id/approve', roleGuard('doctor'), auditLogger('order_approved'), async (req, res) => {
  try {
    const existing = await prisma.workOrder.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const stageHistory = [
      ...(Array.isArray(existing.stageHistory) ? existing.stageHistory : []),
      {
        stage: 'approved',
        by:    { _id: req.user.id, name: req.user.name, role: req.user.role },
        note:  'אושר על ידי הרופא',
        at:    new Date().toISOString(),
        images: [],
      },
    ]

    const order = await prisma.workOrder.update({
      where: { id: req.params.id },
      data:  { currentStage: 'approved', requiresDoctorApproval: false, returnReason: null, stageHistory },
      include: orderInclude,
    })

    if (existing.assignedTechnicianId) {
      notify(existing.assignedTechnicianId, existing.id, 'stage_update', 'עבודה אושרה', `עבודה ${existing.orderNumber} אושרה`)
    }

    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PATCH /api/work-orders/:id/reject ───────────────────────────────────────
router.patch('/:id/reject', roleGuard('doctor'), auditLogger('order_rejected'), async (req, res) => {
  try {
    const { reason } = req.body
    const existing = await prisma.workOrder.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const stageHistory = [
      ...(Array.isArray(existing.stageHistory) ? existing.stageHistory : []),
      {
        stage: 'cad_design',
        by:    { _id: req.user.id, name: req.user.name, role: req.user.role },
        note:  `נדחה: ${reason}`,
        at:    new Date().toISOString(),
        images: [],
      },
    ]

    const order = await prisma.workOrder.update({
      where: { id: req.params.id },
      data:  { currentStage: 'cad_design', requiresDoctorApproval: false, returnReason: reason, stageHistory },
      include: orderInclude,
    })

    if (existing.assignedTechnicianId) {
      notify(existing.assignedTechnicianId, existing.id, 'stage_update', 'עבודה חוזרת', `עבודה ${existing.orderNumber} נדחתה: ${reason}`)
    }

    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PATCH /api/work-orders/:id/assign ───────────────────────────────────────
router.patch('/:id/assign', roleGuard('lab_manager'), async (req, res) => {
  try {
    const order = await prisma.workOrder.update({
      where: { id: req.params.id },
      data:  { assignedTechnicianId: req.body.technicianId },
      include: orderInclude,
    })
    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── POST /api/work-orders/:id/images ────────────────────────────────────────
router.post('/:id/images', upload.array('images'), async (req, res) => {
  try {
    const existing = await prisma.workOrder.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })

    const urls = []
    for (const f of (req.files || [])) {
      const url = await uploadToR2(f.buffer, f.mimetype, f.originalname, 'stage-images')
      urls.push(url)
    }

    const stageHistory = Array.isArray(existing.stageHistory) ? [...existing.stageHistory] : []
    if (stageHistory.length > 0) {
      const last = { ...stageHistory[stageHistory.length - 1] }
      last.images = [...(last.images || []), ...urls]
      stageHistory[stageHistory.length - 1] = last
    }

    const order = await prisma.workOrder.update({
      where: { id: req.params.id },
      data:  { stageHistory },
      include: orderInclude,
    })
    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PATCH /api/work-orders/:id/signature ────────────────────────────────────
router.patch('/:id/signature', async (req, res) => {
  try {
    const order = await prisma.workOrder.update({
      where: { id: req.params.id },
      data:  { signature: req.body.signature },
      include: orderInclude,
    })
    res.json(withId(order))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
