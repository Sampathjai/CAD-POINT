// scratch/test_counsellor_students_access.js

const { hasPermission } = require('../client/src/permissions.js');

console.log('--- TESTING COUNSELLOR STUDENTS TAB ACCESS ---');

// 1. Counsellor Students Access
const studentsAccess = hasPermission('COUNSELLOR', 'Students');
console.log(`1. COUNSELLOR Students Access: ${studentsAccess ? 'Allowed ✓' : 'FAILED ❌'}`);

if (studentsAccess !== true) {
  console.error('❌ COUNSELLOR Students access check failed');
  process.exit(1);
}

// 2. Counsellor Admissions Access (Must remain restricted)
const admissionsAccess = hasPermission('COUNSELLOR', 'Admissions');
console.log(`2. COUNSELLOR Admissions Access: ${admissionsAccess ? 'Allowed (Unexpected) ❌' : 'Restricted ✓'}`);

if (admissionsAccess !== false) {
  console.error('❌ COUNSELLOR Admissions access should be restricted');
  process.exit(1);
}

// 3. Full Counsellor Allowed Modules List
const allowedModules = ['Dashboard', 'Leads', 'Follow-ups', 'Courses', 'Batches', 'Students', 'Settings'];
console.log('\n3. Verifying complete Counsellor navigation permissions:');
allowedModules.forEach(mod => {
  const ok = hasPermission('COUNSELLOR', mod);
  console.log(`   COUNSELLOR -> ${mod}: ${ok ? 'Allowed ✓' : 'FAILED ❌'}`);
  if (!ok) {
    console.error(`❌ Missing permission for ${mod}`);
    process.exit(1);
  }
});

console.log('\n🎉 ALL COUNSELLOR STUDENTS ACCESS TESTS PASSED 100%!');

