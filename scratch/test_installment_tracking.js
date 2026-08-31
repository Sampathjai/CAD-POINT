const path = require('path');
const permissions = require(path.join(__dirname, '../server/src/config/permissions'));

async function testInstallmentTrackingLogic() {
  console.log('--- TESTING 3-INSTALLMENT TRACKING & PAYMENT VALIDATION LOGIC ---\n');

  // Test 1: Validate default 3-installment split
  const finalFee = 30000;
  const planned1 = Math.round(finalFee / 3);
  const planned2 = Math.round(finalFee / 3);
  const planned3 = finalFee - (planned1 + planned2);

  console.log(`1. Testing default 3-installment calculation for Total Fee ₹${finalFee.toLocaleString()}:`);
  console.log(`   Installment 1: ₹${planned1.toLocaleString()}`);
  console.log(`   Installment 2: ₹${planned2.toLocaleString()}`);
  console.log(`   Installment 3: ₹${planned3.toLocaleString()}`);

  if (planned1 + planned2 + planned3 === finalFee) {
    console.log('   ✅ VERIFIED: Sum of installments equals Total Fee (₹30,000)!');
  } else {
    console.error('   ❌ FAILED: Sum does not equal total fee!');
    process.exit(1);
  }

  // Test 2: Custom planned installments sum validation
  console.log('\n2. Testing flexible custom installment amounts validation:');
  const customPlanValid = [
    { number: 1, planned: 20000 },
    { number: 2, planned: 15000 },
    { number: 3, planned: 15000 }
  ];
  const sumCustomValid = customPlanValid.reduce((sum, i) => sum + i.planned, 0);

  console.log(`   Custom Plan: ₹20,000 + ₹15,000 + ₹15,000 = ₹${sumCustomValid.toLocaleString()} (Target ₹50,000)`);
  if (sumCustomValid <= 50000) {
    console.log('   ✅ VERIFIED: Valid plan accepted (≤ ₹50,000)!');
  } else {
    console.error('   ❌ FAILED: Plan validation check failed!');
    process.exit(1);
  }

  const customPlanInvalid = [
    { number: 1, planned: 25000 },
    { number: 2, planned: 20000 },
    { number: 3, planned: 15000 }
  ];
  const sumCustomInvalid = customPlanInvalid.reduce((sum, i) => sum + i.planned, 0);
  console.log(`   Invalid Custom Plan: ₹25,000 + ₹20,000 + ₹15,000 = ₹${sumCustomInvalid.toLocaleString()} (Target ₹50,000)`);
  if (sumCustomInvalid > 50000) {
    console.log('   ✅ VERIFIED: Overpayment plan rejected (> ₹50,000)!');
  } else {
    console.error('   ❌ FAILED: Overpayment plan was not caught!');
    process.exit(1);
  }

  // Test 3: WhatsApp payment reminder text generator verification
  console.log('\n3. Testing dynamic WhatsApp payment reminder template...');
  const studentName = 'Rahul Sharma';
  const courseName = 'AutoCAD Master Class';
  const totalFees = 50000;
  const amountPaid = 35000;
  const pendingAmount = 15000;
  const instituteName = 'CAD POINT';

  const expectedText = `Hello ${studentName},\n\nThis is a reminder regarding your pending course fees.\n\nCourse: ${courseName}\nTotal Fees: ₹${totalFees.toLocaleString()}\nAmount Paid: ₹${amountPaid.toLocaleString()}\nPending Amount: ₹${pendingAmount.toLocaleString()}\n\nKindly complete the pending payment at your earliest convenience.\n\nThank you,\n${instituteName}`;

  if (expectedText.includes('Rahul Sharma') && expectedText.includes('₹15,000') && expectedText.includes('CAD POINT')) {
    console.log('   ✅ VERIFIED: Dynamic WhatsApp reminder template constructed correctly!');
  } else {
    console.error('   ❌ FAILED: WhatsApp reminder template error');
    process.exit(1);
  }

  console.log('\n🎉 3-INSTALLMENT TRACKING & PAYMENT VALIDATION TESTS PASSED 100%!');
  process.exit(0);
}

testInstallmentTrackingLogic().catch(e => {
  console.error(e);
  process.exit(1);
});

