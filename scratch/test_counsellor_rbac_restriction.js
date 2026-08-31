// scratch/test_counsellor_rbac_restriction.js

const { hasPermission, ROLE_PERMISSIONS } = require('../client/src/permissions.js');

console.log('--- TESTING COUNSELLOR RBAC ADMISSIONS ACCESS RESTRICTION ---');

// 1. Counsellor Admissions Permission Test
console.log('1. Checking COUNSELLOR Admissions permission:');
const counsellorAdmissionsAccess = hasPermission('COUNSELLOR', 'Admissions');
console.log(`   COUNSELLOR Admissions Access: ${counsellorAdmissionsAccess}`);

if (counsellorAdmissionsAccess === false) {
  console.log('   ✅ COUNSELLOR Admissions access restriction PASSED');
} else {
  console.error('   ❌ COUNSELLOR Admissions access restriction failed');
  process.exit(1);
}

// 2. Counsellor Permitted Modules Check (Leads, Follow-ups, Courses, Batches, Settings)
console.log('\n2. Verifying allowed COUNSELLOR permissions remain intact:');
const allowedModules = ['Leads', 'Follow-ups', 'Courses', 'Batches', 'Settings'];

allowedModules.forEach(mod => {
  const allowed = hasPermission('COUNSELLOR', mod);
  console.log(`   COUNSELLOR -> ${mod}: ${allowed ? 'Allowed ✓' : 'FAILED ❌'}`);
  if (!allowed) {
    console.error(`   ❌ Required permission for ${mod} was incorrectly removed`);
    process.exit(1);
  }
});
console.log('   ✅ COUNSELLOR allowed modules intact PASSED');

// 3. Admin & Super Admin Admissions Access Check
console.log('\n3. Verifying ADMIN & SUPER_ADMIN Admissions permissions remain unchanged:');
const adminAdmissions = hasPermission('ADMIN', 'Admissions');
const superAdminAdmissions = hasPermission('SUPER_ADMIN', 'Admissions');

console.log(`   ADMIN Admissions Access: ${adminAdmissions}`);
console.log(`   SUPER_ADMIN Admissions Access: ${superAdminAdmissions}`);

if (adminAdmissions === true && superAdminAdmissions === true) {
  console.log('   ✅ ADMIN & SUPER_ADMIN Admissions permissions PASSED');
} else {
  console.error('   ❌ Admin permissions altered unexpectedly');
  process.exit(1);
}

console.log('\n🎉 ALL COUNSELLOR RBAC RESTRICTION TESTS PASSED 100%!');

