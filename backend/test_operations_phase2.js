import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import OperationalTrip from './models/OperationalTrip.js';
import OperationalService from './models/OperationalService.js';
import Vendor from './models/Vendor.js';
import { ACTION_PERMISSIONS } from './middlewares/authMiddleware.js';
import {
  applyServiceConfirmation,
  applyServiceDecline,
  applyVendorAssignment,
  buildCustomQuotationServiceSeeds,
  deriveExecutionAttention,
  deriveExecutionReadiness,
  ensureOperationalTrip,
  sanitizeSourceHandoff,
  vendorSupportsAssignment
} from './services/operationsExecutionService.js';

const now = new Date('2026-10-10T08:00:00.000Z');
const actor = { id: new mongoose.Types.ObjectId(), name: 'Operations Lead' };
const baseGroup = {
  operationKey: 'custom:WLX-CUSTOM-1', type: 'CUSTOM', title: 'Kashmir Journey', destination: 'Kashmir',
  startDate: '2026-10-13T00:00:00.000Z', endDate: '2026-10-18T00:00:00.000Z', operationalPhase: 'UPCOMING',
  daysUntilStart: 3, bookingIds: ['WLX-CUSTOM-1'], bookingCount: 1, travelerCount: 2,
  attention: { required: false, severity: 'NONE', reasons: [] }
};
const customBooking = {
  bookingId: 'WLX-CUSTOM-1', tripId: 'custom-kashmir', isCustomQuotationBooking: true, numberOfTravelers: 2, occupancy: 'Double Sharing',
  quotationSnapshot: {
    selectedHotel: { optionId: 'hotel-1', hotelName: 'Pine View', city: 'Srinagar', roomType: 'Deluxe', rooms: 1, selected: true, costPerNight: 4000 },
    selectedTransport: [{ optionId: 'transport-1', title: 'Airport transfer', mode: 'CAB', provider: 'ABC Cabs', selected: true }],
    activities: [{ activityId: 'activity-1', name: 'Shikara ride', location: 'Dal Lake', selected: true, isIncluded: true }],
    addOns: [{ addonId: 'addon-1', name: 'Insurance', selected: true }]
  }
};

const fakeModels = () => {
  const trips = new Map();
  const services = new Map();
  return {
    trips,
    services,
    models: {
      OperationalTrip: {
        async findOneAndUpdate(filter, update) {
          if (!trips.has(filter.operationKey)) trips.set(filter.operationKey, { _id: new mongoose.Types.ObjectId(), ...update.$setOnInsert });
          return trips.get(filter.operationKey);
        }
      },
      OperationalService: {
        async bulkWrite(operations) {
          for (const operation of operations) {
            const { filter, update } = operation.updateOne;
            const key = `${filter.operationalTripId}:${filter.serviceKey}`;
            if (!services.has(key)) services.set(key, { _id: new mongoose.Types.ObjectId(), ...update.$setOnInsert });
          }
        },
        find(query) {
          return {
            sort() {
              return { lean: async () => [...services.values()].filter((service) => String(service.operationalTripId) === String(query.operationalTripId)) };
            }
          };
        }
      }
    }
  };
};

const readModelLoader = (groups, bookings) => async () => ({
  groups,
  bookings,
  tripLookups: { byId: new Map(), bySlug: new Map() },
  now
});

test('Phase 2 models expose only the justified identity and relationship indexes', () => {
  assert(OperationalTrip.schema.indexes().some(([fields, options]) => fields.operationKey === 1 && options.unique));
  assert(OperationalService.schema.indexes().some(([fields, options]) => fields.operationalTripId === 1 && fields.serviceKey === 1 && options.unique));
  assert(Vendor.schema.indexes().some(([fields, options]) => fields.vendorCode === 1 && options.unique));
});

test('Vendor requires a supported type and validates contact email', async () => {
  const invalid = new Vendor({ vendorCode: 'VND-TEST', name: 'Test Vendor', types: [], contact: { email: 'not-an-email' }, createdBy: actor.id, updatedBy: actor.id });
  await assert.rejects(() => invalid.validate());
  const valid = new Vendor({ vendorCode: 'VND-TEST-2', name: 'Test Hotel', types: ['HOTEL'], contact: { phone: '98765 43210' }, createdBy: actor.id, updatedBy: actor.id });
  await assert.doesNotReject(() => valid.validate());
});

test('custom quotation seeds factual Hotel, Transport and Activity services only', () => {
  const seeds = buildCustomQuotationServiceSeeds(structuredClone(customBooking), actor, now);
  assert.deepEqual(seeds.map((service) => service.serviceType), ['HOTEL', 'TRANSPORT', 'ACTIVITY']);
  assert.deepEqual(seeds.map((service) => service.confirmationStatus), ['UNASSIGNED', 'UNASSIGNED', 'UNASSIGNED']);
  assert(seeds.every((service) => service.vendorId === null));
  assert.equal(seeds.find((service) => service.serviceType === 'TRANSPORT').source.sourceProviderName, 'ABC Cabs');
  assert.equal(seeds.some((service) => service.title === 'Insurance'), false);
  const singleTransport = structuredClone(customBooking);
  singleTransport.quotationSnapshot.selectedTransport = singleTransport.quotationSnapshot.selectedTransport[0];
  assert.equal(buildCustomQuotationServiceSeeds(singleTransport, actor, now).filter((service) => service.serviceType === 'TRANSPORT').length, 1);
});

test('ensure materializes one custom OperationalTrip and seeds idempotently', async () => {
  const store = fakeModels();
  const input = { operationKey: baseGroup.operationKey, actor, now, readModelLoader: readModelLoader([baseGroup], [customBooking]), models: store.models };
  const first = await ensureOperationalTrip(input);
  const second = await ensureOperationalTrip(input);
  assert.equal(String(first.operationalTrip._id), String(second.operationalTrip._id));
  assert.equal(store.trips.size, 1);
  assert.equal(store.services.size, 3);
  assert.equal(second.services.length, 3);
});

test('catalog materialization keeps current Booking membership live', async () => {
  const store = fakeModels();
  const group = { ...baseGroup, operationKey: 'catalog:trip-1:batch-a', type: 'CATALOG', bookingIds: ['A', 'B', 'C'] };
  const bookings = ['A', 'B', 'C', 'D'].map((bookingId) => ({ bookingId, tripId: 'trip-1', batchId: 'batch-a', isCustomQuotationBooking: false }));
  const first = await ensureOperationalTrip({ operationKey: group.operationKey, actor, now, readModelLoader: readModelLoader([group], bookings), models: store.models });
  const joinedGroup = { ...group, bookingIds: ['A', 'B', 'C', 'D'], bookingCount: 4 };
  const second = await ensureOperationalTrip({ operationKey: group.operationKey, actor, now, readModelLoader: readModelLoader([joinedGroup], bookings), models: store.models });
  assert.equal(store.trips.size, 1);
  assert.equal(first.bookings.length, 3);
  assert.equal(second.bookings.length, 4);
  assert.equal(store.services.size, 0);
});

test('Vendor assignment enforces active matching types and resets stale confirmation', () => {
  const service = { serviceType: 'HOTEL', vendorId: 'old', confirmationStatus: 'CONFIRMED', confirmationNumber: 'OLD-1', history: [] };
  const hotel = { _id: 'new', vendorCode: 'VND-1', name: 'Hotel New', types: ['HOTEL'], status: 'ACTIVE', contact: { phone: '9999' } };
  assert.equal(vendorSupportsAssignment('HOTEL', hotel), true);
  assert.equal(vendorSupportsAssignment('TRANSPORT', hotel), false);
  assert.equal(vendorSupportsAssignment('HOTEL', { ...hotel, status: 'INACTIVE' }), false);
  applyVendorAssignment(service, hotel, actor, now);
  assert.equal(service.confirmationStatus, 'PENDING_CONFIRMATION');
  assert.equal(service.confirmationNumber, '');
  assert.equal(service.vendorSnapshot.name, 'Hotel New');
  assert.equal(service.history[0].action, 'VENDOR_CHANGED');
  service.confirmationStatus = 'CONFIRMED';
  service.confirmationNumber = 'NEW-1';
  service.confirmedAt = now;
  applyVendorAssignment(service, hotel, actor, new Date('2026-10-11T08:00:00.000Z'));
  assert.equal(service.confirmationStatus, 'PENDING_CONFIRMATION');
  assert.equal(service.confirmationNumber, '');
  assert.equal(service.confirmedAt, null);
  assert.throws(() => applyVendorAssignment({ serviceType: 'TRANSPORT', history: [] }, hotel, actor, now));
});

test('confirmation requires a Vendor and decline requires a reason', () => {
  assert.throws(() => applyServiceConfirmation({ confirmationStatus: 'UNASSIGNED', history: [] }, {}, actor, now));
  const assigned = { vendorId: 'vendor-1', confirmationStatus: 'PENDING_CONFIRMATION', history: [] };
  applyServiceConfirmation(assigned, { confirmationNumber: 'CNF-1' }, actor, now);
  assert.equal(assigned.confirmationStatus, 'CONFIRMED');
  assert.equal(assigned.confirmationNumber, 'CNF-1');
  assert.throws(() => applyServiceDecline({ vendorId: 'vendor-1', confirmationStatus: 'PENDING_CONFIRMATION', history: [] }, '', actor, now));
  const declined = { vendorId: 'vendor-1', confirmationStatus: 'PENDING_CONFIRMATION', history: [] };
  applyServiceDecline(declined, 'No rooms available', actor, now);
  assert.equal(declined.confirmationStatus, 'DECLINED');
  assert.equal(declined.declineReason, 'No rooms available');
});

test('execution readiness ignores optional pending work but blocks cancelled required work', () => {
  assert.equal(deriveExecutionReadiness([]).status, 'NOT_CONFIGURED');
  assert.equal(deriveExecutionReadiness([
    { required: true, confirmationStatus: 'CONFIRMED' },
    { required: true, confirmationStatus: 'CONFIRMED' },
    { required: true, confirmationStatus: 'PENDING_CONFIRMATION' }
  ]).status, 'IN_PROGRESS');
  assert.equal(deriveExecutionReadiness([
    { required: true, confirmationStatus: 'CONFIRMED' },
    { required: false, confirmationStatus: 'PENDING_CONFIRMATION' }
  ]).status, 'READY');
  const cancelled = deriveExecutionReadiness([{ required: true, confirmationStatus: 'CANCELLED' }]);
  assert.equal(cancelled.status, 'IN_PROGRESS');
  assert.equal(cancelled.cancelledRequiredServices, 1);
});

test('near-departure unresolved required services create real high-severity attention', () => {
  const reasons = deriveExecutionAttention([
    { required: true, serviceType: 'HOTEL', confirmationStatus: 'PENDING_CONFIRMATION' },
    { required: true, serviceType: 'TRANSPORT', confirmationStatus: 'UNASSIGNED' }
  ], baseGroup);
  assert(reasons.some((reason) => reason.code === 'SERVICE_CONFIRMATION_PENDING' && reason.serviceType === 'HOTEL' && reason.severity === 'HIGH'));
  assert(reasons.some((reason) => reason.code === 'REQUIRED_SERVICE_UNASSIGNED' && reason.serviceType === 'TRANSPORT'));
});

test('source handoff sanitization removes commercial internals without mutating the source', () => {
  const source = { ...structuredClone(customBooking.quotationSnapshot), signature: 'secret', nested: { totalCost: 9000, safe: 'kept' } };
  const before = structuredClone(source);
  const safe = sanitizeSourceHandoff(source);
  assert.equal(safe.signature, undefined);
  assert.equal(safe.selectedHotel.costPerNight, undefined);
  assert.equal(safe.nested.totalCost, undefined);
  assert.equal(safe.nested.safe, 'kept');
  assert.deepEqual(source, before);
});

test('Phase 2 permissions remain exclusive to Operations and administrators', () => {
  for (const permission of ['operations:view_trips', 'operations:manage_trips', 'operations:view_vendors', 'operations:manage_vendors', 'operations:manage_services']) {
    assert.deepEqual(ACTION_PERMISSIONS[permission], ['super_admin', 'admin', 'operations']);
    for (const role of ['sales', 'marketing', 'user', 'influencer']) assert.equal(ACTION_PERMISSIONS[permission].includes(role), false);
  }
});
