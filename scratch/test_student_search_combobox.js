// scratch/test_student_search_combobox.js

console.log('--- TESTING SEARCHABLE STUDENT COMBOBOX ---');

const sampleStudents = [
  { id: 'S1', studentCode: 'STU-1001', firstName: 'Rahul', lastName: 'Kumar', phone: '9876543210', email: 'rahul@gmail.com' },
  { id: 'S2', studentCode: 'S009214', firstName: 'Test', lastName: 'Student', phone: '999009214', email: 'test@gmail.com' },
  { id: 'S3', studentCode: 'S009215', firstName: 'Priya', lastName: 'Dharshini', phone: '9876543211', email: 'priya@gmail.com' }
];

function filterStudents(students, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return students;
  return students.filter(s =>
    (s.studentCode || '').toLowerCase().includes(q) ||
    (s.firstName || '').toLowerCase().includes(q) ||
    (s.lastName || '').toLowerCase().includes(q) ||
    (s.phone || '').toLowerCase().includes(q) ||
    (s.email || '').toLowerCase().includes(q)
  );
}

// 1. Test Search by Student ID
console.log('1. Search by Student ID (e.g. "S009214" & "s009214"):');
const res1 = filterStudents(sampleStudents, 's009214');
console.log(`   Found ${res1.length} student(s): ${res1.map(s => `${s.firstName} (${s.studentCode})`).join(', ')}`);
if (res1.length === 1 && res1[0].studentCode === 'S009214') {
  console.log('   ✅ Case-insensitive Student ID search PASSED');
} else {
  console.error('   ❌ Student ID search FAILED');
  process.exit(1);
}

// 2. Test Search by Partial Student ID Prefix
console.log('\n2. Search by Partial Student ID Prefix ("S009"):');
const res2 = filterStudents(sampleStudents, 'S009');
console.log(`   Found ${res2.length} student(s): ${res2.map(s => `${s.firstName} (${s.studentCode})`).join(', ')}`);
if (res2.length === 2) {
  console.log('   ✅ Partial Student ID prefix search PASSED');
} else {
  console.error('   ❌ Partial Student ID search FAILED');
  process.exit(1);
}

// 3. Test Search by Student Name
console.log('\n3. Search by Student Name ("Rahul" & "Kumar"):');
const res3 = filterStudents(sampleStudents, 'Kumar');
console.log(`   Found ${res3.length} student(s): ${res3.map(s => `${s.firstName} ${s.lastName}`).join(', ')}`);
if (res3.length === 1 && res3[0].firstName === 'Rahul') {
  console.log('   ✅ Student Name search PASSED');
} else {
  console.error('   ❌ Student Name search FAILED');
  process.exit(1);
}

// 4. Test Search by Phone Number
console.log('\n4. Search by Partial Phone Number ("98765"):');
const res4 = filterStudents(sampleStudents, '98765');
console.log(`   Found ${res4.length} student(s): ${res4.map(s => `${s.firstName} (${s.phone})`).join(', ')}`);
if (res4.length === 2) {
  console.log('   ✅ Partial Phone Number search PASSED');
} else {
  console.error('   ❌ Phone Number search FAILED');
  process.exit(1);
}

console.log('\n🎉 ALL SEARCHABLE STUDENT COMBOBOX TESTS PASSED 100%!');

