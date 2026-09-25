import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import OperationalFeedback from './models/OperationalFeedback.js';
import { ACTION_PERMISSIONS } from './middlewares/authMiddleware.js';
import { deriveClosureReadiness, validateOutstandingAcknowledgement } from './services/operationsClosureService.js';
import {
  assertDraftCostEditable, calculateOperationalCostTotal, deriveSettlementState,
  enrichCostsWithSettlements, summarizeOperationalFinancials, summarizeVendors, validateSettlementAmount
} from './services/operationsFinanceService.js';
import { normalizeFeedbackRating, summarizeFeedback } from './services/operationsFeedbackService.js';
import { buildOperationsReport, OPERATIONS_REPORT_DEFINITIONS } from './services/operationsReportService.js';
import { validateBookingInContext } from './services/operationsContextService.js';

const id = () => new mongoose.Types.ObjectId();
const baseReadiness = (overrides = {}) => ({
  group: { endDate: '2026-09-01T00:00:00.000Z' }, services: [], tasks: [], incidents: [], costs: [], settlements: [], feedback: [], bookings: [], now: new Date('2026-09-25T00:00:00.000Z'), ...overrides
});

test('server calculates cost total including negative adjustment', () => {
  assert.deepEqual(calculateOperationalCostTotal({ subtotal: 40000, taxAmount: 5000, adjustmentAmount: -2000 }), { subtotal: 40000, taxAmount: 5000, adjustmentAmount: -2000, totalAmount: 43000 });
  assert.throws(() => calculateOperationalCostTotal({ subtotal: 10, adjustmentAmount: -20 }), /outside the supported range/);
});

test('only Draft costs are editable', () => {
  assert.equal(assertDraftCostEditable({ status: 'DRAFT' }), true);
  assert.throws(() => assertDraftCostEditable({ status: 'FINALIZED' }), /Only Draft/);
});

test('settlement lifecycle derives unpaid, partial and paid without double counting cost', () => {
  assert.deepEqual(deriveSettlementState(50000, 0), { paidAmount: 0, outstandingAmount: 50000, paymentState: 'UNPAID' });
  assert.deepEqual(deriveSettlementState(50000, 20000), { paidAmount: 20000, outstandingAmount: 30000, paymentState: 'PARTIALLY_PAID' });
  assert.deepEqual(deriveSettlementState(50000, 50000), { paidAmount: 50000, outstandingAmount: 0, paymentState: 'PAID' });
  assert.throws(() => validateSettlementAmount(31000, 30000), /exceeds/);
});

test('void settlements stop counting toward paid balance', () => {
  const costId = id(); const rows = enrichCostsWithSettlements([{ _id: costId, totalAmount: 50000, status: 'FINALIZED' }], [{ operationalCostId: costId, amount: 50000, status: 'VOID' }]);
  assert.equal(rows[0].settlement.paidAmount, 0); assert.equal(rows[0].settlement.outstandingAmount, 50000);
});

test('financial summary uses finalized costs once and keeps settlements separate', () => {
  const costId = id(); const summary = summarizeOperationalFinancials({
    bookings: [{ pricing: { finalAmount: 100000, amountPaid: 80000 } }],
    costs: [{ _id: costId, totalAmount: 60000, status: 'FINALIZED', dueDate: null }, { _id: id(), totalAmount: 10000, status: 'DRAFT' }],
    settlements: [{ operationalCostId: costId, amount: 20000, status: 'RECORDED' }, { operationalCostId: costId, amount: 30000, status: 'RECORDED' }]
  });
  assert.equal(summary.bookedRevenue, 100000); assert.equal(summary.collectedRevenue, 80000); assert.equal(summary.finalizedCost, 60000); assert.equal(summary.vendorPaid, 50000); assert.equal(summary.vendorOutstanding, 10000); assert.equal(summary.grossOperationalContribution, 40000); assert.equal(summary.financialCompleteness, 'INCOMPLETE');
});

test('feedback rating accepts 1-5 and null only', () => {
  assert.equal(normalizeFeedbackRating(1), 1); assert.equal(normalizeFeedbackRating(5), 5); assert.equal(normalizeFeedbackRating(null), null);
  assert.throws(() => normalizeFeedbackRating(0), /1 to 5/); assert.throws(() => normalizeFeedbackRating(6), /1 to 5/);
});

test('average rating excludes unrated feedback', () => {
  const summary = summarizeFeedback([{ rating: 5 }, { rating: 4 }, { rating: null }], 5);
  assert.equal(summary.averageRating, 4.5); assert.equal(summary.ratedFeedback, 2); assert.equal(summary.coveragePercent, 60);
});

test('feedback model enforces unique trip and Booking identity and nullable rating', () => {
  const indexes = OperationalFeedback.schema.indexes();
  assert.ok(indexes.some(([keys, options]) => keys.operationalTripId === 1 && keys.bookingId === 1 && options.unique));
  const record = new OperationalFeedback({ operationalTripId: id(), contextSnapshot: { operationKey: 'custom:x', sourceType: 'CUSTOM', title: 'Trip' }, bookingId: id(), customerSnapshot: { name: 'Guest', bookingId: 'WLX-1' }, rating: null, sourceChannel: 'PHONE', receivedAt: new Date(), recordedBy: id(), updatedBy: id() });
  assert.equal(record.validateSync(), undefined);
});

test('feedback Booking must belong to operational context', () => {
  const booking = { _id: id(), bookingId: 'WLX-1' };
  assert.equal(validateBookingInContext(booking._id, [booking], { required: true }), booking);
  assert.throws(() => validateBookingInContext(id(), [booking], { required: true }), /does not belong/);
});

test('closure is blocked by active tasks, incidents, or Draft costs', () => {
  assert.equal(deriveClosureReadiness(baseReadiness({ tasks: [{ status: 'TODO' }] })).status, 'NOT_READY');
  assert.equal(deriveClosureReadiness(baseReadiness({ incidents: [{ status: 'OPEN' }] })).status, 'NOT_READY');
  assert.equal(deriveClosureReadiness(baseReadiness({ costs: [{ _id: id(), status: 'DRAFT', totalAmount: 1000 }] })).status, 'NOT_READY');
});

test('feedback is optional for closure', () => {
  const readiness = deriveClosureReadiness(baseReadiness({ bookings: [{ pricing: {} }] }));
  assert.equal(readiness.status, 'READY'); assert.equal(readiness.feedbackSummary.feedbackRecords, 0);
});

test('outstanding Vendor balance requires acknowledgement and meaningful note', () => {
  const costId = id(); const readiness = deriveClosureReadiness(baseReadiness({ costs: [{ _id: costId, status: 'FINALIZED', totalAmount: 50000 }], settlements: [{ operationalCostId: costId, status: 'RECORDED', amount: 30000 }] }));
  assert.equal(readiness.status, 'READY'); assert.equal(readiness.financialSummary.vendorOutstanding, 20000);
  assert.throws(() => validateOutstandingAcknowledgement(readiness, {}), /Acknowledge/);
  assert.equal(validateOutstandingAcknowledgement(readiness, { acknowledgeOutstandingSettlements: true, outstandingSettlementNote: 'Final Hotel balance scheduled for 28 September.' }), 'Final Hotel balance scheduled for 28 September.');
});

test('closed readiness remains closed and reads historical snapshot', () => {
  const readiness = deriveClosureReadiness(baseReadiness({ closure: { closureStatus: 'CLOSED', exceptions: [], finalSnapshot: { financialSummary: { finalizedCost: 50000 } } } }));
  assert.equal(readiness.status, 'CLOSED'); assert.equal(readiness.financialSummary.finalizedCost, 50000);
});

test('reopen permission is Admin-only while Operations may close', () => {
  assert.ok(ACTION_PERMISSIONS['operations:close_trip'].includes('operations'));
  assert.ok(!ACTION_PERMISSIONS['operations:reopen_trip'].includes('operations'));
  assert.ok(ACTION_PERMISSIONS['operations:reopen_trip'].includes('admin'));
});

test('Vendor report counts services, trips, finalized cost, paid and outstanding', () => {
  const vendorId = id(); const tripA = id(); const tripB = id(); const costA = id(); const costB = id();
  const rows = summarizeVendors([
    { _id: costA, vendorId, operationalTripId: tripA, status: 'FINALIZED', totalAmount: 30000, vendorSnapshot: { name: 'Hotel Co' } },
    { _id: costB, vendorId, operationalTripId: tripB, status: 'FINALIZED', totalAmount: 20000, vendorSnapshot: { name: 'Hotel Co' } }
  ], [{ operationalCostId: costA, status: 'RECORDED', amount: 10000 }], [{ vendorId }, { vendorId }]);
  assert.equal(rows[0].trips, 2); assert.equal(rows[0].services, 2); assert.equal(rows[0].finalizedCost, 50000); assert.equal(rows[0].paid, 10000); assert.equal(rows[0].outstanding, 40000);
});

test('report documents date bases and excludes void costs', () => {
  const report = buildOperationsReport({ groups: [], trips: [], bookings: [], costs: [{ _id: id(), status: 'VOID', category: 'HOTEL', totalAmount: 999 }], settlements: [] });
  assert.equal(report.financial.finalizedCost, 0); assert.equal(report.definitions, OPERATIONS_REPORT_DEFINITIONS); assert.match(report.definitions.financialCostBasis, /incurredAt/);
});
