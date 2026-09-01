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
    'students',
    'admissions',
    'payments',
    'reports',
    'whatsapp',
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
    'students',
    'admissions',
    'payments',
    'reports',
    'whatsapp',
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
    'students',
    'admissions',
    'settings',
    'settings.profile',
    'settings.appearance'
  ],
  TRAINER: [
    'courses',
    'batches',
    'students',
    'settings',
    'settings.profile',
    'settings.appearance'
  ],
  ACCOUNTANT: [
    'dashboard',
    'payments',
    'reports',
    'settings',
    'settings.profile',
    'settings.appearance'
  ],
  ACCOUNTS: [
    'dashboard',
    'payments',
    'reports',
    'settings',
    'settings.profile',
    'settings.appearance'
  ],
  RECEPTIONIST: [
    'leads',
    'followups',
    'batches',
    'students',
    'settings',
    'settings.profile',
    'settings.appearance'
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
  Students: 'students',
  students: 'students',
  Admissions: 'admissions',
  'Student Admissions': 'admissions',
  admissions: 'admissions',
  Payments: 'payments',
  payments: 'payments',
  Reports: 'reports',
  reports: 'reports',
  WhatsApp: 'whatsapp',
  whatsapp: 'whatsapp',
  Users: 'userControl',
  'User Control': 'userControl',
  userControl: 'userControl',
  Settings: 'settings',
  settings: 'settings'
};

const ALL_CRM_MODULES = [
  { key: 'dashboard', label: 'Dashboard', group: 'Core' },
  { key: 'leads', label: 'Leads', group: 'Core' },
  { key: 'students', label: 'Students', group: 'Core' },
  { key: 'admissions', label: 'Admissions', group: 'Operations' },
  { key: 'courses', label: 'Courses', group: 'Operations' },
  { key: 'batches', label: 'Batches', group: 'Operations' },
  { key: 'payments', label: 'Payments', group: 'Operations' },
  { key: 'followups', label: 'Follow-ups', group: 'Communication' },
  { key: 'whatsapp', label: 'WhatsApp', group: 'Communication' },
  { key: 'reports', label: 'Reports', group: 'Reports' },
  { key: 'userControl', label: 'Users', group: 'Administration' },
  { key: 'settings', label: 'Settings', group: 'Administration' }
];

function normalizeRole(role) {
  if (!role) return 'RECEPTIONIST';
  const r = (role + '').toUpperCase().trim();
  if (r === 'ACCOUNTANT') return 'ACCOUNTS';
  return r;
}

function hasPermission(roleOrUser, permissionKey) {
  let role = roleOrUser;
  let customPermissions = null;

  if (roleOrUser && typeof roleOrUser === 'object') {
    role = roleOrUser.role;
    if (Array.isArray(roleOrUser.customPermissions)) {
      customPermissions = roleOrUser.customPermissions;
    }
  }

  const normRole = normalizeRole(role);
  if (normRole === 'SUPER_ADMIN') return true;

  const targetKey = PAGE_TO_PERMISSION_KEY[permissionKey] || permissionKey;

  if (Array.isArray(customPermissions) && customPermissions.length > 0) {
    return customPermissions.includes(targetKey) || customPermissions.includes(permissionKey);
  }

  const allowedPermissions = ROLE_PERMISSIONS[normRole] || [];
  return allowedPermissions.includes(targetKey);
}

function getDefaultPageForRole(role) {
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
  ALL_CRM_MODULES,
  ROLE_PERMISSIONS,
  PAGE_TO_PERMISSION_KEY,
  normalizeRole,
  hasPermission,
  getDefaultPageForRole
};
