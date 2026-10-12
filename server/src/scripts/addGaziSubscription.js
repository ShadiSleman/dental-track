// Add ₪19,900 one-time subscription for GAZI DENT
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()

async function main() {
  // Check existing subscription
  const existing = await p.subscription.findFirst({ where: { labId: 'lab_main' } })
  if (existing) {
    console.log('Existing sub:', existing)
    // Update it with the right price and plan
    const validUntil = new Date(existing.createdAt)
    validUntil.setFullYear(validUntil.getFullYear() + 3)
    const updated = await p.subscription.update({
      where: { id: existing.id },
      data: {
        plan:      'lab_lifetime_3y',
        price:     19900,
        status:    'active',
        validUntil,
      },
    })
    console.log('✅ Updated GAZI DENT subscription:', updated)
  } else {
    // Create new
    const validUntil = new Date()
    validUntil.setFullYear(validUntil.getFullYear() + 3)
    const sub = await p.subscription.create({
      data: {
        labId:     'lab_main',
        plan:      'lab_lifetime_3y',
        price:     19900,
        status:    'active',
        validUntil,
      },
    })
    console.log('✅ Created GAZI DENT subscription:', sub)
  }
}

main().catch(console.error).finally(() => p.$disconnect())
