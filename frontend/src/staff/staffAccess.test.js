import assert from 'node:assert/strict';
import test from 'node:test';
import {
  canAccessStaffRoute,
  getStaffModuleById,
  getStaffRoleLabel,
  getVisibleStaffModules
} from './staffAccess.js';

const visibleLabels = (role) => getVisibleStaffModules(role).map((module) => module.label);

test('administrators see every department workspace', () => {
  const expected = ['Overview', 'Admin Overview', 'Trips', 'Bookings', 'Media Library', 'Pages', 'Users & Roles', 'Creator Approvals', 'Payouts', 'Discounts', 'Sales Overview', 'Expert Requests', 'Quotations', 'Bookings', 'Management Workspace'];
  assert.deepEqual(visibleLabels('admin'), expected);
  assert.deepEqual(visibleLabels('super_admin'), expected);
});

test('sales sees only its department workspace', () => {
  assert.deepEqual(visibleLabels('sales'), ['Overview', 'Sales Overview', 'Expert Requests', 'Quotations', 'Bookings']);
  assert.equal(canAccessStaffRoute('sales', getStaffModuleById('admin')), false);
  assert.equal(canAccessStaffRoute('sales', getStaffModuleById('management')), false);
});

test('marketing is presented as Management and sees only its workspace', () => {
  assert.deepEqual(visibleLabels('marketing'), ['Overview', 'Management Workspace']);
  assert.equal(canAccessStaffRoute('marketing', getStaffModuleById('sales')), false);
  assert.equal(canAccessStaffRoute('marketing', getStaffModuleById('admin')), false);
  assert.equal(getStaffRoleLabel('marketing'), 'Management');
});

test('customer and unknown roles receive no staff navigation', () => {
  assert.deepEqual(visibleLabels('user'), []);
  assert.deepEqual(visibleLabels('influencer'), []);
  assert.deepEqual(visibleLabels('operations'), []);
  assert.deepEqual(visibleLabels(''), []);
  assert.deepEqual(visibleLabels(undefined), []);
});

test('all department links stay inside the canonical staff application', () => {
  const workspacePaths = getVisibleStaffModules('admin')
    .filter((module) => module.id !== 'overview')
    .map((module) => module.path);

  assert.deepEqual(workspacePaths, ['/staff/admin', '/staff/admin/trips', '/staff/admin/bookings', '/staff/admin/media', '/staff/admin/pages', '/staff/admin/users', '/staff/admin/creators', '/staff/admin/payouts', '/staff/admin/discounts', '/staff/sales', '/staff/sales/expert-requests', '/staff/sales/quotations', '/staff/sales/bookings', '/staff/management']);
});

test('role labels normalize existing backend values', () => {
  assert.equal(getStaffRoleLabel('super_admin'), 'Super Administrator');
  assert.equal(getStaffRoleLabel('ADMIN'), 'Administrator');
  assert.equal(getStaffRoleLabel('sales'), 'Sales Specialist');
  assert.equal(getStaffRoleLabel('marketing'), 'Management');
  assert.equal(getStaffRoleLabel('user'), 'Staff Member');
});
