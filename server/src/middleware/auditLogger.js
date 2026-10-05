const prisma = require('../lib/prisma')

const LOGGED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

/** Named action audit — use as route middleware: auditLogger('order_created') */
const auditLogger = (action) => async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      const meta = req.body
        ? Object.keys(req.body).reduce((acc, k) => {
            if (!['password', 'passwordHash', 'token'].includes(k)) acc[k] = req.body[k]
            return acc
          }, {})
        : undefined

      prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          action:  action || `${req.method} ${req.path}`,
          target:  req.params?.id,
          meta,
          ip: req.ip || req.connection?.remoteAddress,
        },
      }).catch(() => {})
    }
  })
  next()
}

/** Auto audit — attaches to router-level, logs all mutating requests */
const autoAudit = async (req, res, next) => {
  if (!LOGGED_METHODS.includes(req.method)) return next()
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      prisma.auditLog.create({
        data: {
          actorId: req.user.id,
          action:  `${req.method.toLowerCase()}_${req.path.split('/').filter(Boolean).join('_')}`,
          target:  req.params?.id,
          ip:      req.ip || req.connection?.remoteAddress,
        },
      }).catch(() => {})
    }
  })
  next()
}

module.exports = { auditLogger, autoAudit }
