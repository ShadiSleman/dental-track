const router    = require('express').Router()
const bcrypt    = require('bcryptjs')
const multer    = require('multer')
const prisma    = require('../lib/prisma')
const authJwt   = require('../middleware/authJwt')
const roleGuard = require('../middleware/roleGuard')
const { withId } = require('../lib/withId')
const { uploadToR2 } = require('../lib/r2')
const { linkToLab, unlinkFromLab, teamForLab, getPriceList, priceForPlan } = require('../lib/membership')

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

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
        const [technicianCount, doctorCount, openOrders] = await Promise.all([
          prisma.user.count({ where: { labId: lab.id, role: 'technician' } }),
          prisma.labMember.count({ where: { labId: lab.id, user: { role: 'doctor' } } }),
          prisma.workOrder.count({ where: { labId: lab.id, currentStage: { not: 'delivered' } } }),
        ])
        const sub = await prisma.subscription.findFirst({
          where: { labId: lab.id },
          orderBy: { createdAt: 'desc' }
        })
        return { ...withId(lab), technicianCount, doctorCount, openOrders, subscription: sub ? withId(sub) : null }
      })
    )
    res.json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// GET /admin/labs/:id — full detail: lab + team + subscriptions
router.get('/labs/:id', async (req, res) => {
  try {
    const lab = await prisma.lab.findUnique({ where: { id: req.params.id } })
    if (!lab) return res.status(404).json({ error: 'Lab not found' })

    const [team, subscriptions, openOrders, totalOrders] = await Promise.all([
      teamForLab(lab.id),
      prisma.subscription.findMany({
        where:   { labId: lab.id },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.workOrder.count({ where: { labId: lab.id, currentStage: { not: 'delivered' } } }),
      prisma.workOrder.count({ where: { labId: lab.id } }),
    ])

    res.json({
      ...withId(lab),
      team:          withId(team),
      subscriptions: withId(subscriptions),
      openOrders,
      totalOrders,
    })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /admin/labs — create lab + manager + subscription
router.post('/labs', async (req, res) => {
  try {
    const {
      name, address, phone, email,
      managerName, managerEmail, managerPassword,
      plan = 'lab_lifetime_3y', price, paymentNote,
    } = req.body

    if (!name || !managerEmail || !managerPassword) {
      return res.status(400).json({ error: 'name, managerEmail, managerPassword חובה' })
    }

    // Check email availability
    const existing = await prisma.user.findUnique({ where: { email: managerEmail } })
    if (existing) return res.status(409).json({ error: 'אימייל כבר קיים במערכת' })

    const passwordHash = await bcrypt.hash(managerPassword, 10)

    // Calculate validUntil based on plan
    const validUntil = new Date()
    if (plan === 'lab_lifetime_3y') {
      validUntil.setFullYear(validUntil.getFullYear() + 3)
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1)
    }

    // Create lab + manager in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const lab = await tx.lab.create({
        data: { name, address: address || null, phone: phone || null, email: email || null },
      })
      const manager = await tx.user.create({
        data: {
          name:         managerName || name,
          email:        managerEmail,
          passwordHash,
          role:         'lab_manager',
          labId:        lab.id,
        },
      })
      const sub = await tx.subscription.create({
        data: {
          labId:      lab.id,
          plan,
          status:     'active',
          price:      Number(price) || priceForPlan(await getPriceList(), plan),
          validUntil,
        },
      })
      return { lab: withId(lab), manager: withId(manager), subscription: withId(sub) }
    })

    res.status(201).json(result)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /admin/labs/:id — update lab details
router.patch('/labs/:id', async (req, res) => {
  try {
    const { name, address, phone, email, isActive } = req.body
    const data = {}
    if (name     !== undefined) data.name     = name
    if (address  !== undefined) data.address  = address
    if (phone    !== undefined) data.phone    = phone
    if (email    !== undefined) data.email    = email
    if (isActive !== undefined) data.isActive = isActive

    const lab = await prisma.lab.update({ where: { id: req.params.id }, data })
    res.json(withId(lab))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /admin/labs/:id
router.delete('/labs/:id', async (req, res) => {
  try {
    // Remove labId from users, then delete lab (cascade via DB)
    await prisma.user.updateMany({ where: { labId: req.params.id }, data: { labId: null } })
    await prisma.workOrder.deleteMany({ where: { labId: req.params.id } })
    await prisma.subscription.deleteMany({ where: { labId: req.params.id } })
    await prisma.lab.delete({ where: { id: req.params.id } })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /admin/labs/:id/logo — upload logo to R2
router.post('/labs/:id/logo', upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'קובץ לוגו נדרש' })
    const url = await uploadToR2(req.file.buffer, req.file.mimetype, req.file.originalname, 'logos')
    if (!url) return res.status(500).json({ error: 'שגיאת העלאה ל-R2' })
    const lab = await prisma.lab.update({ where: { id: req.params.id }, data: { logoUrl: url } })
    res.json(withId(lab))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /admin/labs/:id/team — add user (create new or assign existing)
router.post('/labs/:id/team', async (req, res) => {
  try {
    const { name, email, password, role, phone } = req.body
    if (!email || !role) return res.status(400).json({ error: 'email ו-role חובה' })

    let user = await prisma.user.findUnique({ where: { email } })
    if (user && user.role === 'doctor') {
      await linkToLab(user.id, req.params.id)
      return res.status(200).json({ ...withId(user), linkedExisting: true })
    }
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data:  { labId: req.params.id, role },
      })
    } else {
      if (!password) return res.status(400).json({ error: 'סיסמה נדרשת למשתמש חדש' })
      const passwordHash = await bcrypt.hash(password, 10)
      let clinicId = null
      if (role === 'doctor') {
        const clinic = await prisma.clinic.create({ data: { name: `מרפאת ${name || email}` } })
        clinicId = clinic.id
      }
      user = await prisma.user.create({
        data: {
          name: name || email, email, passwordHash, role, phone: phone || null,
          labId: role === 'doctor' ? null : req.params.id,
          clinicId,
        },
      })
      if (role === 'doctor') await linkToLab(user.id, req.params.id)
    }
    res.status(201).json(withId(user))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// DELETE /admin/labs/:id/team/:userId — remove user from lab
router.delete('/labs/:id/team/:userId', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.userId } })
    if (user?.role === 'doctor') {
      await unlinkFromLab(user.id, req.params.id)
    } else {
      await prisma.user.update({
        where: { id: req.params.userId },
        data:  { labId: null },
      })
    }
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /admin/labs/:id/subscriptions — add subscription / payment record
router.post('/labs/:id/subscriptions', async (req, res) => {
  try {
    const { plan, price, paymentNote } = req.body
    const validUntil = new Date()
    if (plan === 'lab_lifetime_3y') {
      validUntil.setFullYear(validUntil.getFullYear() + 3)
    } else {
      validUntil.setMonth(validUntil.getMonth() + 1)
    }
    const sub = await prisma.subscription.create({
      data: {
        labId:      req.params.id,
        plan,
        status:     'active',
        price:      Number(price) || priceForPlan(await getPriceList(), plan),
        validUntil,
      },
    })
    res.status(201).json(withId(sub))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Price list (catalog for NEW subscriptions only) ─────────────────────────
router.get('/pricing', async (req, res) => {
  try {
    res.json(await getPriceList())
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.patch('/pricing', async (req, res) => {
  try {
    const { lifetimePrice, starterPrice, standardPrice, proPrice } = req.body
    const data = {}
    if (lifetimePrice != null) data.lifetimePrice = Number(lifetimePrice)
    if (starterPrice  != null) data.starterPrice  = Number(starterPrice)
    if (standardPrice != null) data.standardPrice = Number(standardPrice)
    if (proPrice      != null) data.proPrice      = Number(proPrice)
    await getPriceList()
    const row = await prisma.priceList.update({ where: { id: 'default' }, data })
    res.json(row)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── Subscriptions ────────────────────────────────────────────────────────────
router.get('/subscriptions', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const where = {}
    if (status) where.status = status
    const [rawSubs, total] = await Promise.all([
      prisma.subscription.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip:    (Number(page) - 1) * Number(limit),
        take:    Number(limit),
        include: { lab: { select: { id: true, name: true } } },
      }),
      prisma.subscription.count({ where }),
    ])

    const VAT = 0.18
    const subscriptions = rawSubs.map(s => ({
      ...withId(s),
      labName:       s.lab?.name ?? '—',
      renewsAt:      s.validUntil,      // alias for frontend
      startedAt:     s.createdAt,
      priceExVat:    s.price,
      priceIncVat:   Math.round(s.price * (1 + VAT)),
    }))

    res.json({ subscriptions, total })
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
