// Express application — no server.listen (for Vercel serverless + local dev)
const express    = require('express')
const cors       = require('cors')
const helmet     = require('helmet')
const rateLimit  = require('express-rate-limit')
const prisma     = require('./lib/prisma')

const app = express()

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            500,
  standardHeaders: true,
  legacyHeaders:  false,
}))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'))
app.use('/api/work-orders',   require('./routes/workOrders'))
app.use('/api/messages',      require('./routes/messages'))
app.use('/api/notifications', require('./routes/notifications'))
app.use('/api/admin',         require('./routes/admin'))
app.use('/api/team',          require('./routes/team'))

app.get('/api/health', (req, res) =>
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: process.env.APP_ENV || 'local',
    r2: require('./lib/r2').R2_CONFIGURED,
  })
)

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use(async (err, req, res, next) => {
  console.error(err)
  try {
    await prisma.errorLog.create({
      data: { message: err.message, stack: err.stack, route: req.path }
    })
  } catch {}
  res.status(500).json({ error: err.message || 'Internal server error' })
})

module.exports = app
