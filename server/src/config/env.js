const JWT_SECRET = process.env.JWT_SECRET || 'cadpoint-secret-key-production-fallback';

if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
  console.warn('Warning: DATABASE_URL environment variable is not set on production.');
}

module.exports = {
  port: Number(process.env.PORT || 5001),
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  jwtSecret: JWT_SECRET
};
