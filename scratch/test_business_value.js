// scratch/test_business_value.js

console.log('--- TESTING BUSINESS VALUE METRIC CALCULATION ---');

const sampleAdmissions = [
  { id: 'ADM-001', finalFee: 30000, admissionDate: '2026-08-15T10:00:00Z', createdAt: '2026-08-15T10:00:00Z' }
];

const samplePayments = [
  { id: 'PAY-1', admissionId: 'ADM-001', amount: 10000, paymentDate: '2026-08-20T10:00:00Z', status: 'SUCCESS' },
  { id: 'PAY-2', admissionId: 'ADM-001', amount: 10000, paymentDate: '2026-09-10T10:00:00Z', status: 'SUCCESS' },
  { id: 'PAY-3', admissionId: 'ADM-001', amount: 10000, paymentDate: '2026-10-05T10:00:00Z', status: 'SUCCESS' }
];

function getYM(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function calculateDashboardMetrics(selectedMonth) {
  const filteredAdmissions = sampleAdmissions.filter(a => selectedMonth === 'ALL' || getYM(a.admissionDate || a.createdAt) === selectedMonth);
  const filteredPayments = samplePayments.filter(p => (selectedMonth === 'ALL' || getYM(p.paymentDate || p.createdAt) === selectedMonth) && p.status === 'SUCCESS');

  const monthlyRevenue = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const businessValue = filteredAdmissions.reduce((sum, a) => sum + (Number(a.finalFee) || 0), 0);

  return { monthlyRevenue, businessValue };
}

// August (2026-08)
const aug = calculateDashboardMetrics('2026-08');
console.log('August Dashboard:');
console.log(`  Monthly Revenue: ₹${aug.monthlyRevenue.toLocaleString()}`);
console.log(`  Business Value:  ₹${aug.businessValue.toLocaleString()}`);
if (aug.monthlyRevenue === 10000 && aug.businessValue === 30000) {
  console.log('  ✅ August Dashboard metrics MATCH expected values (Revenue ₹10,000, Business Value ₹30,000)');
} else {
  console.error('  ❌ August metrics failed');
  process.exit(1);
}

// September (2026-09)
const sep = calculateDashboardMetrics('2026-09');
console.log('\nSeptember Dashboard:');
console.log(`  Monthly Revenue: ₹${sep.monthlyRevenue.toLocaleString()}`);
console.log(`  Business Value:  ₹${sep.businessValue.toLocaleString()}`);
if (sep.monthlyRevenue === 10000 && sep.businessValue === 0) {
  console.log('  ✅ September Dashboard metrics MATCH expected values (Revenue ₹10,000, Business Value ₹0)');
} else {
  console.error('  ❌ September metrics failed');
  process.exit(1);
}

// October (2026-10)
const oct = calculateDashboardMetrics('2026-10');
console.log('\nOctober Dashboard:');
console.log(`  Monthly Revenue: ₹${oct.monthlyRevenue.toLocaleString()}`);
console.log(`  Business Value:  ₹${oct.businessValue.toLocaleString()}`);
if (oct.monthlyRevenue === 10000 && oct.businessValue === 0) {
  console.log('  ✅ October Dashboard metrics MATCH expected values (Revenue ₹10,000, Business Value ₹0)');
} else {
  console.error('  ❌ October metrics failed');
  process.exit(1);
}

console.log('\n🎉 ALL BUSINESS VALUE METRIC ACCEPTANCE SCENARIOS PASSED 100%!');
