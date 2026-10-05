const jwt    = require('jsonwebtoken')
const prisma = require('../lib/prisma')

const authJwt = async (req, res, next) => {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token' })
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, avatarUrl: true, labId: true, clinicId: true,
        isActive: true, lastLogin: true, createdAt: true, updatedAt: true,
      },
    })
    if (!user || !user.isActive) return res.status(401).json({ error: 'Unauthorized' })
    // Expose _id for backward compatibility
    req.user = { ...user, _id: user.id }
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

module.exports = authJwt
