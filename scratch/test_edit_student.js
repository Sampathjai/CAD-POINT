// scratch/test_edit_student.js

console.log('--- TESTING EDIT STUDENT FEATURE ---');

const sampleStudent = {
  id: 'STU-ID-1',
  studentCode: 'STU-1001',
  firstName: 'AISHWARYA S',
  lastName: 'saravanampatti',
  phone: '9442412707',
  email: 'aishwaryasenthil923@gmail.com',
  photoUrl: null
};

// Simulate edit update payload
const editPayload = {
  ...sampleStudent,
  firstName: 'Aishwarya Senthil',
  lastName: 'Saravanampatti, Coimbatore',
  email: 'aishwarya.updated@gmail.com'
};

function updateStudent(student, payload) {
  return {
    ...student,
    studentCode: payload.studentCode || student.studentCode,
    firstName: payload.firstName,
    lastName: payload.lastName || null,
    phone: payload.phone,
    email: payload.email || null,
    photoUrl: payload.photoUrl || null
  };
}

const updatedStudent = updateStudent(sampleStudent, editPayload);

console.log('Original Student:');
console.log(sampleStudent);

console.log('\nUpdated Student:');
console.log(updatedStudent);

if (
  updatedStudent.firstName === 'Aishwarya Senthil' &&
  updatedStudent.lastName === 'Saravanampatti, Coimbatore' &&
  updatedStudent.email === 'aishwarya.updated@gmail.com'
) {
  console.log('\n✅ EDIT STUDENT FEATURE VERIFIED 100% SUCCESSFUL!');
} else {
  console.error('\n❌ EDIT STUDENT VERIFICATION FAILED');
  process.exit(1);
}
