// Ensure every lab has a ₪19,900 one-time 3-year subscription
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  const labs = await p.lab.findMany({ select: { id: true, name: true } })
  console.log(`Found ${labs.length} labs\n`)

  for (const lab of labs) {
    const existing = await p.subscription.findFirst({ where: { labId: lab.id } })

    if (existing) {
      // Update to correct plan/price if needed
      if (existing.plan !== 'lab_lifetime_3y' || existing.price !== 19900) {
        const validUntil = new Date(existing.createdAt)
        validUntil.setFullYear(validUntil.getFullYear() + 3)
        await p.subscription.update({
          where: { id: existing.id },
          data: { plan: 'lab_lifetime_3y', price: 19900, status: 'active', validUntil },
        })
        console.log(`✏️  Updated: ${lab.name} → ₪19,900 / 3 שנים (${validUntil.toLocaleDateString('he-IL')})`)
      } else {
        console.log(`✅ OK: ${lab.name} — כבר מוגדר נכון`)
      }
    } else {
      // Create new subscription — started today, valid 3 years
      const now = new Date()
      const validUntil = new Date(now)
      validUntil.setFullYear(validUntil.getFullYear() + 3)
      await p.subscription.create({
        data: { labId: lab.id, plan: 'lab_lifetime_3y', price: 19900, status: 'active', validUntil },
      })
      console.log(`➕ Created: ${lab.name} → ₪19,900 / 3 שנים (עד ${validUntil.toLocaleDateString('he-IL')})`)
    }
  }

  console.log('\n🎉 כל המעבדות מוגדרות עם חבילת ₪19,900 ל-3 שנים')
  console.log('   לאחר פקיעה — הרחבה לאחת מ-3 חבילות חודשיות:')
  console.log('   • Starter  ₪290/חודש  (עד 3 רופאים)')
  console.log('   • Standard ₪590/חודש  (עד 10 רופאים)')
  console.log('   • Pro      ₪990/חודש  (ללא הגבלה)')
}

main().catch(console.error).finally(() => p.$disconnect())
