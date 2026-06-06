const router = require('express').Router()
const multer = require('multer')
const cloudinary = require('cloudinary').v2
const WorkOrder = require('../models/WorkOrder')
const Notification = require('../models/Notification')
const authJwt = require('../middleware/authJwt')
const roleGuard = require('../middleware/roleGuard')
const { auditLogger } = require('../middleware/auditLogger')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 50 * 1024 * 1024 } })

const uploadToCloud = (buffer, mimetype, folder) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'auto' },
      (err, result) => err ? reject(err) : resolve(result)
    )
    stream.end(buffer)
  })

const populate = (q) =>
  q.populate('doctor','name email role')
   .populate('clinic','name address phone')
   .populate('lab','name address phone')
   .populate('assignedTechnician','name email')
   .populate('stageHistory.by','name role')

router.use(authJwt)

// GET /api/work-orders/mine
router.get('/mine', async (req, res) => {
  try {
    let q = {}
    const u = req.user
    if (u.role === 'doctor')      q = { doctor: u._id }
    if (u.role === 'lab_manager') q = { lab: u.labId }
    if (u.role === 'technician')  q = { assignedTechnician: u._id }
    if (u.role === 'courier')     q = { currentStage: { $in: ['ready_to_ship','with_courier'] } }
    const orders = await populate(WorkOrder.find(q).sort({ createdAt: -1 }))
    res.json(orders)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/work-orders
router.get('/', roleGuard('lab_manager','super_admin','courier'), async (req, res) => {
  try {
    const filter = {}
    if (req.user.role === 'lab_manager') filter.lab = req.user.labId
    if (req.query.stage) filter.currentStage = { $in: req.query.stage.split(',') }
    const orders = await populate(WorkOrder.find(filter).sort({ createdAt: -1 }))
    res.json(orders)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /api/work-orders/:id
router.get('/:id', async (req, res) => {
  try {
    const order = await populate(WorkOrder.findById(req.params.id))
    if (!order) return res.status(404).json({ error: 'Not found' })
    res.json(order)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/work-orders
router.post('/', roleGuard('doctor'), upload.array('files'), auditLogger('order_created'), async (req, res) => {
  try {
    const { patientCode, workType, dueDate, notes } = req.body
    const doctor = req.user
    if (!doctor.clinicId || !doctor.labId) {
      return res.status(400).json({ error: 'Doctor must be associated with a clinic and lab' })
    }
    const files = []
    for (const f of (req.files || [])) {
      const result = await uploadToCloud(f.buffer, f.mimetype, 'dental-track/orders')
      files.push({ url: result.secure_url, type: f.mimetype, name: f.originalname })
    }
    const order = await WorkOrder.create({
      patientCode, workType, dueDate, notes,
      doctor: doctor._id, clinic: doctor.clinicId, lab: doctor.labId,
      currentStage: 'scan_received',
      stageHistory: [{ stage: 'scan_received', by: doctor._id, note: 'עבודה נשלחה מהמרפאה' }],
      files,
    })
    const populated = await populate(WorkOrder.findById(order._id))
    req.app.get('io')?.to(`lab_${doctor.labId}`).emit('new_order', populated)
    res.status(201).json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/work-orders/:id/stage
router.patch('/:id/stage', roleGuard('technician','lab_manager'), auditLogger('stage_updated'), async (req, res) => {
  try {
    const { stage, note } = req.body
    const order = await WorkOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Not found' })
    order.currentStage = stage
    order.requiresDoctorApproval = stage === 'awaiting_approval'
    order.stageHistory.push({ stage, by: req.user._id, note })
    await order.save()
    const populated = await populate(WorkOrder.findById(order._id))
    const io = req.app.get('io')
    io?.to(`user_${order.doctor}`).emit('stage_updated', populated)
    io?.to(`user_${order.doctor}`).emit('notification', {
      _id: Date.now().toString(),
      type: stage === 'awaiting_approval' ? 'approval_needed' : 'stage_update',
      title: stage === 'awaiting_approval' ? 'ממתין לאישורך' : 'עדכון עבודה',
      body: `עבודה ${order.orderNumber} — ${stage}`,
      workOrderId: order._id,
      read: false,
      createdAt: new Date().toISOString(),
    })
    res.json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/work-orders/:id/approve
router.patch('/:id/approve', roleGuard('doctor'), auditLogger('order_approved'), async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Not found' })
    order.currentStage = 'approved'
    order.requiresDoctorApproval = false
    order.returnReason = undefined
    order.stageHistory.push({ stage: 'approved', by: req.user._id, note: 'אושר על ידי הרופא' })
    await order.save()
    const populated = await populate(WorkOrder.findById(order._id))
    if (order.assignedTechnician) {
      req.app.get('io')?.to(`user_${order.assignedTechnician}`).emit('stage_updated', populated)
    }
    res.json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/work-orders/:id/reject
router.patch('/:id/reject', roleGuard('doctor'), auditLogger('order_rejected'), async (req, res) => {
  try {
    const { reason } = req.body
    const order = await WorkOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Not found' })
    order.currentStage = 'cad_design'
    order.requiresDoctorApproval = false
    order.returnReason = reason
    order.stageHistory.push({ stage: 'cad_design', by: req.user._id, note: `נדחה: ${reason}` })
    await order.save()
    const populated = await populate(WorkOrder.findById(order._id))
    if (order.assignedTechnician) {
      const io = req.app.get('io')
      io?.to(`user_${order.assignedTechnician}`).emit('stage_updated', populated)
      io?.to(`user_${order.assignedTechnician}`).emit('notification', {
        _id: Date.now().toString(),
        type: 'stage_update',
        title: 'עבודה חוזרת',
        body: `עבודה ${order.orderNumber} נדחתה: ${reason}`,
        workOrderId: order._id,
        read: false,
        createdAt: new Date().toISOString(),
      })
    }
    res.json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/work-orders/:id/assign
router.patch('/:id/assign', roleGuard('lab_manager'), async (req, res) => {
  try {
    const order = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { assignedTechnician: req.body.technicianId },
      { new: true }
    )
    const populated = await populate(WorkOrder.findById(order._id))
    res.json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/work-orders/:id/images
router.post('/:id/images', upload.array('images'), async (req, res) => {
  try {
    const order = await WorkOrder.findById(req.params.id)
    if (!order) return res.status(404).json({ error: 'Not found' })
    const urls = []
    for (const f of (req.files || [])) {
      const result = await uploadToCloud(f.buffer, f.mimetype, 'dental-track/stage-images')
      urls.push(result.secure_url)
    }
    const lastEntry = order.stageHistory[order.stageHistory.length - 1]
    if (lastEntry) lastEntry.images = [...(lastEntry.images || []), ...urls]
    await order.save()
    const populated = await populate(WorkOrder.findById(order._id))
    res.json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/work-orders/:id/signature
router.patch('/:id/signature', async (req, res) => {
  try {
    const order = await WorkOrder.findByIdAndUpdate(
      req.params.id,
      { signature: req.body.signature },
      { new: true }
    )
    res.json(order)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
