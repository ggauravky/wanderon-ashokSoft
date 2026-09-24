import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessStaffRoute,
  getActiveStaffModule,
  getStaffModuleById,
  getStaffRoleLabel,
  getVisibleStaffModules
} from './staffAccess.js';

const visibleLabels = (role) => getVisibleStaffModules(role).map((module) => module.label);

test('administrators see every department workspace', () => {
  const expected = ['Overview', 'Admin Overview', 'Team Analytics', 'Trips', 'Bookings', 'Media Library', 'Pages', 'Users & Roles', 'Creator Approvals', 'Payouts', 'Discounts', 'Operations Overview', 'Trip Execution', 'Vendors', 'Sales Overview', 'Expert Requests', 'Quotations', 'Bookings', 'Marketing Overview', 'Lead & Conversion Analytics', 'Campaigns', 'Banners & Promotions'];
  assert.deepEqual(visibleLabels('admin'), expected);
  assert.deepEqual(visibleLabels('super_admin'), expected);
});

test('sales sees only its department workspace', () => {
  assert.deepEqual(visibleLabels('sales'), ['Overview', 'Sales Overview', 'Expert Requests', 'Quotations', 'Bookings']);
  assert.equal(canAccessStaffRoute('sales', getStaffModuleById('admin')), false);
  assert.equal(canAccessStaffRoute('sales', getStaffModuleById('marketing')), false);
  assert.equal(canAccessStaffRoute('sales', getStaffModuleById('admin_team_analytics')), false);
});

test('marketing is presented as Marketing and sees only its workspace', () => {
  assert.deepEqual(visibleLabels('marketing'), ['Overview', 'Marketing Overview', 'Lead & Conversion Analytics', 'Campaigns', 'Banners & Promotions']);
  assert.equal(canAccessStaffRoute('marketing', getStaffModuleById('sales')), false);
  assert.equal(canAccessStaffRoute('marketing', getStaffModuleById('admin')), false);
  assert.equal(canAccessStaffRoute('marketing', getStaffModuleById('admin_team_analytics')), false);
  assert.equal(getStaffRoleLabel('marketing'), 'Marketing');
});

test('operations sees only the shared overview and Operations workspaces', () => {
  assert.deepEqual(visibleLabels('operations'), ['Overview', 'Operations Overview', 'Trip Execution', 'Vendors']);
  assert.equal(canAccessStaffRoute('operations', getStaffModuleById('operations')), true);
  assert.equal(canAccessStaffRoute('operations', getStaffModuleById('operations_trips')), true);
  assert.equal(canAccessStaffRoute('operations', getStaffModuleById('operations_vendors')), true);
  assert.equal(canAccessStaffRoute('operations', getStaffModuleById('admin')), false);
  assert.equal(canAccessStaffRoute('operations', getStaffModuleById('sales')), false);
  assert.equal(canAccessStaffRoute('operations', getStaffModuleById('marketing')), false);
});

test('customer and unknown roles receive no staff navigation', () => {
  assert.deepEqual(visibleLabels('user'), []);
  assert.deepEqual(visibleLabels('influencer'), []);
  assert.deepEqual(visibleLabels(''), []);
  assert.deepEqual(visibleLabels(undefined), []);
});

test('all department links stay inside the canonical staff application', () => {
  const workspacePaths = getVisibleStaffModules('admin')
    .filter((module) => module.id !== 'overview')
    .map((module) => module.path);

  assert.deepEqual(workspacePaths, ['/staff/admin', '/staff/admin/team-analytics', '/staff/admin/trips', '/staff/admin/bookings', '/staff/admin/media', '/staff/admin/pages', '/staff/admin/users', '/staff/admin/creators', '/staff/admin/payouts', '/staff/admin/discounts', '/staff/operations', '/staff/operations/trips', '/staff/operations/vendors', '/staff/sales', '/staff/sales/expert-requests', '/staff/sales/quotations', '/staff/sales/bookings', '/staff/marketing', '/staff/marketing/lead-analytics', '/staff/marketing/campaigns', '/staff/marketing/banners']);
});

test('role labels normalize existing backend values', () => {
  assert.equal(getStaffRoleLabel('super_admin'), 'Super Administrator');
  assert.equal(getStaffRoleLabel('ADMIN'), 'Administrator');
  assert.equal(getStaffRoleLabel('sales'), 'Sales Specialist');
  assert.equal(getStaffRoleLabel('marketing'), 'Marketing');
  assert.equal(getStaffRoleLabel('operations'), 'Operations');
  assert.equal(getStaffRoleLabel('user'), 'Staff Member');
});

test('nested staff routes select the most specific navigation module', () => {
  const modules = getVisibleStaffModules('admin');
  assert.equal(getActiveStaffModule(modules, '/staff/admin/trips/new')?.id, 'trips');
  assert.equal(getActiveStaffModule(modules, '/staff/sales/quotations/quote-1/edit')?.id, 'quotations');
  assert.equal(getActiveStaffModule(modules, '/staff/marketing/campaigns/new')?.id, 'marketing_campaigns');
  assert.equal(getActiveStaffModule(modules, '/staff/marketing/lead-analytics')?.id, 'marketing_lead_analytics');
  assert.equal(getActiveStaffModule(modules, '/staff/admin/team-analytics')?.id, 'admin_team_analytics');
  assert.equal(getActiveStaffModule(modules, '/staff/operations')?.id, 'operations');
  assert.equal(getActiveStaffModule(modules, '/staff/operations/trips/operation-1')?.id, 'operations_trips');
  assert.equal(getActiveStaffModule(modules, '/staff/operations/vendors/vendor-1/edit')?.id, 'operations_vendors');
  assert.equal(getActiveStaffModule(modules, '/staff/administer')?.id, undefined);
});
