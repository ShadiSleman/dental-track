const jwt = require('jsonwebtoken')
const User = require('../models/User')

const authJwt = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' })
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('-passwordHash')
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' })
    req.user = user
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = authJwt
