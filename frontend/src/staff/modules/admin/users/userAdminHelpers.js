export const USER_ROLE_LABELS = Object.freeze({
  super_admin: 'Super Administrator',
  admin: 'Administrator',
  operations: 'Operations',
  sales: 'Sales',
  marketing: 'Management',
  influencer: 'Creator',
  user: 'Customer'
});

export const ACCOUNT_TYPE_LABELS = Object.freeze({ customer: 'Customer', staff: 'Staff', creator: 'Creator' });

export const userRoleLabel = (role) => USER_ROLE_LABELS[role] || role || 'Unknown';
export const accountTypeLabel = (type) => ACCOUNT_TYPE_LABELS[type] || type || 'Unknown';
export const formatUserDate = (value) => value ? new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium' }).format(new Date(value)) : 'Not available';
export const userInitials = (name) => String(name || 'U').split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase();

