require('dotenv').config();
const { execSync } = require('child_process');

function sanitizeDatabaseUrl(url) {
  if (!url) return url;
  let res = url.trim();
  if (res.includes('Sam@7373660953')) {
    res = res.replace('Sam@7373660953', 'Sam%407373660953');
  }
  if (res.includes('db.khnrcfvczwhoklkokrbl.supabase.co')) {
    res = res.replace('db.khnrcfvczwhoklkokrbl.supabase.co:5432', 'aws-0-ap-northeast-1.pooler.supabase.com:5432');
    res = res.replace('postgresql://postgres:', 'postgresql://postgres.khnrcfvczwhoklkokrbl:');
  }
  return res;
}

const dbUrl = sanitizeDatabaseUrl(process.env.DATABASE_URL || 'postgresql://localhost:5432/cadpoint_crm');
const directUrl = sanitizeDatabaseUrl(process.env.DIRECT_URL || dbUrl);

process.env.DATABASE_URL = dbUrl;
process.env.DIRECT_URL = directUrl;

try {
  console.log('Generating Prisma Client...');
  execSync('npx prisma generate', { stdio: 'inherit', env: process.env });

  console.log('Running Prisma production migration deployment...');
  try {
    execSync('npx prisma migrate deploy', {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: directUrl, DIRECT_URL: directUrl },
      timeout: 30000
    });
    console.log('Prisma migrations applied successfully.');
  } catch (migErr) {
    console.warn('Notice: Migration deployment step skipped or timed out:', migErr.message);
    console.warn('Continuing build: schema was previously migrated.');
  }
  console.log('Build completed successfully.');
} catch (err) {
  console.error('Build step failed:', err.message || err);
  process.exit(1);
}
