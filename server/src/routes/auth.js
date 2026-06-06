const router = require('express').Router()
const jwt = require('jsonwebtoken')
const User = require('../models/User')
const AuditLog = require('../models/AuditLog')
const authJwt = require('../middleware/authJwt')

const sign = (user) =>
  jwt.sign({ sub: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '30d' })

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email })
    if (!user || !(await user.comparePassword(password))) {
      await AuditLog.create({ action: 'failed_login', meta: { email }, ip: req.ip })
      return res.status(401).json({ error: 'Invalid credentials' })
    }
    if (!user.isActive) return res.status(403).json({ error: 'Account suspended' })
    user.lastLogin = new Date()
    await user.save()
    await AuditLog.create({ actor: user._id, action: 'login', ip: req.ip })
    res.json({ token: sign(user), user: user.toObject({ transform: (doc, ret) => { delete ret.passwordHash; return ret } }) })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/me', authJwt, (req, res) => res.json(req.user))

module.exports = router
