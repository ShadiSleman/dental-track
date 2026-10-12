require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const labs = await p.lab.findMany({ select: { id: true, name: true } })
  const clinics = await p.clinic.findMany({ select: { id: true, name: true } })
  const doctors = await p.user.findMany({ where: { role: 'doctor' }, select: { id: true, name: true, email: true, labId: true } })
  const techs = await p.user.findMany({ where: { role: { in: ['technician','lab_manager'] } }, select: { id: true, name: true, role: true, labId: true } })
  console.log('LABS:', JSON.stringify(labs, null, 2))
  console.log('CLINICS:', JSON.stringify(clinics, null, 2))
  console.log('DOCTORS:', JSON.stringify(doctors, null, 2))
  console.log('TECHS:', JSON.stringify(techs, null, 2))
}
main().catch(console.error).finally(() => p.$disconnect())
