/**
 * Centralized Role-Based Access Control (RBAC) Permissions Matrix for CAD POINT CRM
 */

const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'dashboard',
    'leads',
    'followups',
    'courses',
    'batches',
    'admissions',
    'payments',
    'reports',
    'userControl',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.whatsapp',
    'settings.devices',
    'settings.branches',
    'settings.users'
  ],
  ADMIN: [
    'dashboard',
    'leads',
    'followups',
    'courses',
    'batches',
    'admissions',
    'payments',
    'reports',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.whatsapp',
    'settings.devices',
    'settings.branches'
  ],
  COUNSELLOR: [
    'dashboard',
    'leads',
    'followups',
    'courses',
    'batches',
    'admissions',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.devices'
  ],
  TRAINER: [
    'courses',
    'batches',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.devices'
  ],
  ACCOUNTANT: [
    'dashboard',
    'payments',
    'reports',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.devices'
  ],
  ACCOUNTS: [
    'dashboard',
    'payments',
    'reports',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.devices'
  ],
  RECEPTIONIST: [
    'leads',
    'followups',
    'batches',
    'settings',
    'settings.profile',
    'settings.appearance',
    'settings.devices'
  ]
};

const PAGE_TO_PERMISSION_KEY = {
  Dashboard: 'dashboard',
  dashboard: 'dashboard',
  Leads: 'leads',
  leads: 'leads',
  'Follow-ups': 'followups',
  followups: 'followups',
  Courses: 'courses',
  courses: 'courses',
  Batches: 'batches',
  batches: 'batches',
  Students: 'admissions',
  Admissions: 'admissions',
  'Student Admissions': 'admissions',
  admissions: 'admissions',
  Payments: 'payments',
  payments: 'payments',
  Reports: 'reports',
  reports: 'reports',
  Users: 'userControl',
  'User Control': 'userControl',
  userControl: 'userControl',
  Settings: 'settings',
  settings: 'settings'
};

function normalizeRole(role) {
  if (!role) return 'RECEPTIONIST';
  const r = (role + '').toUpperCase().trim();
  if (r === 'ACCOUNTANT') return 'ACCOUNTS';
  return r;
}

function hasPermission(roleOrUser, permissionKey) {
  const role = typeof roleOrUser === 'object' ? roleOrUser?.role : roleOrUser;
  const normRole = normalizeRole(role);
  const allowedPermissions = ROLE_PERMISSIONS[normRole] || [];
  const targetKey = PAGE_TO_PERMISSION_KEY[permissionKey] || permissionKey;
  return allowedPermissions.includes(targetKey);
}

function getDefaultPageForRole(roleOrUser) {
  const role = typeof roleOrUser === 'object' ? roleOrUser?.role : roleOrUser;
  const normRole = normalizeRole(role);
  switch (normRole) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'COUNSELLOR':
    case 'ACCOUNTS':
    case 'ACCOUNTANT':
      return 'Dashboard';
    case 'RECEPTIONIST':
      return 'Leads';
    case 'TRAINER':
      return 'Courses';
    default:
      return 'Leads';
  }
}

module.exports = {
  ROLE_PERMISSIONS,
  PAGE_TO_PERMISSION_KEY,
  normalizeRole,
  hasPermission,
  getDefaultPageForRole
};
