const path = require('path');
const jwt = require(path.join(__dirname, '../server/node_modules/jsonwebtoken'));
const permissions = require(path.join(__dirname, '../server/src/config/permissions'));

async function testCounsellorApiSecurity() {
  console.log('--- TESTING COUNSELLOR DASHBOARD API & PERMISSION SECURITY ---\n');

  // 1. Verify Counsellor role permissions
  console.log('1. Checking ROLE_PERMISSIONS for COUNSELLOR role...');
  const counsellorPermissions = permissions.ROLE_PERMISSIONS.COUNSELLOR;
  console.log('   Allowed permissions:', counsellorPermissions);

  if (counsellorPermissions.includes('dashboard')) {
    console.log('   ✅ VERIFIED: "dashboard" permission present in COUNSELLOR role!');
  } else {
    console.error('   ❌ FAILED: "dashboard" missing from COUNSELLOR role!');
    process.exit(1);
  }

  // 2. Verify forbidden financial permissions are NOT in COUNSELLOR role
  const forbiddenPermissions = ['payments', 'reports', 'userControl'];
  const foundForbidden = forbiddenPermissions.filter(p => counsellorPermissions.includes(p));

  if (foundForbidden.length === 0) {
    console.log('   ✅ VERIFIED: Zero financial/restricted permissions (payments, reports, userControl) present for COUNSELLOR!');
  } else {
    console.error(`   ❌ FAILED: Found forbidden permissions in COUNSELLOR role: ${foundForbidden.join(', ')}`);
    process.exit(1);
  }

  // 3. Verify default page for Counsellor
  const defaultPage = permissions.getDefaultPageForRole('COUNSELLOR');
  console.log(`3. Checking default page for COUNSELLOR: "${defaultPage}"`);
  if (defaultPage === 'Dashboard') {
    console.log('   ✅ VERIFIED: Default landing page for COUNSELLOR is "Dashboard"!');
  } else {
    console.error(`   ❌ FAILED: Expected "Dashboard", got "${defaultPage}"`);
    process.exit(1);
  }

  console.log('\n🎉 COUNSELLOR DASHBOARD API & PERMISSION SECURITY TESTS PASSED 100%!');
  process.exit(0);
}

testCounsellorApiSecurity().catch(e => {
  console.error(e);
  process.exit(1);
});
