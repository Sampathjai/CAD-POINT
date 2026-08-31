const path = require('path');
const { hasPermission, getDefaultPageForRole, ROLE_PERMISSIONS } = require(path.join(__dirname, '../server/src/config/permissions'));

async function runRbacTests() {
  console.log('--- TESTING ROLE-BASED ACCESS CONTROL (RBAC) PERMISSION MATRIX ---\n');

  const matrix = [
    // [Module, Super Admin, Admin, Counsellor, Trainer, Accountant, Receptionist]
    ['Dashboard',          true,  true,  false, false, true,  false],
    ['Leads',              true,  true,  true,  false, false, true],
    ['Follow-ups',         true,  true,  true,  false, false, true],
    ['Courses',            true,  true,  true,  true,  false, false],
    ['Batches',            true,  true,  true,  true,  false, true],
    ['Student Admissions', true,  true,  true,  false, false, false],
    ['Payments',           true,  true,  false, false, true,  false],
    ['Reports',            true,  true,  false, false, true,  false],
    ['User Control',       true,  false, false, false, false, false],
    ['settings.profile',   true,  true,  true,  true,  true,  true],
    ['settings.appearance',true,  true,  true,  true,  true,  true]
  ];

  const roles = ['SUPER_ADMIN', 'ADMIN', 'COUNSELLOR', 'TRAINER', 'ACCOUNTANT', 'RECEPTIONIST'];
  let passed = true;

  for (const row of matrix) {
    const moduleName = row[0];
    console.log(`Testing Module: "${moduleName}"...`);

    for (let i = 0; i < roles.length; i++) {
      const role = roles[i];
      const expected = row[i + 1];
      const actual = hasPermission(role, moduleName);

      if (actual !== expected) {
        console.error(`❌ FAILED: Role ${role} on ${moduleName}. Expected: ${expected}, Got: ${actual}`);
        passed = false;
      }
    }
  }

  // Test Default Landing Pages
  console.log('\nTesting Default Landing Pages per Role:');
  const expectedDefaultPages = {
    SUPER_ADMIN: 'Dashboard',
    ADMIN: 'Dashboard',
    COUNSELLOR: 'Leads',
    TRAINER: 'Courses',
    ACCOUNTANT: 'Dashboard',
    ACCOUNTS: 'Dashboard',
    RECEPTIONIST: 'Leads'
  };

  for (const [r, p] of Object.entries(expectedDefaultPages)) {
    const actualP = getDefaultPageForRole(r);
    if (actualP !== p) {
      console.error(`❌ FAILED: Default page for ${r}. Expected: ${p}, Got: ${actualP}`);
      passed = false;
    } else {
      console.log(`  ✅ ${r} -> ${actualP}`);
    }
  }

  if (passed) {
    console.log('\n🎉 ALL RBAC PERMISSION MATRIX TESTS PASSED 100% SUCCESSFULLY!');
    process.exit(0);
  } else {
    console.error('\n❌ SOME RBAC TESTS FAILED!');
    process.exit(1);
  }
}

runRbacTests().catch(e => {
  console.error(e);
  process.exit(1);
});

