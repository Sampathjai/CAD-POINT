const fetch = globalThis.fetch;

const API = process.env.TEST_API_URL || 'http://localhost:5001/api';

describe('New module endpoints integration', () => {
  let token;
  beforeAll(async () => {
    const res = await fetch(API + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'admin@cadpoint.com', password: 'Admin@123' }) });
    const j = await res.json();
    if (!j.success) throw new Error('login failed');
    token = j.data.token;
  }, 20000);

  test('create course -> batch -> student -> admission -> payment -> notification -> search', async () => {
    const unique = Date.now().toString().slice(-6);
    // course
    const courseRes = await (await fetch(API + '/courses', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ courseCode: 'TEST' + unique, name: 'Test Course ' + unique, standardFee: 1000 }) })).json();
    expect(courseRes.success).toBe(true);
    const courseId = courseRes.data.id;

    // batch
    const batchRes = await (await fetch(API + '/batches', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ batchCode: 'B' + unique, name: 'Batch ' + unique, courseId, startDate: new Date().toISOString() }) })).json();
    expect(batchRes.success).toBe(true);
    const batchId = batchRes.data.id;

    // student
    const studentRes = await (await fetch(API + '/students', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ studentCode: 'S' + unique, firstName: 'Test', phone: '999' + unique }) })).json();
    expect(studentRes.success).toBe(true);
    const studentId = studentRes.data.id;

    // admission
    const admissionRes = await (await fetch(API + '/admissions', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionNumber: 'A' + unique, studentId, courseId, batchId, finalFee: 1000 }) })).json();
    expect(admissionRes.success).toBe(true);
    const admissionId = admissionRes.data.id;

    // payment
    const paymentRes = await (await fetch(API + '/payments', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ admissionId, receiptNumber: 'R' + unique, amount: 1000, paymentMethod: 'CASH' }) })).json();
    expect(paymentRes.success).toBe(true);

    // notification
    const notifRes = await (await fetch(API + '/notifications', { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'SYSTEM', title: 'Test', message: 'Test message' }) })).json();
    expect(notifRes.success).toBe(true);

    // search for course
    const searchRes = await (await fetch(API + '/search?q=Test', { headers: { Authorization: 'Bearer ' + token } })).json();
    expect(searchRes.success).toBe(true);
    expect(searchRes.data.courses.length).toBeGreaterThanOrEqual(1);
  }, 40000);
});
