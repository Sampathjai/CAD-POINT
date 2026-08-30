require('dotenv').config();
const { execSync } = require('child_process');

const dbUrl = process.env.DATABASE_URL || 'postgresql://localhost:5432/cadpoint_crm';
const directUrl = process.env.DIRECT_URL || dbUrl;

process.env.DATABASE_URL = dbUrl;
process.env.DIRECT_URL = directUrl;

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

  console.log('Running Prisma production migration deployment...');
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: { ...process.env, DATABASE_URL: directUrl, DIRECT_URL: directUrl }
  });
  console.log('Build completed successfully.');
} catch (err) {
  console.error('Build step failed:', err.message || err);
  process.exit(1);
}
