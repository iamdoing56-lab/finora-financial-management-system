const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client Singleton
 *
 * We create a single PrismaClient instance and reuse it across the entire
 * application. Creating multiple instances wastes database connections.
 * This pattern is the standard Prisma recommendation for Node.js apps.
 */
const prisma = new PrismaClient({
  // Uncomment the line below to see all SQL queries in the console during development
  // log: ['query'],
});

module.exports = prisma;
