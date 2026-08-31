// scratch/test_followup_admit_flow.js

console.log('--- TESTING FOLLOW-UP -> ADMIT -> ADD STUDENT FLOW ---');

const sampleLead = {
  id: 'lead-101',
  firstName: 'Priya',
  lastName: 'Dharshini',
  phone: '9876543211',
  email: 'priya@gmail.com',
  city: 'Coimbatore',
  status: 'QUALIFIED'
};

const sampleFollowup = {
  id: 'followup-501',
  leadId: sampleLead.id,
  lead: sampleLead,
  scheduledAt: new Date().toISOString(),
  status: 'PENDING',
  type: 'CALL',
  notes: 'Interested in CAD course'
};

// 1. Simulate clicking [ Admit ] on Follow-up
console.log('1. Click [ Admit ] on Follow-up:');
function prepareAddStudentForm(f) {
  const l = f.lead;
  return {
    studentCode: 'STU-1005',
    leadId: l.id,
    firstName: `${l.firstName} ${l.lastName}`.trim(),
    phone: l.phone,
    email: l.email,
    address: l.city,
    parentName: '',
    dateOfBirth: '',
    passportNumber: '',
    photoUrl: ''
  };
}

const prefilledForm = prepareAddStudentForm(sampleFollowup);
console.log('   Pre-filled Add Student Form:', prefilledForm);

if (
  prefilledForm.firstName === 'Priya Dharshini' &&
  prefilledForm.phone === '9876543211' &&
  prefilledForm.leadId === 'lead-101'
) {
  console.log('   ✅ Lead info pre-filled into Add Student form PASSED');
} else {
  console.error('   ❌ Pre-fill failed');
  process.exit(1);
}

// 2. Simulate Student Creation & Auto-linking
console.log('\n2. Submit Create Student:');
const studentsDatabase = [];
const leadsDatabase = [sampleLead];
const followupsDatabase = [sampleFollowup];

function executeCreateStudent(formData) {
  // Check duplicate
  const existing = studentsDatabase.find(s => s.leadId === formData.leadId);
  if (existing) {
    throw new Error(`Student already created for this lead (${existing.studentCode})`);
  }

  const createdStudent = {
    id: `stu-${Date.now()}`,
    ...formData,
    createdAt: new Date().toISOString()
  };
  studentsDatabase.push(createdStudent);

  // Link lead & followup
  const l = leadsDatabase.find(lead => lead.id === formData.leadId);
  if (l) l.status = 'CONVERTED';

  const f = followupsDatabase.find(fol => fol.leadId === formData.leadId);
  if (f) {
    f.status = 'COMPLETED';
    f.outcome = `Converted to Student #${createdStudent.studentCode}`;
  }

  return createdStudent;
}

const newStudent = executeCreateStudent(prefilledForm);
console.log('   Created Student:', newStudent.studentCode, newStudent.firstName);
console.log('   Updated Lead Status:', leadsDatabase[0].status);
console.log('   Updated Follow-up Status:', followupsDatabase[0].status, '| Outcome:', followupsDatabase[0].outcome);

if (
  studentsDatabase.length === 1 &&
  leadsDatabase[0].status === 'CONVERTED' &&
  followupsDatabase[0].status === 'COMPLETED'
) {
  console.log('   ✅ Student creation, database persistence & Lead status update PASSED');
} else {
  console.error('   ❌ Execution failed');
  process.exit(1);
}

// 3. Test Duplicate Prevention
console.log('\n3. Test Duplicate Prevention (clicking Admit again):');
try {
  executeCreateStudent(prefilledForm);
  console.error('   ❌ Duplicate student was allowed!');
  process.exit(1);
} catch (err) {
  console.log('   ✅ Duplicate prevention PASSED:', err.message);
}

console.log('\n🎉 ALL FOLLOW-UP -> ADMIT -> ADD STUDENT FLOW TESTS PASSED 100%!');
