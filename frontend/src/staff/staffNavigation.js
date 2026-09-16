export const STAFF_NAVIGATION_SECTIONS = Object.freeze({
  overview: Object.freeze({ id: 'overview', label: null }),
  administration: Object.freeze({ id: 'administration', label: 'Administration' }),
  sales: Object.freeze({ id: 'sales', label: 'Sales' }),
  management: Object.freeze({ id: 'management', label: 'Management' })
});

export const STAFF_MODULES = Object.freeze([
  Object.freeze({
    id: 'overview',
    label: 'Overview',
    path: '/staff',
    icon: 'overview',
    cardLabel: 'Overview',
    roles: Object.freeze(['super_admin', 'admin', 'sales', 'marketing']),
    section: 'overview',
    description: 'Your role-aware Staff Control Center home.',
    exact: true
  }),
  Object.freeze({
    id: 'admin',
    label: 'Admin Overview',
    cardLabel: 'Administration',
    path: '/staff/admin',
    icon: 'admin',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Supervise platform operations and administration.',
    exact: true
  }),
  Object.freeze({
    id: 'trips',
    label: 'Trips',
    path: '/staff/admin/trips',
    icon: 'trips',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Manage catalog, departures, inventory, pricing and publishing.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_legacy',
    label: 'Existing Admin Tools',
    path: '/staff/admin/legacy',
    icon: 'admin_legacy',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Open administration modules awaiting native migration.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'sales',
    label: 'Sales Overview',
    cardLabel: 'Sales',
    path: '/staff/sales',
    icon: 'sales',
    roles: Object.freeze(['super_admin', 'admin', 'sales']),
    section: 'sales',
    description: 'Manage the shared travel consultation queue.',
    exact: true
  }),
  Object.freeze({
    id: 'expert_requests',
    label: 'Expert Requests',
    path: '/staff/sales/expert-requests',
    icon: 'expert_requests',
    roles: Object.freeze(['super_admin', 'admin', 'sales']),
    section: 'sales',
    description: 'Work the shared travel expert request queue.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'quotations',
    label: 'Quotations',
    path: '/staff/sales/quotations',
    icon: 'quotations',
    roles: Object.freeze(['super_admin', 'admin', 'sales']),
    section: 'sales',
    description: 'Create, send, and track traveler quotations.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'bookings',
    label: 'Bookings',
    path: '/staff/sales/bookings',
    icon: 'bookings',
    roles: Object.freeze(['super_admin', 'admin', 'sales']),
    section: 'sales',
    description: 'Track quotation-originated bookings and payment handoff.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'management',
    label: 'Management Workspace',
    cardLabel: 'Management',
    path: '/staff/management',
    icon: 'management',
    roles: Object.freeze(['super_admin', 'admin', 'marketing']),
    section: 'management',
    description: 'Prepare campaigns, promotions, content, and reporting.'
  })
]);
