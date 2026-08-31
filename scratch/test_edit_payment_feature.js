// scratch/test_edit_payment_feature.js

console.log('--- TESTING EDIT PAYMENT FEATURE ---');

const sampleAdmission = {
  id: 'adm-101',
  admissionNumber: 'ADM-1001',
  finalFee: 50000,
  payments: [
    { id: 'pay-1', amount: 20000, paymentMethod: 'UPI', receiptNumber: 'REC-501' },
    { id: 'pay-2', amount: 10000, paymentMethod: 'CASH', receiptNumber: 'REC-502' }
  ]
};

function validateEditPayment(paymentId, updateData, admission) {
  const otherPaymentsTotal = admission.payments
    .filter(p => p.id !== paymentId)
    .reduce((sum, p) => sum + p.amount, 0);

  const remainingFee = Math.max(0, admission.finalFee - otherPaymentsTotal);

  if (updateData.amount > remainingFee) {
    return { success: false, message: `Updated amount (₹${updateData.amount}) exceeds max allowed fee (₹${remainingFee})` };
  }

  return { success: true, remainingFee };
}

// 1. Valid Edit Payment Test
console.log('1. Validating normal payment edit (Update REC-501 from 20,000 to 25,000):');
const res1 = validateEditPayment('pay-1', { amount: 25000, paymentMethod: 'CARD' }, sampleAdmission);
console.log('   Result:', res1);
if (res1.success) {
  console.log('   ✅ Valid edit payment test PASSED');
} else {
  console.error('   ❌ Valid edit payment failed');
  process.exit(1);
}

// 2. Overpayment Attempt Test
console.log('\n2. Validating overpayment edit (Attempt to update REC-501 from 20,000 to 45,000 when REC-502 is 10,000 & Total Fee is 50,000):');
const res2 = validateEditPayment('pay-1', { amount: 45000, paymentMethod: 'CARD' }, sampleAdmission);
console.log('   Result:', res2);
if (!res2.success && res2.message.includes('exceeds max allowed fee')) {
  console.log('   ✅ Overpayment validation PASSED');
} else {
  console.error('   ❌ Overpayment check failed');
  process.exit(1);
}

console.log('\n🎉 ALL EDIT PAYMENT FEATURE TESTS PASSED 100%!');
