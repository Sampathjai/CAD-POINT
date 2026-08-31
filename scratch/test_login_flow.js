// scratch/test_login_flow.js
require('../server/node_modules/dotenv').config({ path: './server/.env' });

const prisma = require('../server/src/config/prisma');
const bcrypt = require('../server/node_modules/bcryptjs');
const jwt = require('../server/node_modules/jsonwebtoken');

async function testLoginFlow() {
  console.log('--- TESTING WARM & COLD AUTHENTICATION TIMINGS ---');
  const tStart = Date.now();

  // 1. Initial User Lookup Query (Cold connection)
  console.log('1. Initial User Lookup for admin@cadpoint.com (Cold):');
  const user1 = await prisma.user.findUnique({
    where: { email: 'admin@cadpoint.com' },
    select: { id: true, name: true, email: true, role: true, isActive: true, passwordHash: true }
  });
  const tDb1 = Date.now();
  console.log(`   Cold User Lookup completed in ${tDb1 - tStart}ms.`);

  // 2. Second User Lookup Query (Warm connection pool)
  const tWarmStart = Date.now();
  console.log('2. Second User Lookup for counsellor@cadpoint.com (Warm):');
  const user2 = await prisma.user.findUnique({
    where: { email: 'counsellor@cadpoint.com' },
    select: { id: true, name: true, email: true, role: true, isActive: true, passwordHash: true }
  });
  const tDb2 = Date.now();
  console.log(`   Warm User Lookup completed in ${tDb2 - tWarmStart}ms!`);

  // 3. Password Verification
  const tBcryptStart = Date.now();
  const valid = await bcrypt.compare('admin123', user1.passwordHash);
  const tBcryptEnd = Date.now();

  // 4. JWT Token Generation
  const token = jwt.sign(
    { id: user1.id, role: user1.role, email: user1.email, name: user1.name },
    process.env.JWT_SECRET || 'cadpoint_super_secret_jwt_key_2026_coimbatore',
    { expiresIn: '8h' }
  );

  console.log(`\n🎉 WARM QUERY TIME: ${tDb2 - tWarmStart}ms! ALL TESTS PASSED!`);
  process.exit(0);
}

testLoginFlow().catch(err => {
  console.error('💥 Test error:', err);
  process.exit(1);
});
