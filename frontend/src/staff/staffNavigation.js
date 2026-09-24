export const STAFF_NAVIGATION_SECTIONS = Object.freeze({
  overview: Object.freeze({ id: 'overview', label: null }),
  administration: Object.freeze({ id: 'administration', label: 'Administration' }),
  operations: Object.freeze({ id: 'operations', label: 'Operations' }),
  sales: Object.freeze({ id: 'sales', label: 'Sales' }),
  marketing: Object.freeze({ id: 'marketing', label: 'Marketing' })
});

export const STAFF_MODULES = Object.freeze([
  Object.freeze({
    id: 'overview',
    label: 'Overview',
    path: '/staff',
    icon: 'overview',
    cardLabel: 'Overview',
    roles: Object.freeze(['super_admin', 'admin', 'operations', 'sales', 'marketing']),
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
    id: 'admin_team_analytics',
    label: 'Team Analytics',
    path: '/staff/admin/team-analytics',
    icon: 'admin_team_analytics',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Review factual Sales, Marketing, and Creator activity and outcomes.',
    navigationOnly: true
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
    id: 'admin_bookings',
    label: 'Bookings',
    path: '/staff/admin/bookings',
    icon: 'admin_bookings',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Inspect every booking, payment state, and commercial handoff.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_media',
    label: 'Media Library',
    path: '/staff/admin/media',
    icon: 'admin_media',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Manage the shared MongoDB and Cloudinary media catalog.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_pages',
    label: 'Pages',
    path: '/staff/admin/pages',
    icon: 'admin_pages',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Create and publish dynamic website pages.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_users',
    label: 'Users & Roles',
    path: '/staff/admin/users',
    icon: 'admin_users',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Manage customer, Staff, and creator identity access.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_creators',
    label: 'Creator Approvals',
    path: '/staff/admin/creators',
    icon: 'admin_creators',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Review and decide creator applications.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_payouts',
    label: 'Payouts',
    path: '/staff/admin/payouts',
    icon: 'admin_payouts',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Manage creator payout approval records.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'admin_discounts',
    label: 'Discounts',
    path: '/staff/admin/discounts',
    icon: 'admin_discounts',
    roles: Object.freeze(['super_admin', 'admin']),
    section: 'administration',
    description: 'Manage checkout coupon codes and validity rules.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'operations',
    label: 'Operations Overview',
    cardLabel: 'Operations',
    path: '/staff/operations',
    icon: 'operations',
    roles: Object.freeze(['super_admin', 'admin', 'operations']),
    section: 'operations',
    description: 'Monitor confirmed departures, readiness signals, travelers and operational attention.',
    exact: true
  }),
  Object.freeze({
    id: 'operations_trips',
    label: 'Trip Execution',
    path: '/staff/operations/trips',
    icon: 'operations_trips',
    roles: Object.freeze(['super_admin', 'admin', 'operations']),
    section: 'operations',
    description: 'Configure and confirm the real services required for each operational departure.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'operations_tasks',
    label: 'Tasks',
    path: '/staff/operations/tasks',
    icon: 'operations_tasks',
    roles: Object.freeze(['super_admin', 'admin', 'operations']),
    section: 'operations',
    description: 'Coordinate shared pre-trip and live journey work.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'operations_issues',
    label: 'Issues & Emergencies',
    path: '/staff/operations/issues',
    icon: 'operations_issues',
    roles: Object.freeze(['super_admin', 'admin', 'operations']),
    section: 'operations',
    description: 'Own operational problems, escalation, and resolution history.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'operations_vendors',
    label: 'Vendors',
    path: '/staff/operations/vendors',
    icon: 'operations_vendors',
    roles: Object.freeze(['super_admin', 'admin', 'operations']),
    section: 'operations',
    description: 'Maintain the reusable Hotel, Transport, Driver, Activity and Guide directory.',
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
    id: 'marketing',
    label: 'Marketing Overview',
    cardLabel: 'Marketing',
    path: '/staff/marketing',
    icon: 'marketing',
    roles: Object.freeze(['super_admin', 'admin', 'marketing']),
    section: 'marketing',
    description: 'Monitor campaigns, promotions, and operational marketing records.',
    exact: true
  }),
  Object.freeze({
    id: 'marketing_lead_analytics',
    label: 'Lead & Conversion Analytics',
    path: '/staff/marketing/lead-analytics',
    icon: 'marketing_lead_analytics',
    roles: Object.freeze(['super_admin', 'admin', 'marketing']),
    section: 'marketing',
    description: 'Measure first-touch acquisition through paid booking outcomes.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'marketing_campaigns',
    label: 'Campaigns',
    path: '/staff/marketing/campaigns',
    icon: 'marketing_campaigns',
    roles: Object.freeze(['super_admin', 'admin', 'marketing']),
    section: 'marketing',
    description: 'Plan and maintain campaign records.',
    navigationOnly: true
  }),
  Object.freeze({
    id: 'marketing_banners',
    label: 'Banners & Promotions',
    path: '/staff/marketing/banners',
    icon: 'marketing_banners',
    roles: Object.freeze(['super_admin', 'admin', 'marketing']),
    section: 'marketing',
    description: 'Schedule eligible website promotions.',
    navigationOnly: true
  })
]);
