const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const p = new PrismaClient();

async function main() {
  const b1 = await p.branch.upsert({
    where: { code: 'gandhipuram' },
    update: {},
    create: { code: 'gandhipuram', name: 'Gandhipuram', address: '100 Feet Road, Gandhipuram, Coimbatore', phone: '0422-2525251' }
  });

  const b2 = await p.branch.upsert({
    where: { code: 'saravanapatti' },
    update: {},
    create: { code: 'saravanapatti', name: 'Saravanapatti', address: 'Sathy Road, Saravanapatti, Coimbatore', phone: '0422-2525252' }
  });

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  await p.user.upsert({
    where: { email: 'admin@cadpoint.com' },
    update: { branchId: b1.id },
    create: { name: 'CADPOINT Admin', email: 'admin@cadpoint.com', passwordHash, role: 'SUPER_ADMIN', branchId: b1.id }
  });

  const names = ['Website', 'Google', 'Facebook', 'Instagram', 'LinkedIn', 'Walk-in', 'Referral', 'Advertisement', 'Telecaller', 'Other'];
  for (const name of names) {
    await p.enquirySource.upsert({ where: { name }, update: {}, create: { name } });
  }

  const courses = [
    ['AUTOCAD', 'AutoCAD 2D/3D', 30000],
    ['REVIT', 'Revit Architecture', 45000],
    ['SOLIDWORKS', 'SolidWorks Professional', 35000],
    ['BIM', 'BIM Professional', 50000],
    ['STAAD', 'STAAD Pro', 28000]
  ];
  for (const [courseCode, name, standardFee] of courses) {
    await p.course.upsert({ where: { courseCode }, update: {}, create: { courseCode, name, standardFee } });
  }

  // Backfill branchId on unassigned leads, students, admissions, payments, batches
  await p.lead.updateMany({ where: { branchId: null }, data: { branchId: b1.id } });
  await p.student.updateMany({ where: { branchId: null }, data: { branchId: b1.id } });
  await p.admission.updateMany({ where: { branchId: null }, data: { branchId: b1.id } });
  await p.payment.updateMany({ where: { branchId: null }, data: { branchId: b1.id } });
  await p.batch.updateMany({ where: { branchId: null }, data: { branchId: b1.id } });

  console.log('Seed complete. Branches: Gandhipuram & Saravanapatti created. Login: admin@cadpoint.com / Admin@123');
}

main().finally(() => p.$disconnect());
