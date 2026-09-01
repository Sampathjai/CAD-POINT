/**
 * Centralized Role-Based Access Control (RBAC) Permissions Matrix for CAD POINT CRM Frontend
 */

export const ROLE_PERMISSIONS = {
  SUPER_ADMIN: [
    'adminDashboard',
    'leadsDashboard',
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
    'adminSettings',
    'userSettings'
  ],
  ADMIN: [
    'adminDashboard',
    'leadsDashboard',
    'leads',
    'followups',
    'courses',
    'batches',
    'students',
    'admissions',
    'payments',
    'reports',
    'whatsapp',
    'adminSettings',
    'userSettings'
  ],
  COUNSELLOR: [
    'leadsDashboard',
    'leads',
    'followups',
    'courses',
    'batches',
    'students',
    'admissions',
    'userSettings'
  ],
  TRAINER: [
    'courses',
    'batches',
    'students',
    'userSettings'
  ],
  ACCOUNTANT: [
    'adminDashboard',
    'payments',
    'reports',
    'userSettings'
  ],
  ACCOUNTS: [
    'adminDashboard',
    'payments',
    'reports',
    'userSettings'
  ],
  RECEPTIONIST: [
    'leadsDashboard',
    'leads',
    'followups',
    'batches',
    'students',
    'userSettings'
  ]
};

export const PAGE_TO_PERMISSION_KEY = {
  Dashboard: 'adminDashboard',
  'Admin Dashboard': 'adminDashboard',
  adminDashboard: 'adminDashboard',
  'Leads Dashboard': 'leadsDashboard',
  leadsDashboard: 'leadsDashboard',
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
  Settings: 'adminSettings',
  'Admin Settings': 'adminSettings',
  adminSettings: 'adminSettings',
  'Normal User Settings': 'userSettings',
  'User Settings': 'userSettings',
  userSettings: 'userSettings'
};

export const ALL_CRM_MODULES = [
  { key: 'adminDashboard', label: 'Admin Dashboard', group: 'DASHBOARDS' },
  { key: 'leadsDashboard', label: 'Leads Dashboard', group: 'DASHBOARDS' },
  { key: 'leads', label: 'Leads', group: 'CORE' },
  { key: 'students', label: 'Students', group: 'CORE' },
  { key: 'admissions', label: 'Admissions', group: 'OPERATIONS' },
  { key: 'courses', label: 'Courses', group: 'OPERATIONS' },
  { key: 'batches', label: 'Batches', group: 'OPERATIONS' },
  { key: 'payments', label: 'Payments', group: 'OPERATIONS' },
  { key: 'followups', label: 'Follow-ups', group: 'COMMUNICATION' },
  { key: 'whatsapp', label: 'WhatsApp', group: 'COMMUNICATION' },
  { key: 'reports', label: 'Reports', group: 'REPORTS' },
  { key: 'userControl', label: 'Users', group: 'ADMINISTRATION' },
  { key: 'adminSettings', label: 'Admin Settings', group: 'ADMINISTRATION' },
  { key: 'userSettings', label: 'Normal User Settings', group: 'ADMINISTRATION' }
];

export function normalizeRole(role) {
  if (!role) return 'RECEPTIONIST';
  const r = (role + '').toUpperCase().trim();
  if (r === 'ACCOUNTANT') return 'ACCOUNTS';
  return r;
}

export function hasPermission(roleOrUser, permissionKey) {
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

  const checkPerm = (permArray) => {
    if (!Array.isArray(permArray)) return false;
    if (permArray.includes(targetKey) || permArray.includes(permissionKey)) return true;
    if ((targetKey === 'adminDashboard' || targetKey === 'leadsDashboard') && permArray.includes('dashboard')) return true;
    if ((targetKey === 'adminSettings' || targetKey === 'userSettings') && permArray.includes('settings')) return true;
    return false;
  };

  if (Array.isArray(customPermissions) && customPermissions.length > 0) {
    return checkPerm(customPermissions);
  }

  const allowedPermissions = ROLE_PERMISSIONS[normRole] || [];
  return checkPerm(allowedPermissions);
}

export function getDefaultPageForRole(roleOrUser) {
  let user = typeof roleOrUser === 'object' ? roleOrUser : { role: roleOrUser };
  if (hasPermission(user, 'adminDashboard')) return 'Admin Dashboard';
  if (hasPermission(user, 'leadsDashboard')) return 'Leads Dashboard';
  if (hasPermission(user, 'leads')) return 'Leads';
  if (hasPermission(user, 'students')) return 'Students';
  if (hasPermission(user, 'courses')) return 'Courses';
  return 'Leads';
}
