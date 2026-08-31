const path = require('path');
const prisma = require(path.join(__dirname, '../server/src/config/prisma'));

async function cleanupBranchNames() {
  console.log('--- CLEANING UP BRANCHES IN SUPABASE DATABASE ---');

  const correctBranch = await prisma.branch.findFirst({
    where: { code: 'saravanapatti' }
  });

  const duplicateBranch = await prisma.branch.findFirst({
    where: { code: 'saravanampatti' }
  });

  if (duplicateBranch && correctBranch) {
    console.log(`Migrating relations from duplicate "${duplicateBranch.name}" (${duplicateBranch.id}) to "${correctBranch.name}" (${correctBranch.id})...`);

    await prisma.lead.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.student.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.admission.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.payment.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.device.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.user.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.whatsAppIntegration.updateMany({
      where: { branchId: duplicateBranch.id },
      data: { branchId: correctBranch.id }
    });

    await prisma.branch.delete({
      where: { id: duplicateBranch.id }
    });

    console.log(`✅ Removed duplicate branch "${duplicateBranch.name}" (${duplicateBranch.id}).`);
  }

  // Ensure exact branch names "Gandhipuram Branch" and "Saravanapatti Branch" or "Gandhipuram" and "Saravanapatti"
  const allBranches = await prisma.branch.findMany({ orderBy: { name: 'asc' } });
  console.log('\nFINAL ACTIVE BRANCHES IN DATABASE:');
  allBranches.forEach(b => console.log(`- ${b.name} (Code: ${b.code}, ID: ${b.id})`));

  process.exit(0);
}

cleanupBranchNames().catch(e => {
  console.error(e);
  process.exit(1);
});

