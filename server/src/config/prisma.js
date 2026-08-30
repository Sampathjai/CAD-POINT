const { PrismaClient } = require('@prisma/client');

// Singleton PrismaClient instance to prevent multiple connection pools
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error']
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['error', 'warn']
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;

