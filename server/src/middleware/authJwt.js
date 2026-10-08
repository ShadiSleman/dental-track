const jwt   = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const authJwt = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' })
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)

    // Fast path: JWT contains all needed fields — skip DB query entirely
    if (payload.role && payload.name) {
      req.user = {
        id:       payload.sub,
        _id:      payload.sub,
        name:     payload.name,
        email:    payload.email,
        role:     payload.role,
        labId:    payload.labId    || null,
        clinicId: payload.clinicId || null,
        isActive: payload.isActive !== false,
      }
      if (!req.user.isActive) return res.status(401).json({ error: 'Account suspended' })
      return next()
    }

    // Slow path: legacy token without embedded fields — fallback to DB lookup
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, labId: true, clinicId: true, isActive: true,
      },
    })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' })
    req.user = { ...user, _id: user.id }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = authJwt
