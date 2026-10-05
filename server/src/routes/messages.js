const router  = require('express').Router()
const prisma  = require('../lib/prisma')
const authJwt = require('../middleware/authJwt')
const { withId } = require('../lib/withId')

router.use(authJwt)

// GET /api/messages/:workOrderId
router.get('/:workOrderId', async (req, res) => {
  try {
    const msgs = await prisma.message.findMany({
      where:   { workOrderId: req.params.workOrderId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: { id: true, name: true, role: true, avatarUrl: true },
        },
      },
    })
    res.json(withId(msgs))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// POST /api/messages
router.post('/', async (req, res) => {
  try {
    const { workOrderId, text } = req.body
    const msg = await prisma.message.create({
      data: { workOrderId, senderId: req.user.id, text },
      include: {
        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    })

    // Create notification for the doctor (polling will deliver it)
    const order = await prisma.workOrder.findUnique({
      where: { id: workOrderId },
      select: { doctorId: true, orderNumber: true },
    })
    if (order && order.doctorId !== req.user.id) {
      await prisma.notification.create({
        data: {
          userId:      order.doctorId,
          workOrderId,
          type:        'message',
          title:       'הודעה חדשה',
          body:        `${req.user.name}: ${text.slice(0, 60)}`,
        },
      }).catch(() => {})
    }

    res.status(201).json(withId(msg))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
