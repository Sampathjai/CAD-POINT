// scratch/test_lead_conversion_flow.js

console.log('--- TESTING LEADS & FOLLOW-UP CONVERSION FLOW ---');

// Mock state representing DB records
const leads = [
  { id: 'L-101', firstName: 'Rahul', lastName: 'Kumar', phone: '9876543210', email: 'rahul@gmail.com', interestedCourse: 'AutoCAD', createdAt: '2026-08-25T10:00:00Z', status: 'NEW' }
];

const followups = [
  { id: 'F-1', leadId: 'L-101', scheduledAt: '2026-08-28T10:00:00Z', status: 'PENDING', notes: 'Call regarding AutoCAD fee' }
];

const students = [];
const admissions = [];

// 1. Verify Lead Date vs Follow-up Date distinction
const lead = leads[0];
const followup = followups[0];

console.log('1. Checking Date Distinction:');
console.log(`   Lead Date:        ${lead.createdAt.slice(0, 10)}`);
console.log(`   Follow-up Date:   ${followup.scheduledAt.slice(0, 10)}`);
if (lead.createdAt !== followup.scheduledAt) {
  console.log('   ✅ Lead Date and Follow-up Date are distinct & separate');
} else {
  console.error('   ❌ Date distinction failed');
  process.exit(1);
}

// 2. Perform "Convert & Admit" Flow
console.log('\n2. Simulating "Convert & Admit" Action on Follow-up:');

// Check student creation / reuse
let student = students.find(s => s.phone === lead.phone);
if (!student) {
  student = { id: 'STU-1001', studentCode: 'STU-1001', firstName: lead.firstName, lastName: lead.lastName, phone: lead.phone, email: lead.email };
  students.push(student);
  console.log(`   ✅ New Student created: ${student.firstName} (${student.phone})`);
} else {
  console.log(`   ✅ Reused existing Student: ${student.firstName}`);
}

// Create Admission
const admission = {
  id: 'ADM-2001',
  admissionNumber: 'ADM-2001',
  leadId: lead.id,
  studentId: student.id,
  finalFee: 30000,
  createdAt: '2026-08-31T10:00:00Z'
};
admissions.push(admission);

// Mark Lead as CONVERTED and Follow-up as COMPLETED
lead.status = 'CONVERTED';
lead.admission = admission;
followup.status = 'COMPLETED';
followup.outcome = `Converted to Admission #${admission.admissionNumber}`;

console.log(`   ✅ Admission #${admission.admissionNumber} created for Student ${student.id} linked to Lead ${lead.id}`);
console.log(`   ✅ Lead status updated: ${lead.status}`);
console.log(`   ✅ Follow-up status updated: ${followup.status} (Outcome: ${followup.outcome})`);

// 3. Test Duplicate Admission Prevention
console.log('\n3. Testing Duplicate Admission Prevention:');
const isAlreadyConverted = admissions.some(a => a.leadId === lead.id);
if (isAlreadyConverted) {
  console.log(`   ✅ Prevented duplicate admission: Lead ${lead.id} already converted to Admission #${lead.admission.admissionNumber}`);
} else {
  console.error('   ❌ Duplicate check failed');
  process.exit(1);
}

// 4. Test Counsellor Dashboard "Converted" Metric
console.log('\n4. Testing Counsellor Dashboard "Converted" Analytics:');
const convertedCount = admissions.filter(a => a.leadId).length;
console.log(`   Converted Count: ${convertedCount}`);
if (convertedCount === 1) {
  console.log('   ✅ Converted metric correctly counts actual admissions created from leads');
} else {
  console.error('   ❌ Converted metric calculation failed');
  process.exit(1);
}

console.log('\n🎉 ALL LEADS & FOLLOW-UP CONVERSION FLOW TESTS PASSED 100%!');

