// Prisma Client singleton — prevents connection-pool exhaustion in serverless
// Cached on globalThis for BOTH dev and production (Vercel reuses the module)
const { PrismaClient } = require('@prisma/client')

if (!globalThis.__prisma) {
  globalThis.__prisma = new PrismaClient({
    log: ['error'],
    // Connection pool tuned for serverless — connect eagerly to reduce cold-start
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
  // Warm up the connection pool immediately on first load
  globalThis.__prisma.$connect().catch(() => {})
}

module.exports = globalThis.__prisma
