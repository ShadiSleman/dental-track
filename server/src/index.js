require('dotenv').config()
const express = require('express')
const http = require('http')
const { Server } = require('socket.io')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const cloudinary = require('cloudinary').v2
const ErrorLog = require('./models/ErrorLog')

const app = express()
const server = http.createServer(app)

// ─── Socket.io ─────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
  },
})
require('./socket')(io)
app.set('io', io)

// ─── Middleware ─────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }))
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(express.urlencoded({ extended: true }))

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}))

// ─── Cloudinary ─────────────────────────────────────────────────────────────
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
}

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'))
app.use('/api/work-orders', require('./routes/workOrders'))
app.use('/api/messages',    require('./routes/messages'))
app.use('/api/admin',       require('./routes/admin'))

app.get('/api/health', (req, res) =>
  res.json({ status: 'ok', uptime: process.uptime() })
)

// ─── Error logging ───────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  ErrorLog.create({ message: err.message, stack: err.stack, route: req.path }).catch(() => {})
  console.error(err)
  res.status(500).json({ error: err.message })
})

// ─── MongoDB + Start ─────────────────────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB connected')
    const PORT = process.env.PORT || 5051
    server.listen(PORT, () => console.log(`DentalTrack API running on :${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message)
    process.exit(1)
  })
