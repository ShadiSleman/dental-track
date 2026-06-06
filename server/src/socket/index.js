const jwt = require('jsonwebtoken')
const User = require('../models/User')

module.exports = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('No token'))
      const payload = jwt.verify(token, process.env.JWT_SECRET)
      const user = await User.findById(payload.sub).select('-passwordHash')
      if (!user || !user.isActive) return next(new Error('Unauthorized'))
      socket.user = user
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const user = socket.user

    // Join personal room
    socket.join(`user_${user._id}`)

    // Join lab/clinic room
    if (user.labId)    socket.join(`lab_${user.labId}`)
    if (user.clinicId) socket.join(`clinic_${user.clinicId}`)

    // Join work order chat rooms
    socket.on('join_order', (orderId) => {
      socket.join(`order_${orderId}`)
    })

    socket.on('leave_order', (orderId) => {
      socket.leave(`order_${orderId}`)
    })

    socket.on('disconnect', () => {})
  })
}
