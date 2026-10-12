// Backfill doctor↔lab links, price catalog, and one lab that finished 3 years
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const p = new PrismaClient()

async function main() {
  await p.priceList.upsert({
    where:  { id: 'default' },
    update: {},
    create: { id: 'default', lifetimePrice: 19000, starterPrice: 290, standardPrice: 590, proPrice: 990 },
  })
  console.log('✅ מחירון: 19000 / 290 / 590 / 990')

  const pairs = await p.workOrder.findMany({
    distinct: ['doctorId', 'labId'],
    select: { doctorId: true, labId: true },
  })
  let linked = 0
  for (const row of pairs) {
    await p.labMember.upsert({
      where:  { labId_userId: { labId: row.labId, userId: row.doctorId } },
      update: {},
      create: { labId: row.labId, userId: row.doctorId },
    })
    linked++
  }
  console.log(`✅ קושרו ${linked} זוגות רופא–מעבדה לפי עבודות קיימות`)

  // Demo lab whose 3-year payment already ended and now pays monthly
  const hash = await bcrypt.hash('local123', 10)
  const lab = await p.lab.upsert({
    where:  { id: 'lab_after3' },
    update: {},
    create: {
      id: 'lab_after3',
      name: 'אורתו-דנט (אחרי 3 שנים)',
      address: 'רחוב הרצל 1, חיפה',
      phone: '04-5550101',
      email: 'office@orthodent.co.il',
    },
  })
  await p.user.upsert({
    where:  { id: 'user_after3_mgr' },
    update: {},
    create: {
      id: 'user_after3_mgr',
      name: 'מנהל אורתו-דנט',
      email: 'after3@dentaltrack.co.il',
      passwordHash: hash,
      role: 'lab_manager',
      labId: lab.id,
    },
  })

  const ended = new Date()
  ended.setDate(ended.getDate() - 12)
  const started = new Date(ended)
  started.setFullYear(started.getFullYear() - 3)

  await p.subscription.deleteMany({ where: { labId: lab.id } })
  await p.subscription.create({
    data: {
      labId: lab.id,
      plan: 'lab_lifetime_3y',
      status: 'expired',
      price: 19900,
      validUntil: ended,
      createdAt: started,
    },
  })
  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  await p.subscription.create({
    data: {
      labId: lab.id,
      plan: 'lab_standard',
      status: 'active',
      price: 590,
      validUntil: nextMonth,
      createdAt: ended,
    },
  })
  console.log('✅ אורתו-דנט: ₪19,900 הסתיים + חבילה חודשית Standard ₪590 (עד 10 רופאים)')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
