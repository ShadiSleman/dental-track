// Notifications route — used by the frontend polling hook every 4 s
const router  = require('express').Router()
const prisma  = require('../lib/prisma')
const authJwt = require('../middleware/authJwt')
const { withId } = require('../lib/withId')

router.use(authJwt)

// GET /api/notifications — return last 30 notifications for current user
router.get('/', async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      take:    30,
    })
    res.json(withId(notifications))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, read: false },
      data:  { read: true },
    })
    res.json({ ok: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// PATCH /api/notifications/:id/read — mark one as read
router.patch('/:id/read', async (req, res) => {
  try {
    const notif = await prisma.notification.update({
      where: { id: req.params.id },
      data:  { read: true },
    })
    res.json(withId(notif))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
