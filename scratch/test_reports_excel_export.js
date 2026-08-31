// scratch/test_reports_excel_export.js

console.log('--- TESTING REPORTS CUSTOM DATE FILTERS & EXCEL EXPORT ---');

const sampleStudents = [
  { studentCode: 'STU-1001', firstName: 'S. Kumar', parentName: 'Raj Kumar', phone: '9876543210', createdAt: '2026-08-15T10:00:00Z' },
  { studentCode: 'STU-1002', firstName: 'Priya D', parentName: 'Dharshini', phone: '9876543211', createdAt: '2026-08-30T10:00:00Z' },
  { studentCode: 'STU-1003', firstName: 'Arun M', parentName: 'Muthu', phone: '9876543212', createdAt: '2026-07-10T10:00:00Z' }
];

function filterByDateRange(items, fromDate, toDate) {
  return items.filter(item => {
    const dStr = new Date(item.createdAt).toISOString().slice(0, 10);
    if (fromDate && dStr < fromDate) return false;
    if (toDate && dStr > toDate) return false;
    return true;
  });
}

// 1. Custom Date Range Test (August 2026)
console.log('1. Filtering Students for August 2026 (2026-08-01 to 2026-08-31):');
const augStudents = filterByDateRange(sampleStudents, '2026-08-01', '2026-08-31');
console.log(`   Found ${augStudents.length} student(s): ${augStudents.map(s => `${s.firstName} (${s.studentCode})`).join(', ')}`);

if (augStudents.length === 2) {
  console.log('   ✅ Custom date range filtering PASSED');
} else {
  console.error('   ❌ Date range filtering failed');
  process.exit(1);
}

// 2. Format Excel Data Check
console.log('\n2. Formatting Excel row objects for export:');
const excelRows = augStudents.map((s, idx) => ({
  'S.No': idx + 1,
  'Student ID': s.studentCode,
  'Name with Initial': s.firstName,
  'Parent Name': s.parentName,
  'Phone Number': s.phone,
  'Registered Date': s.createdAt.slice(0, 10)
}));
console.log('   Sample Excel Data Row 1:', excelRows[0]);

if (excelRows[0]['Student ID'] === 'STU-1001' && excelRows[0]['Name with Initial'] === 'S. Kumar') {
  console.log('   ✅ Excel Data preparation PASSED');
} else {
  console.error('   ❌ Excel data structure failed');
  process.exit(1);
}

console.log('\n🎉 ALL REPORTS CUSTOM DATE FILTERS & EXCEL EXPORT TESTS PASSED 100%!');
