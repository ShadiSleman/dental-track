const router = require('express').Router()
const Message = require('../models/Message')
const authJwt = require('../middleware/authJwt')

router.use(authJwt)

router.get('/:workOrderId', async (req, res) => {
  try {
    const msgs = await Message.find({ workOrderId: req.params.workOrderId })
      .populate('sender', 'name role avatarUrl')
      .sort({ createdAt: 1 })
    res.json(msgs)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { workOrderId, text } = req.body
    const msg = await Message.create({ workOrderId, sender: req.user._id, text })
    const populated = await msg.populate('sender', 'name role avatarUrl')
    req.app.get('io')?.to(`order_${workOrderId}`).emit('new_message', populated)
    res.status(201).json(populated)
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
