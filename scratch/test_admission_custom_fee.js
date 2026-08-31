// scratch/test_admission_custom_fee.js
require('../server/node_modules/dotenv').config({ path: './server/.env' });
const prisma = require('../server/src/config/prisma');

async function testAdmissionCustomFee() {
  console.log('--- TESTING ADMISSION CREATION WITH CUSTOM/DIFFERENT FEES ---');

  const student = await prisma.student.findFirst();
  const course = await prisma.course.findFirst();
  const branch = await prisma.branch.findFirst();

  if (!student || !course || !branch) {
    console.error('❌ Prerequisite data missing (student, course, or branch)');
    process.exit(1);
  }

  const customFeeAmounts = [30000, 25000, 18500, 45000];

  for (const fee of customFeeAmounts) {
    const admNum = 'TEST-ADM-' + Math.floor(Math.random() * 10000);
    console.log(`Testing admission #${admNum} with custom fee: ₹${fee.toLocaleString()}...`);

    const created = await prisma.admission.create({
      data: {
        admissionNumber: admNum,
        studentId: student.id,
        courseId: course.id,
        branchId: branch.id,
        agreedFee: fee,
        finalFee: fee,
        startDate: new Date(),
        status: 'CONFIRMED'
      }
    });

    console.log(` ✅ Created Admission #${created.admissionNumber}: Agreed Fee = ₹${created.agreedFee}, Final Fee = ₹${created.finalFee}`);

    // Cleanup
    await prisma.admission.delete({ where: { id: created.id } });
    console.log('    Cleaned up test admission.');
  }

  console.log('\n🎉 ALL CUSTOM FEE ADMISSION CREATION TESTS PASSED 100%!');
  process.exit(0);
}

testAdmissionCustomFee().catch(err => {
  console.error('💥 Error testing custom fee admission:', err);
  process.exit(1);
});
