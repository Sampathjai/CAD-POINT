const { execSync } = require('child_process');
const fetch = globalThis.fetch;
const { PrismaClient } = require('@prisma/client');

const API = process.env.TEST_API_URL || 'http://localhost:5001/api';
const prisma = new PrismaClient();

describe('Leads integration', () => {
  let token;
  beforeAll(async () => {
    // expect the test server to be running and seeded
    // we will login with seeded admin
    const res = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@cadpoint.com', password: 'Admin@123' }) });
    const j = await res.json();
    if (!j.success) throw new Error('login failed: ' + JSON.stringify(j));
    token = j.data.token;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('create and list lead', async () => {
    const lead = { firstName: 'Test', lastName: 'Lead', phone: '9999999999', email: 'test.lead@example.com', interestedCourse: 'AUTOCAD' };
    const res = await fetch(API + '/leads', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify(lead) });
    const j = await res.json();
    expect(j.success).toBe(true);
    expect(j.data).toBeDefined();
    const list = await (await fetch(API + '/leads', { headers: { Authorization: 'Bearer ' + token } })).json();
    expect(list.success).toBe(true);
    expect(Array.isArray(list.data)).toBe(true);
  }, 20000);
});
