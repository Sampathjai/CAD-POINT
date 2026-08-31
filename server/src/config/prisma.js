const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient instance to prevent connection pool leaks across serverless lambdas & dev reloads
if (!global.__prisma) {
  global.__prisma = new PrismaClient({
    log: ['error', 'warn']
  });
}

const prisma = global.__prisma;

module.exports = prisma;

