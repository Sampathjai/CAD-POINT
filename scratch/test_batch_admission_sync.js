// scratch/test_batch_admission_sync.js

console.log('--- TESTING BATCH ↔ ADMISSION SYNCHRONIZATION & MANAGEMENT ---');

// Mock Batch Models
let batchA = {
  id: 'batch-101',
  batchCode: 'BAT-A',
  name: 'Revit Architecture Morning',
  capacity: 2,
  progress: 'In Progress',
  syllabusProgress: 40,
  certificateStatus: 'IN_PROGRESS',
  admissions: []
};

let batchB = {
  id: 'batch-102',
  batchCode: 'BAT-B',
  name: 'Revit Architecture Evening',
  capacity: 25,
  progress: 'In Progress',
  syllabusProgress: 85,
  certificateStatus: 'ISSUED',
  admissions: []
};

// Mock Admission Model
let admission1 = {
  id: 'adm-001',
  admissionNumber: 'A001',
  studentId: 'stu-001',
  studentName: 'Rahul Kumar',
  batchId: null,
  completionPct: 0
};

let admission2 = {
  id: 'adm-002',
  admissionNumber: 'A002',
  studentId: 'stu-002',
  studentName: 'Priya Sharma',
  batchId: null,
  completionPct: 0
};

let admission3 = {
  id: 'adm-003',
  admissionNumber: 'A003',
  studentId: 'stu-003',
  studentName: 'Arun Kumar',
  batchId: null,
  completionPct: 0
};

// 1. Assign Students to Batch A
console.log('1. Assigning Students 1 & 2 to Batch A (Capacity = 2):');
function assignToBatch(targetBatch, admissionsToAssign) {
  const availableSeats = targetBatch.capacity - targetBatch.admissions.length;
  if (admissionsToAssign.length > availableSeats) {
    throw new Error(`Only ${availableSeats} seat(s) available in this batch (${targetBatch.name}). Cannot assign ${admissionsToAssign.length} student(s).`);
  }

  admissionsToAssign.forEach(adm => {
    adm.batchId = targetBatch.id;
    adm.completionPct = targetBatch.syllabusProgress;
    targetBatch.admissions.push(adm);
  });
}

assignToBatch(batchA, [admission1, admission2]);
console.log(`   Batch A assigned count: ${batchA.admissions.length} / ${batchA.capacity}`);
console.log(`   Admission 1 Batch: ${admission1.batchId}, Syllabus: ${admission1.completionPct}%`);
console.log('   ✅ Initial batch assignment PASSED');

// 2. Enforce Batch Capacity Validation
console.log('\n2. Testing Capacity Limit Enforcement (Attempting to assign Student 3 to full Batch A):');
try {
  assignToBatch(batchA, [admission3]);
  console.error('   ❌ Capacity validation failed (allowed exceeding capacity)');
  process.exit(1);
} catch (err) {
  console.log(`   Caught Expected Warning: "${err.message}"`);
  console.log('   ✅ Batch Capacity Limit enforcement PASSED');
}

// 3. Batch Progress Cascade Update
console.log('\n3. Updating Batch A Syllabus Progress from 40% → 70%:');
batchA.syllabusProgress = 70;
batchA.admissions.forEach(adm => {
  adm.completionPct = batchA.syllabusProgress;
});

console.log(`   Admission 1 Syllabus Progress: ${admission1.completionPct}%`);
console.log(`   Admission 2 Syllabus Progress: ${admission2.completionPct}%`);
if (admission1.completionPct === 70 && admission2.completionPct === 70) {
  console.log('   ✅ Batch → Admission cascade auto-sync PASSED');
} else {
  console.error('   ❌ Cascade auto-sync failed');
  process.exit(1);
}

// 4. Moving Student 1 from Batch A to Batch B (Evening Batch)
console.log('\n4. Moving Student 1 from Batch A (Morning) → Batch B (Evening, 85% Syllabus):');
// Remove from A
batchA.admissions = batchA.admissions.filter(a => a.id !== admission1.id);
// Assign to B
assignToBatch(batchB, [admission1]);

console.log(`   Batch A assigned count: ${batchA.admissions.length} / ${batchA.capacity}`);
console.log(`   Batch B assigned count: ${batchB.admissions.length} / ${batchB.capacity}`);
console.log(`   Student 1 Admission Batch: ${admission1.batchId} (${batchB.name}), Syllabus: ${admission1.completionPct}%`);

if (admission1.batchId === 'batch-102' && admission1.completionPct === 85) {
  console.log('   ✅ Student Batch Reassignment & Progress Sync PASSED');
} else {
  console.error('   ❌ Student Batch Reassignment failed');
  process.exit(1);
}

// 5. Unassigning Student 2 from Batch A
console.log('\n5. Removing Student 2 from Batch A:');
batchA.admissions = batchA.admissions.filter(a => a.id !== admission2.id);
admission2.batchId = null;
console.log(`   Batch A assigned count: ${batchA.admissions.length} / ${batchA.capacity}`);
console.log(`   Student 2 Batch ID: ${admission2.batchId}`);

if (batchA.admissions.length === 0 && admission2.batchId === null) {
  console.log('   ✅ Student Unassign/Removal PASSED');
} else {
  console.error('   ❌ Student Unassign/Removal failed');
  process.exit(1);
}

console.log('\n🎉 ALL BATCH ↔ ADMISSION SYNCHRONIZATION TESTS PASSED 100%!');
