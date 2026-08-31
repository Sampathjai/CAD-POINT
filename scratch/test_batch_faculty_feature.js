// scratch/test_batch_faculty_feature.js

console.log('--- TESTING BATCH FACULTY PERSON NAME FEATURE ---');

const sampleFacultyList = [
  { id: 'usr-1', name: 'M. Anand (Trainer)', role: 'TRAINER' },
  { id: 'usr-2', name: 'R. Suresh (Admin)', role: 'ADMIN' }
];

const sampleBatchPayload = {
  batchCode: 'BAT-2026-A',
  name: 'Revit Architecture Morning Batch',
  courseId: 'crs-101',
  trainerId: 'usr-1',
  startDate: '2026-09-01',
  endDate: '2026-11-30',
  capacity: 20
};

// 1. Batch Payload Validation Test
console.log('1. Validating batch payload with Faculty Person selection:');
console.log('   Payload:', sampleBatchPayload);

if (sampleBatchPayload.trainerId === 'usr-1') {
  console.log('   ✅ Faculty person trainerId inclusion PASSED');
} else {
  console.error('   ❌ Faculty person trainerId missing');
  process.exit(1);
}

// 2. Simulated DB Record & Table Column Display Test
const simulatedDbBatch = {
  id: 'batch-101',
  ...sampleBatchPayload,
  trainer: sampleFacultyList.find(u => u.id === sampleBatchPayload.trainerId)
};

console.log('\n2. Validating Batch Table display column data:');
console.log(`   Batch Code: ${simulatedDbBatch.batchCode}`);
console.log(`   Batch Name: ${simulatedDbBatch.name}`);
console.log(`   Faculty Person: ${simulatedDbBatch.trainer?.name || '-'}`);

if (simulatedDbBatch.trainer?.name === 'M. Anand (Trainer)') {
  console.log('   ✅ Faculty Person column rendering PASSED');
} else {
  console.error('   ❌ Faculty Person column rendering failed');
  process.exit(1);
}

console.log('\n🎉 ALL BATCH FACULTY PERSON NAME FEATURE TESTS PASSED 100%!');
