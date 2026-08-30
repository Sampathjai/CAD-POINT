if (process.env.NODE_ENV === 'production') {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not configured. Please set DATABASE_URL in environment settings.');
  }
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not configured. Please set JWT_SECRET in environment settings.');
  }
}

module.exports = {
  port: Number(process.env.PORT || 5001),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: process.env.JWT_SECRET || 'cadpoint-secret-key-production-fallback'
};
