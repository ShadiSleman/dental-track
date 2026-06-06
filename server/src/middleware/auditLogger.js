const AuditLog = require('../models/AuditLog')

const LOGGED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

const auditLogger = (action) => async (req, res, next) => {
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      AuditLog.create({
        actor:  req.user._id,
        action: action || `${req.method} ${req.path}`,
        target: req.params?.id,
        meta:   req.body ? Object.keys(req.body).reduce((acc, k) => {
          if (!['password', 'passwordHash', 'token'].includes(k)) acc[k] = req.body[k]
          return acc
        }, {}) : undefined,
        ip: req.ip || req.connection?.remoteAddress,
      }).catch(() => {})
    }
  })
  next()
}

const autoAudit = async (req, res, next) => {
  if (!LOGGED_METHODS.includes(req.method)) return next()
  res.on('finish', () => {
    if (res.statusCode < 400 && req.user) {
      AuditLog.create({
        actor:  req.user._id,
        action: `${req.method.toLowerCase()}_${req.path.split('/').filter(Boolean).join('_')}`,
        target: req.params?.id,
        ip:     req.ip || req.connection?.remoteAddress,
      }).catch(() => {})
    }
  })
  next()
}

module.exports = { auditLogger, autoAudit }
