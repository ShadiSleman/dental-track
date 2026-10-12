require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const [users, labs, clinics] = await Promise.all([
    p.user.findMany({
      select: { name: true, email: true, role: true, labId: true, clinicId: true, isActive: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }]
    }),
    p.lab.findMany({ select: { id: true, name: true } }),
    p.clinic.findMany({ select: { id: true, name: true } }),
  ])
  const labMap = Object.fromEntries(labs.map(l => [l.id, l.name]))
  const clinicMap = Object.fromEntries(clinics.map(c => [c.id, c.name]))
  users.forEach(u => {
    console.log(`${u.role.padEnd(12)} | ${u.name.padEnd(22)} | ${u.email.padEnd(35)} | lab: ${u.labId ? labMap[u.labId] || u.labId : '-'} | clinic: ${u.clinicId ? clinicMap[u.clinicId] || u.clinicId : '-'} | active: ${u.isActive}`)
  })
}
main().catch(console.error).finally(() => p.$disconnect())
