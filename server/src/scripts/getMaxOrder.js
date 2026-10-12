require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') })
const { PrismaClient } = require('@prisma/client')
const p = new PrismaClient()
async function main() {
  const last = await p.workOrder.findFirst({ orderBy: { orderNumber: 'desc' }, select: { orderNumber: true } })
  console.log('Last order:', last)
  const count = await p.workOrder.count()
  console.log('Total orders:', count)
}
main().catch(console.error).finally(() => p.$disconnect())
