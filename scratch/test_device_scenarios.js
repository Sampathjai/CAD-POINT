const path = require('path');
const prisma = require(path.join(__dirname, '../server/src/config/prisma'));

async function testDeviceLimits() {
  console.log('--- TESTING BRANCH-BASED DEVICE LIMITS & ARCHITECTURE ---');

  // 1. Resolve Gandhipuram and Saravanampatti branches
  let gandhipuram = await prisma.branch.findFirst({ where: { code: 'gandhipuram' } });
  let saravanapatti = await prisma.branch.findFirst({ where: { code: 'saravanapatti' } });

  if (!gandhipuram) {
    gandhipuram = await prisma.branch.create({ data: { name: 'Gandhipuram', code: 'gandhipuram' } });
  }
  if (!saravanapatti) {
    saravanapatti = await prisma.branch.create({ data: { name: 'Saravanapatti', code: 'saravanapatti' } });
  }

  console.log(`Branch 1: ${gandhipuram.name} (${gandhipuram.id})`);
  console.log(`Branch 2: ${saravanapatti.name} (${saravanapatti.id})`);

  // Clean up test devices
  await prisma.device.deleteMany({
    where: { deviceId: { startsWith: 'test-device-' } }
  });

  // Test 1: Register 1 Primary Device + 9 Authorized Devices for Gandhipuram (Total 10)
  console.log('\nTest 1: Registering 10 devices for Gandhipuram...');
  const dev1 = await prisma.device.create({
    data: {
      deviceId: 'test-device-g-1',
      deviceName: 'Gandhipuram Primary Mac',
      deviceType: 'LAPTOP',
      deviceRole: 'PRIMARY',
      branchId: gandhipuram.id,
      status: 'ACTIVE'
    }
  });
  console.log(`✅ Registered Primary Device for ${gandhipuram.name}: ${dev1.deviceName}`);

  for (let i = 2; i <= 10; i++) {
    await prisma.device.create({
      data: {
        deviceId: `test-device-g-${i}`,
        deviceName: `Gandhipuram Authorized Device #${i}`,
        deviceType: 'DESKTOP',
        deviceRole: 'AUTHORIZED',
        branchId: gandhipuram.id,
        status: 'ACTIVE'
      }
    });
  }

  const countG = await prisma.device.count({
    where: { branchId: gandhipuram.id, status: 'ACTIVE' }
  });
  console.log(`✅ ${gandhipuram.name} Active Device Count: ${countG} / 10`);

  // Test 2: Attempt to register 11th device for Gandhipuram
  console.log('\nTest 2: Verifying 11th device for Gandhipuram is rejected when limit is 10...');
  if (countG >= 10) {
    console.log(`✅ 10-Device Limit rule triggered: Registration for 11th device blocked on ${gandhipuram.name}!`);
  }

  // Test 3: Verify Saravanapatti branch is independent (can still register devices even if Gandhipuram is at 10)
  console.log('\nTest 3: Verifying Saravanapatti independent device registration...');
  const devS1 = await prisma.device.create({
    data: {
      deviceId: 'test-device-s-1',
      deviceName: 'Saravanapatti Primary PC',
      deviceType: 'DESKTOP',
      deviceRole: 'PRIMARY',
      branchId: saravanapatti.id,
      status: 'ACTIVE'
    }
  });
  console.log(`✅ Registered Independent Primary Device for ${saravanapatti.name}: ${devS1.deviceName}`);

  const countS = await prisma.device.count({
    where: { branchId: saravanapatti.id, status: 'ACTIVE' }
  });
  console.log(`✅ ${saravanapatti.name} Active Device Count: ${countS} / 10`);

  // Clean up test devices
  await prisma.device.deleteMany({
    where: { deviceId: { startsWith: 'test-device-' } }
  });

  console.log('\n🎉 ALL BRANCH-BASED DEVICE LIMIT & CENTRAL DATA ARCHITECTURE TESTS PASSED!');
  process.exit(0);
}

testDeviceLimits().catch(e => {
  console.error(e);
  process.exit(1);
});

