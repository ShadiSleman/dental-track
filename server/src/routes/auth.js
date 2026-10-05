const router  = require('express').Router()
const jwt     = require('jsonwebtoken')
const bcrypt  = require('bcryptjs')
const prisma  = require('../lib/prisma')
const authJwt = require('../middleware/authJwt')
const { withId } = require('../lib/withId')

const sign = (user) =>
  jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '30d' })

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await prisma.user.findUnique({ where: { email: email?.toLowerCase() } })

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      await prisma.auditLog.create({
        data: { action: 'failed_login', meta: { email }, ip: req.ip }
      }).catch(() => {})
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!user.isActive) return res.status(403).json({ error: 'Account suspended' })

    await prisma.user.update({ where: { id: user.id }, data: { lastLogin: new Date() } })
    await prisma.auditLog.create({ data: { actorId: user.id, action: 'login', ip: req.ip } }).catch(() => {})

    const { passwordHash, ...safeUser } = user
    res.json({ token: sign(user), user: withId(safeUser) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/auth/me
router.get('/me', authJwt, (req, res) => {
  res.json(withId(req.user))
})

module.exports = router
