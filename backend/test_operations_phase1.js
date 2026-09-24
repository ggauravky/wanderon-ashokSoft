import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildOperationalGroups,
  createTripLookups,
  deriveBookingAttention,
  deriveOperationalPhase,
  resolveBookingTravelWindow,
  summarizeOperationsDashboard
} from './services/operationsDashboardService.js';
import { ACTION_PERMISSIONS } from './middlewares/authMiddleware.js';
import { CREATABLE_STAFF_ROLES } from './controllers/adminController.js';
import { getOperationsDashboard } from './controllers/operationsController.js';
import { ALLOWED_STAFF_ROLES, validateStaffConfig } from './scripts/createStaffUser.js';

const now = new Date('2026-10-10T08:00:00.000Z');
const trip = {
  _id: 'trip-1', slug: 'spiti-valley', title: 'Spiti Valley', destination: 'Himachal Pradesh', location: 'Spiti', duration: '7D/6N',
  batches: [
    { _id: 'mongo-batch-a', batchId: 'batch-a', startDate: '2026-10-15', endDate: '2026-10-21', dates: '15 Oct - 21 Oct 2026' },
    { _id: 'mongo-batch-b', batchId: 'batch-b', startDate: '2026-11-15', endDate: '2026-11-21', dates: '15 Nov - 21 Nov 2026' }
  ]
};
const lookups = createTripLookups([trip]);

const booking = (overrides = {}) => ({
  bookingId: 'WLX-A', tripId: 'trip-1', batchId: 'batch-a', bookingStatus: 'CONFIRMED', paymentStatus: 'PAID',
  tripSnapshot: { title: 'Spiti Valley', destination: 'Himachal Pradesh', duration: '7D/6N', batchDate: '15 Oct - 21 Oct 2026', pickupPoint: 'Delhi' },
  customer: { name: 'Lead', email: 'lead@example.com', phone: '9999999999' }, travelers: [], numberOfTravelers: 1,
  pricing: { amountOutstanding: 0 }, isCustomQuotationBooking: false, createdAt: '2026-09-01', ...overrides
});

test('same catalog departure is grouped once with aggregate booking and traveler counts', () => {
  const groups = buildOperationalGroups([
    booking({ bookingId: 'WLX-A', numberOfTravelers: 2, travelers: [{ name: 'A2' }] }),
    booking({ bookingId: 'WLX-B', numberOfTravelers: 3, travelers: [{ name: 'B2' }, { name: 'B3' }] }),
    booking({ bookingId: 'WLX-C', numberOfTravelers: 1 })
  ], lookups, now);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].bookingCount, 3);
  assert.equal(groups[0].travelerCount, 6);
});

test('different catalog batches remain separate operational departures', () => {
  const groups = buildOperationalGroups([booking(), booking({ bookingId: 'WLX-B', batchId: 'batch-b', tripSnapshot: { ...booking().tripSnapshot, batchDate: '15 Nov - 21 Nov 2026' } })], lookups, now);
  assert.equal(groups.length, 2);
});

test('custom quotation bookings are never merged even when dates and destination match', () => {
  const custom = (id) => booking({ bookingId: id, tripId: `custom-${id}`, batchId: '', isCustomQuotationBooking: true, quotationSnapshot: { tripRequirements: { startDate: '2026-10-15', endDate: '2026-10-18' } } });
  const groups = buildOperationalGroups([custom('WLX-C1'), custom('WLX-C2')], lookups, now);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => group.operationKey).sort(), ['custom:WLX-C1', 'custom:WLX-C2']);
});

test('cancelled and pending-payment bookings do not enter operational grouping', () => {
  const groups = buildOperationalGroups([booking({ bookingStatus: 'CANCELLED' }), booking({ bookingId: 'WLX-P', bookingStatus: 'PENDING_PAYMENT', paymentStatus: 'UNPAID' })], lookups, now);
  assert.equal(groups.length, 0);
  assert.equal(summarizeOperationsDashboard([], lookups, { now, awaitingHandoff: 1 }).summary.awaitingHandoff, 1);
});

test('operational phase and starting-soon classification are deterministic', () => {
  assert.equal(deriveOperationalPhase({ startDate: '2026-10-20', endDate: '2026-10-25' }, now), 'UPCOMING');
  assert.equal(deriveOperationalPhase({ startDate: '2026-10-08', endDate: '2026-10-12' }, now), 'ONGOING');
  assert.equal(deriveOperationalPhase({ startDate: '2026-09-01', endDate: '2026-09-07' }, now), 'COMPLETED');
  assert.equal(deriveOperationalPhase({}, now), 'DATE_UNRESOLVED');
  const soon = buildOperationalGroups([booking()], lookups, now)[0];
  assert.equal(soon.daysUntilStart, 5);
  assert.equal(soon.startingSoon, true);
  const startsToday = booking({
    bookingId: 'WLX-TODAY',
    batchId: '',
    tripId: 'custom-today',
    isCustomQuotationBooking: true,
    quotationSnapshot: { tripRequirements: { startDate: '2026-10-10', endDate: '2026-10-12' } }
  });
  const todaySummary = summarizeOperationsDashboard([startsToday], lookups, { now });
  assert.equal(todaySummary.ongoing[0].startingSoon, true);
  assert.equal(todaySummary.summary.startingSoon, 1);
  const later = buildOperationalGroups([booking({ batchId: 'batch-b', tripSnapshot: { ...booking().tripSnapshot, batchDate: '15 Nov - 21 Nov 2026' } })], lookups, now)[0];
  assert.equal(later.startingSoon, false);
});

test('catalog bookings without a resolvable batch are kept separate', () => {
  const unresolved = (bookingId) => booking({
    bookingId,
    tripId: 'missing-trip',
    batchId: '',
    tripSnapshot: { title: 'Unknown departure', destination: 'Unknown', duration: '', batchDate: '', pickupPoint: '' }
  });
  const groups = buildOperationalGroups([unresolved('WLX-U1'), unresolved('WLX-U2')], createTripLookups([]), now);
  assert.equal(groups.length, 2);
  assert.deepEqual(groups.map((group) => group.operationKey).sort(), [
    'catalog:missing-trip:booking-wlx-u1',
    'catalog:missing-trip:booking-wlx-u2'
  ]);
});

test('attention uses only facts available in Phase 1', () => {
  const overdue = booking({ paymentStatus: 'PARTIALLY_PAID', pricing: { amountOutstanding: 5000, balanceDueDate: '2026-10-09' } });
  const window = resolveBookingTravelWindow(overdue, lookups);
  const result = deriveBookingAttention(overdue, window, now);
  const codes = result.reasons.map((reason) => reason.code);
  assert(codes.includes('BALANCE_OVERDUE'));
  assert(codes.includes('BALANCE_PENDING_NEAR_DEPARTURE'));
  assert.equal(codes.some((code) => ['HOTEL_NOT_CONFIRMED', 'DRIVER_NOT_ASSIGNED', 'VENDOR_NOT_CONFIRMED'].includes(code)), false);
});

test('operations dashboard permission is limited to administrators and operations', () => {
  assert.deepEqual(ACTION_PERMISSIONS['operations:view_dashboard'], ['super_admin', 'admin', 'operations']);
  for (const role of ['sales', 'marketing', 'user', 'influencer']) assert.equal(ACTION_PERMISSIONS['operations:view_dashboard'].includes(role), false);
});

test('operations dashboard returns a controlled 503 when MongoDB is unavailable', async () => {
  const response = {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(payload) { this.body = payload; return this; }
  };
  await getOperationsDashboard({}, response);
  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { success: false, message: 'Operations dashboard is temporarily unavailable.' });
});

test('operations staff provisioning is accepted by both creation paths', () => {
  assert(CREATABLE_STAFF_ROLES.includes('operations'));
  assert(ALLOWED_STAFF_ROLES.has('operations'));
  assert.doesNotThrow(() => validateStaffConfig({ name: 'Ops', email: 'ops@example.com', password: 'safe-password', role: 'operations' }));
});
