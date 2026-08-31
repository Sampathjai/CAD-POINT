// scratch/check_users.js

const prisma = require('../server/src/config/prisma');

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, isActive: true }
  });
  console.log('ACTIVE USERS IN DATABASE:');
  console.table(users);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

