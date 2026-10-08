// Prisma Client singleton — prevents connection-pool exhaustion in serverless
// Cached on globalThis for BOTH dev and production (Vercel reuses the module)
const { PrismaClient } = require('@prisma/client')

if (!globalThis.__prisma) {
  globalThis.__prisma = new PrismaClient({
    log: ['error'],
  })
}

module.exports = globalThis.__prisma
