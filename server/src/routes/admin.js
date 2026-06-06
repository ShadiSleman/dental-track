const router = require('express').Router()
const User = require('../models/User')
const Lab = require('../models/Lab')
const Clinic = require('../models/Clinic')
const WorkOrder = require('../models/WorkOrder')
const AuditLog = require('../models/AuditLog')
const ErrorLog = require('../models/ErrorLog')
const Subscription = require('../models/Subscription')
const SupportTicket = require('../models/SupportTicket')
const authJwt = require('../middleware/authJwt')
const roleGuard = require('../middleware/roleGuard')

router.use(authJwt, roleGuard('super_admin'))

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalLabs, totalClinics, totalOrders, openOrders, delayedOrders] = await Promise.all([
      User.countDocuments(),
      Lab.countDocuments(),
      Clinic.countDocuments(),
      WorkOrder.countDocuments(),
      WorkOrder.countDocuments({ currentStage: { $ne: 'delivered' } }),
      WorkOrder.countDocuments({ isDelayed: true }),
    ])

    const activeSubs = await Subscription.find({ status: 'active' })
    const mrr = activeSubs.reduce((acc, s) => acc + (s.price || 0), 0)

    const recentSignups = await User.find().sort({ createdAt: -1 }).limit(10).select('-passwordHash')

    const now = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = await WorkOrder.countDocuments({ createdAt: { $gte: d, $lt: end } })
      months.push({ month: d.toLocaleString('he-IL', { month: 'short', year: '2-digit' }), count })
    }

    const topLabs = await WorkOrder.aggregate([
      { $group: { _id: '$lab', orders: { $sum: 1 } } },
      { $sort: { orders: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'labs', localField: '_id', foreignField: '_id', as: 'lab' } },
      { $unwind: '$lab' },
      { $project: { name: '$lab.name', orders: 1 } },
    ])

    res.json({ totalUsers, totalLabs, totalClinics, totalOrders, openOrders, delayedOrders, mrr, recentSignups, ordersByMonth: months, topLabs })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query
    const filter = {}
    if (role) filter.role = role
    if (search) filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ]
    const [users, total] = await Promise.all([
      User.find(filter).select('-passwordHash').sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)),
      User.countDocuments(filter),
    ])
    res.json({ users, total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive, role, name, phone } = req.body
    const update = {}
    if (isActive !== undefined) update.isActive = isActive
    if (role) update.role = role
    if (name) update.name = name
    if (phone) update.phone = phone
    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('-passwordHash')
    if (!user) return res.status(404).json({ error: 'Not found' })
    res.json(user)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const tempPass = Math.random().toString(36).slice(2, 10)
    const passwordHash = await User.hashPassword(tempPass)
    await User.findByIdAndUpdate(req.params.id, { passwordHash })
    res.json({ tempPassword: tempPass })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Labs ─────────────────────────────────────────────────────────────────────
router.get('/labs', async (req, res) => {
  try {
    const labs = await Lab.find().sort({ createdAt: -1 })
    const result = await Promise.all(labs.map(async (lab) => {
      const [technicianCount, openOrders] = await Promise.all([
        User.countDocuments({ labId: lab._id, role: 'technician' }),
        WorkOrder.countDocuments({ lab: lab._id, currentStage: { $ne: 'delivered' } }),
      ])
      const sub = await Subscription.findOne({ accountId: lab._id, accountModel: 'Lab' })
      return { ...lab.toObject(), technicianCount, openOrders, plan: sub?.plan }
    }))
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Subscriptions ────────────────────────────────────────────────────────────
router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = {}
    if (status) filter.status = status
    const [subscriptions, total] = await Promise.all([
      Subscription.find(filter).sort({ createdAt: -1 })
        .skip((page - 1) * limit).limit(Number(limit)),
      Subscription.countDocuments(filter),
    ])
    res.json({ subscriptions, total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/subscriptions/:id', async (req, res) => {
  try {
    const sub = await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!sub) return res.status(404).json({ error: 'Not found' })
    res.json(sub)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Logs ─────────────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 30, search, action } = req.query
    const filter = {}
    if (action) filter.action = action
    if (search) filter.$or = [{ action: { $regex: search, $options: 'i' } }]
    const [logs, total] = await Promise.all([
      AuditLog.find(filter).populate('actor', 'name role')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      AuditLog.countDocuments(filter),
    ])
    res.json({ logs, total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const mongoose = require('mongoose')
    const recentErrors = await ErrorLog.find().sort({ createdAt: -1 }).limit(50)
    const io = req.app.get('io')
    const socketClients = io ? io.engine.clientsCount : 0
    res.json({
      uptime:        process.uptime(),
      dbStatus:      mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      socketClients,
      recentErrors:  recentErrors.map(e => ({ message: e.message, route: e.route, createdAt: e.createdAt })),
      nodeVersion:   process.version,
      region:        process.env.RENDER_REGION || 'local',
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Support tickets ──────────────────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status) filter.status = status
    const [tickets, total] = await Promise.all([
      SupportTicket.find(filter).populate('from', 'name email')
        .sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)),
      SupportTicket.countDocuments(filter),
    ])
    res.json({ tickets, total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      {
        $push: { replies: { sender: 'Admin', text: req.body.text, at: new Date() } },
        $set:  { status: 'in_progress' },
      },
      { new: true }
    ).populate('from', 'name email')
    res.json(ticket)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(ticket)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
