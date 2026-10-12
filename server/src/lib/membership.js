const prisma = require('./prisma')

/** Link a user to a lab without removing their other labs. */
async function linkToLab(userId, labId) {
  return prisma.labMember.upsert({
    where:  { labId_userId: { labId, userId } },
    update: {},
    create: { labId, userId },
  })
}

async function unlinkFromLab(userId, labId) {
  await prisma.labMember.deleteMany({ where: { userId, labId } })
}

async function labsForUser(userId) {
  const rows = await prisma.labMember.findMany({
    where:   { userId },
    include: { lab: { select: { id: true, name: true, logoUrl: true, address: true, phone: true, email: true, isActive: true } } },
  })
  return rows.map(r => r.lab).filter(l => l && l.isActive)
}

async function isMember(userId, labId) {
  const row = await prisma.labMember.findUnique({ where: { labId_userId: { labId, userId } } })
  return !!row
}

/** Staff with labId plus doctors linked via LabMember. */
async function teamForLab(labId) {
  const [staff, links] = await Promise.all([
    prisma.user.findMany({
      where:   { labId, role: { in: ['lab_manager', 'technician', 'courier'] } },
      select:  { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.labMember.findMany({
      where:   { labId, user: { role: 'doctor' } },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, phone: true, isActive: true, createdAt: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])
  const doctors = links.map(l => l.user)
  return [...staff, ...doctors]
}

async function getPriceList() {
  const existing = await prisma.priceList.findUnique({ where: { id: 'default' } })
  if (existing) return existing
  return prisma.priceList.create({ data: { id: 'default' } })
}

function priceForPlan(list, plan) {
  const map = {
    lab_lifetime_3y: list.lifetimePrice,
    lab_starter:     list.starterPrice,
    lab_standard:    list.standardPrice,
    lab_pro:         list.proPrice,
  }
  return map[plan] ?? 0
}

module.exports = { linkToLab, unlinkFromLab, labsForUser, isMember, teamForLab, getPriceList, priceForPlan }
