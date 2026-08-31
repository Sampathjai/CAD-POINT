// scratch/test_create_batch.js
require('../server/node_modules/dotenv').config({ path: './server/.env' });
const prisma = require('../server/src/config/prisma');

async function testCreateBatch() {
  console.log('--- TESTING BATCH CREATION IN DATABASE ---');
  
  // Find first course & branch
  const course = await prisma.course.findFirst();
  const branch = await prisma.branch.findFirst();

  const testCode = 'TEST-BAT-' + Math.floor(Math.random() * 1000);
  console.log(`Creating batch with code: ${testCode}`);

  const batch = await prisma.batch.create({
    data: {
      batchCode: testCode,
      name: 'Automated Test Batch',
      courseId: course ? course.id : null,
      branchId: branch ? branch.id : null,
      startDate: new Date(),
      capacity: 25,
      progress: 'IN_PROGRESS',
      syllabusProgress: 50,
      certificateStatus: 'IN_PROGRESS'
    }
  });

  console.log('✅ Batch created successfully in database!');
  console.log(`   Batch ID: ${batch.id}, Progress: ${batch.progress}, Syllabus: ${batch.syllabusProgress}%, Cert: ${batch.certificateStatus}`);

  // Cleanup test batch
  await prisma.batch.delete({ where: { id: batch.id } });
  console.log('   Cleaned up test batch.');

  process.exit(0);
}

testCreateBatch().catch(err => {
  console.error('💥 Batch creation error:', err);
  process.exit(1);
});
