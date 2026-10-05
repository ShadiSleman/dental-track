const router    = require('express').Router()
const bcrypt    = require('bcryptjs')
const prisma    = require('../lib/prisma')
const authJwt   = require('../middleware/authJwt')
const roleGuard = require('../middleware/roleGuard')
const { withId } = require('../lib/withId')

router.use(authJwt, roleGuard('super_admin'))

// ─── Stats ────────────────────────────────────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalLabs, totalClinics, totalOrders, openOrders, delayedOrders] = await Promise.all([
      prisma.user.count(),
      prisma.lab.count(),
      prisma.clinic.count(),
      prisma.workOrder.count(),
      prisma.workOrder.count({ where: { currentStage: { not: 'delivered' } } }),
      prisma.workOrder.count({ where: { isDelayed: true } }),
    ])

    const activeSubs = await prisma.subscription.findMany({ where: { status: 'active' } })
    const mrr = activeSubs.reduce((acc, s) => acc + (s.price || 0), 0)

    const recentSignups = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take:    10,
      select:  { id: true, name: true, email: true, role: true, createdAt: true, isActive: true },
    })

    const now    = new Date()
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d   = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const count = await prisma.workOrder.count({ where: { createdAt: { gte: d, lt: end } } })
      months.push({ month: d.toLocaleString('he-IL', { month: 'short', year: '2-digit' }), count })
    }

    // Top 5 labs by order count
    const topLabsRaw = await prisma.workOrder.groupBy({
      by:      ['labId'],
      _count:  { id: true },
      orderBy: { _count: { id: 'desc' } },
      take:    5,
    })
    const topLabs = await Promise.all(
      topLabsRaw.map(async r => {
        const lab = await prisma.lab.findUnique({ where: { id: r.labId }, select: { name: true } })
        return { _id: r.labId, name: lab?.name || 'לא ידוע', orders: r._count.id }
      })
    )

    res.json({ totalUsers, totalLabs, totalClinics, totalOrders, openOrders, delayedOrders, mrr, recentSignups: withId(recentSignups), ordersByMonth: months, topLabs })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Users ────────────────────────────────────────────────────────────────────
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query
    const where = {}
    if (role) where.role = role
    if (search) where.OR = [
      { name:  { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ]

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select:  { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, labId: true, clinicId: true },
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.user.count({ where }),
    ])
    res.json({ users: withId(users), total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive, role, name, phone } = req.body
    const data = {}
    if (isActive !== undefined) data.isActive = isActive
    if (role)  data.role  = role
    if (name)  data.name  = name
    if (phone) data.phone = phone
    const user = await prisma.user.update({
      where:  { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true, isActive: true, phone: true },
    })
    res.json(withId(user))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.delete('/users/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/users/:id/reset-password', async (req, res) => {
  try {
    const tempPass     = Math.random().toString(36).slice(2, 10)
    const passwordHash = await bcrypt.hash(tempPass, 10)
    await prisma.user.update({ where: { id: req.params.id }, data: { passwordHash } })
    res.json({ tempPassword: tempPass })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Labs ─────────────────────────────────────────────────────────────────────
router.get('/labs', async (req, res) => {
  try {
    const labs = await prisma.lab.findMany({ orderBy: { createdAt: 'desc' } })
    const result = await Promise.all(
      labs.map(async (lab) => {
        const [technicianCount, openOrders] = await Promise.all([
          prisma.user.count({ where: { labId: lab.id, role: 'technician' } }),
          prisma.workOrder.count({ where: { labId: lab.id, currentStage: { not: 'delivered' } } }),
        ])
        const sub = await prisma.subscription.findFirst({ where: { labId: lab.id } })
        return { ...withId(lab), technicianCount, openOrders, plan: sub?.plan }
      })
    )
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Subscriptions ────────────────────────────────────────────────────────────
router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const where = {}
    if (status) where.status = status
    const [subscriptions, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.subscription.count({ where }),
    ])
    res.json({ subscriptions: withId(subscriptions), total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/subscriptions/:id', async (req, res) => {
  try {
    const sub = await prisma.subscription.update({ where: { id: req.params.id }, data: req.body })
    res.json(withId(sub))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/logs', async (req, res) => {
  try {
    const { page = 1, limit = 30, search, action } = req.query
    const where = {}
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (search) where.action = { contains: search, mode: 'insensitive' }

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { actor: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.auditLog.count({ where }),
    ])
    res.json({ logs: withId(logs), total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Health ───────────────────────────────────────────────────────────────────
router.get('/health', async (req, res) => {
  try {
    const recentErrors = await prisma.errorLog.findMany({
      orderBy: { createdAt: 'desc' },
      take:    50,
    })
    let dbStatus = 'connected'
    try { await prisma.$queryRaw`SELECT 1` } catch { dbStatus = 'disconnected' }

    res.json({
      uptime:       process.uptime(),
      dbStatus,
      socketClients: 0, // polling — no socket server
      recentErrors: recentErrors.map(e => ({ message: e.message, route: e.route, createdAt: e.createdAt })),
      nodeVersion:  process.version,
      env:          process.env.APP_ENV || 'local',
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Support tickets ──────────────────────────────────────────────────────────
router.get('/tickets', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const where = {}
    if (status) where.status = status
    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        include: { from: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
      }),
      prisma.supportTicket.count({ where }),
    ])
    res.json({ tickets: withId(tickets), total })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const existing = await prisma.supportTicket.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'Not found' })
    const replies = [
      ...(Array.isArray(existing.replies) ? existing.replies : []),
      { sender: 'Admin', text: req.body.text, at: new Date().toISOString() },
    ]
    const ticket = await prisma.supportTicket.update({
      where:   { id: req.params.id },
      data:    { replies, status: 'in_progress' },
      include: { from: { select: { id: true, name: true, email: true } } },
    })
    res.json(withId(ticket))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/tickets/:id', async (req, res) => {
  try {
    const ticket = await prisma.supportTicket.update({ where: { id: req.params.id }, data: req.body })
    res.json(withId(ticket))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
