// Seed using SQL so it works even if Prisma Client is locked and not regenerated yet
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const p = new PrismaClient()

async function main() {
  await p.$executeRaw`
    INSERT INTO "PriceList" (id, "lifetimePrice", "starterPrice", "standardPrice", "proPrice", "updatedAt")
    VALUES ('default', 19000, 290, 590, 990, NOW())
    ON CONFLICT (id) DO NOTHING
  `
  console.log('✅ מחירון')

  const pairs = await p.$queryRaw`SELECT DISTINCT "doctorId", "labId" FROM "WorkOrder"`
  for (const row of pairs) {
    const id = 'lm_' + row.labId + '_' + row.doctorId
    await p.$executeRaw`
      INSERT INTO "LabMember" (id, "labId", "userId", "createdAt")
      VALUES (${id.slice(0, 40)}, ${row.labId}, ${row.doctorId}, NOW())
      ON CONFLICT ("labId", "userId") DO NOTHING
    `
  }
  console.log(`✅ קישורים לפי עבודות: ${pairs.length}`)

  const hash = await bcrypt.hash('local123', 10)
  await p.$executeRaw`
    INSERT INTO "Lab" (id, name, address, phone, email, "isActive", "createdAt", "updatedAt")
    VALUES ('lab_after3', 'אורתו-דנט (אחרי 3 שנים)', 'רחוב הרצל 1, חיפה', '04-5550101', 'office@orthodent.co.il', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `
  await p.$executeRaw`
    INSERT INTO "User" (id, name, email, "passwordHash", role, "labId", "isActive", "createdAt", "updatedAt")
    VALUES ('user_after3_mgr', 'מנהל אורתו-דנט', 'after3@dentaltrack.co.il', ${hash}, 'lab_manager'::"Role", 'lab_after3', true, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
  `

  await p.$executeRaw`DELETE FROM "Subscription" WHERE "labId" = 'lab_after3'`
  await p.$executeRaw`
    INSERT INTO "Subscription" (id, "labId", plan, status, price, "validUntil", "createdAt", "updatedAt")
    VALUES (
      'sub_after3_life', 'lab_after3', 'lab_lifetime_3y', 'expired', 19900,
      NOW() - INTERVAL '12 days',
      NOW() - INTERVAL '3 years',
      NOW()
    )
  `
  await p.$executeRaw`
    INSERT INTO "Subscription" (id, "labId", plan, status, price, "validUntil", "createdAt", "updatedAt")
    VALUES (
      'sub_after3_month', 'lab_after3', 'lab_standard', 'active', 590,
      NOW() + INTERVAL '1 month',
      NOW() - INTERVAL '12 days',
      NOW()
    )
  `
  console.log('✅ אורתו-דנט: 3 שנים הסתיימו + ₪590 לחודש')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
