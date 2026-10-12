// ─── Team management — accessible by lab_manager & super_admin ───────────────
// lab_manager can manage: technicians (in their lab) + doctors (linked to their lab)
const router  = require('express').Router()
const bcrypt  = require('bcryptjs')
const prisma  = require('../lib/prisma')
const authJwt = require('../middleware/authJwt')
const roleGuard = require('../middleware/roleGuard')
const { withId } = require('../lib/withId')
const { linkToLab, unlinkFromLab, isMember } = require('../lib/membership')

router.use(authJwt, roleGuard('lab_manager', 'super_admin'))

// ─── GET /api/team — list technicians and doctors of this lab ─────────────────
router.get('/', async (req, res) => {
  try {
    const labId = req.user.role === 'super_admin' ? req.query.labId : req.user.labId
    if (!labId) return res.status(400).json({ error: 'labId required' })

    const [technicians, doctorLinks] = await Promise.all([
      prisma.user.findMany({
        where: { labId, role: 'technician' },
        select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
        orderBy: { name: 'asc' },
      }),
      prisma.labMember.findMany({
        where: { labId, user: { role: 'doctor' } },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true, clinicId: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
    ])
    const doctors = doctorLinks.map(l => l.user)

    res.json({ technicians: withId(technicians), doctors: withId(doctors) })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── POST /api/team — create technician or doctor ─────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { name, email, password, phone, role, clinicId } = req.body
    const labId = req.user.role === 'super_admin' ? req.body.labId : req.user.labId

    if (!name || !email)
      return res.status(400).json({ error: 'שם ואימייל הם שדות חובה' })

    if (!['technician', 'doctor'].includes(role))
      return res.status(400).json({ error: 'תפקיד חייב להיות technician או doctor' })

    const exists = await prisma.user.findUnique({ where: { email } })
    // Doctor already in the system — link this lab too, keep every other lab
    if (exists && exists.role === 'doctor' && role === 'doctor') {
      await linkToLab(exists.id, labId)
      return res.status(200).json({
        ...withId(exists),
        linkedExisting: true,
        message: 'הרופא כבר קיים במערכת וקושר גם למעבדה הזו. הוא יוכל לשלוח עבודה לכל המעבדות שקישרו אותו.',
      })
    }
    if (exists) return res.status(409).json({ error: 'כתובת האימייל כבר רשומה במערכת' })
    if (!password) return res.status(400).json({ error: 'סיסמה נדרשת למשתמש חדש' })

    const passwordHash = await bcrypt.hash(password, 10)

    let resolvedClinicId = role === 'doctor' ? (clinicId || null) : null
    if (role === 'doctor' && !resolvedClinicId) {
      const clinic = await prisma.clinic.create({ data: { name: `מרפאת ${name}` } })
      resolvedClinicId = clinic.id
    }

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone:    phone || null,
        role,
        // Doctors are linked through LabMember so a second lab can add them too
        labId:    role === 'doctor' ? null : labId,
        clinicId: resolvedClinicId,
        isActive: true,
      },
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    })

    if (role === 'doctor') await linkToLab(user.id, labId)

    res.status(201).json(withId(user))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── PATCH /api/team/:id — edit technician or doctor ─────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    const labId = req.user.role === 'super_admin' ? undefined : req.user.labId

    // Make sure the user belongs to this lab (security check)
    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'משתמש לא נמצא' })
    const member = labId ? await isMember(existing.id, labId) : true
    if (labId && existing.labId !== labId && !member)
      return res.status(403).json({ error: 'אין הרשאה לערוך משתמש זה' })
    if (!['technician', 'doctor'].includes(existing.role))
      return res.status(403).json({ error: 'ניתן לערוך רק טכנאים ורופאים' })

    const { name, email, phone, isActive, password } = req.body
    const data = {}
    if (name     !== undefined) data.name     = name
    if (phone    !== undefined) data.phone    = phone
    if (isActive !== undefined) data.isActive = isActive
    if (password)               data.passwordHash = await bcrypt.hash(password, 10)
    if (email) {
      // Check email not taken by another user
      const taken = await prisma.user.findUnique({ where: { email } })
      if (taken && taken.id !== req.params.id)
        return res.status(400).json({ error: 'אימייל זה כבר בשימוש' })
      data.email = email
    }

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true },
    })

    res.json(withId(user))
  } catch (err) { res.status(500).json({ error: err.message }) }
})

// ─── DELETE /api/team/:id — remove technician or doctor ──────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const labId = req.user.role === 'super_admin' ? undefined : req.user.labId

    const existing = await prisma.user.findUnique({ where: { id: req.params.id } })
    if (!existing) return res.status(404).json({ error: 'משתמש לא נמצא' })
    const member = labId ? await isMember(existing.id, labId) : true
    if (labId && existing.labId !== labId && !member)
      return res.status(403).json({ error: 'אין הרשאה למחוק משתמש זה' })
    if (!['technician', 'doctor'].includes(existing.role))
      return res.status(403).json({ error: 'ניתן למחוק רק טכנאים ורופאים' })

    // Doctors stay in the system — only this lab loses them
    if (existing.role === 'doctor' && labId) {
      await unlinkFromLab(existing.id, labId)
      return res.json({ success: true, unlinked: true })
    }

    await prisma.user.delete({ where: { id: req.params.id } })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ error: err.message }) }
})

module.exports = router
