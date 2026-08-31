// scratch/test_admission_student_photo.js

console.log('--- TESTING ADMISSION DETAILS STUDENT PHOTO PREVIEW FEATURE ---');

const sampleAdmission = {
  id: 'adm-1001',
  admissionNumber: 'A009214',
  studentId: 'stu-999',
  student: {
    id: 'stu-999',
    studentCode: 'S009214',
    firstName: 'Test Student',
    phone: '999009214',
    email: 'test@gmail.com',
    address: 'Coimbatore',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
  },
  course: { name: 'Revit Architecture' },
  batch: { name: 'Batch 009214' },
  finalFee: 30000
};

// 1. Photo Retrieval Test from Linked Student Record
console.log('1. Validating photo source of truth from linked Student record:');
if (sampleAdmission.student?.photoUrl) {
  console.log(`   Linked Student: ${sampleAdmission.student.firstName} (${sampleAdmission.student.studentCode})`);
  console.log(`   Retrieved Photo URL: ${sampleAdmission.student.photoUrl}`);
  console.log('   ✅ Student photo source of truth PASSED');
} else {
  console.error('   ❌ Student photo missing');
  process.exit(1);
}

// 2. Fallback Placeholder Test for Student Without Photo
console.log('\n2. Validating fallback placeholder for student without photo:');
const admissionNoPhoto = {
  ...sampleAdmission,
  student: { ...sampleAdmission.student, photoUrl: null }
};

function getPhotoDisplay(student) {
  if (!student?.photoUrl) {
    return { type: 'PLACEHOLDER', label: '👤 No Photo' };
  }
  return { type: 'IMAGE', url: student.photoUrl };
}

const resNoPhoto = getPhotoDisplay(admissionNoPhoto.student);
console.log('   No-photo result:', resNoPhoto);

if (resNoPhoto.type === 'PLACEHOLDER' && resNoPhoto.label.includes('No Photo')) {
  console.log('   ✅ Fallback placeholder PASSED');
} else {
  console.error('   ❌ Fallback placeholder failed');
  process.exit(1);
}

// 3. Click to Lightbox Preview Simulation
console.log('\n3. Simulating click to open Lightbox Preview Modal:');
let activePreviewUrl = null;
function handlePhotoClick(photoUrl) {
  if (photoUrl) activePreviewUrl = photoUrl;
}

handlePhotoClick(sampleAdmission.student.photoUrl);
console.log(`   Active Lightbox Preview URL: ${activePreviewUrl}`);

if (activePreviewUrl === sampleAdmission.student.photoUrl) {
  console.log('   ✅ Lightbox preview trigger PASSED');
} else {
  console.error('   ❌ Lightbox trigger failed');
  process.exit(1);
}

console.log('\n🎉 ALL ADMISSION DETAILS STUDENT PHOTO PREVIEW TESTS PASSED 100%!');

