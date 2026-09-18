import { STAFF_MODULES, STAFF_NAVIGATION_SECTIONS } from './staffNavigation.js';

const STAFF_ROLE_LABELS = Object.freeze({
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  sales: 'Sales Specialist',
  marketing: 'Marketing',
  operations: 'Operations'
});

export const normalizeStaffRole = (role) => String(role || '').trim().toLowerCase();

export const canViewStaffModule = (role, module) => {
  const normalizedRole = normalizeStaffRole(role);
  return Boolean(module?.roles?.includes(normalizedRole));
};

export const canAccessStaffRoute = canViewStaffModule;

export const getStaffModuleById = (moduleId) => (
  STAFF_MODULES.find((module) => module.id === moduleId)
);

export const getVisibleStaffModules = (role) => (
  STAFF_MODULES.filter((module) => canViewStaffModule(role, module))
);

export const getActiveStaffModule = (modules, pathname) => (
  [...modules]
    .sort((a, b) => b.path.length - a.path.length)
    .find((module) => (
      module.exact ? pathname === module.path : pathname.startsWith(`${module.path}/`) || pathname === module.path
    ))
);

export const getStaffRoleLabel = (role) => {
  const normalizedRole = normalizeStaffRole(role);
  return STAFF_ROLE_LABELS[normalizedRole] || 'Staff Member';
};

export const getStaffSectionLabel = (sectionId) => {
  const section = STAFF_NAVIGATION_SECTIONS[sectionId];
  if (!section) return '';

  return section.label || '';
};
