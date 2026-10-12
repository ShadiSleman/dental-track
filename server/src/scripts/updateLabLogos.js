require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  await p.lab.update({ where: { id: 'lab_main' },       data: { logoUrl: '/logo.png' } })
  await p.lab.update({ where: { id: 'lab_smile_pro' },  data: { logoUrl: '/logo-smile-pro.svg' } })
  await p.lab.update({ where: { id: 'lab_pearl_tech' }, data: { logoUrl: '/logo-pearl-tech.svg' } })
  const labs = await p.lab.findMany({ select: { id: true, name: true, logoUrl: true } })
  labs.forEach(l => console.log(`  ✅ ${l.name}: ${l.logoUrl}`))
}
main().catch(console.error).finally(() => p.$disconnect())
