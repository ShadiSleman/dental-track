const router = require('express').Router()
const prisma = require('../lib/prisma')
const authJwt = require('../middleware/authJwt')
const { withId } = require('../lib/withId')
const { labsForUser } = require('../lib/membership')

router.use(authJwt)

// ─── GET /api/labs — list all active labs ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Doctors only see labs that added them. Other roles see every active lab.
    if (req.user.role === 'doctor') {
      const labs = await labsForUser(req.user.id)
      return res.json(labs.map(l => ({ ...l, _id: l.id })))
    }
    const labs = await prisma.lab.findMany({
      where: { isActive: true },
      select: { id: true, name: true, logoUrl: true, address: true, phone: true, email: true },
      orderBy: { name: 'asc' },
    })
    res.json(labs.map(l => ({ ...l, _id: l.id })))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── GET /api/labs/mine — returns current user's lab ──────────────────────────
router.get('/mine', async (req, res) => {
  try {
    const labId = req.user.labId
    if (!labId) return res.status(400).json({ error: 'No lab associated' })
    const lab = await prisma.lab.findUnique({
      where: { id: labId },
      select: { id: true, name: true, logoUrl: true, address: true, phone: true, email: true },
    })
    if (!lab) return res.status(404).json({ error: 'Lab not found' })
    res.json({ ...lab, _id: lab.id })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
