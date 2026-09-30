import test from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import OperationalTrip from './models/OperationalTrip.js';
import OperationalService from './models/OperationalService.js';
import {
  buildCustomQuotationServiceSeeds,
  deriveExecutionReadiness,
  ensureOperationalTrip,
  OperationsDomainError
} from './services/operationsExecutionService.js';
import {
  buildOperationalGroups,
  createTripLookups
} from './services/operationsDashboardService.js';
import { resolveOperationalGroup } from './services/operationsReadModelService.js';

const now = new Date('2026-10-10T08:00:00.000Z');
const actor = { id: new mongoose.Types.ObjectId(), name: 'Operations Lead' };

const fakeModels = () => {
  const trips = new Map();
  const services = new Map();
  return {
    trips,
    services,
    models: {
      OperationalTrip: {
        async findOneAndUpdate(filter, update) {
          if (!trips.has(filter.operationKey)) {
            trips.set(filter.operationKey, {
              _id: new mongoose.Types.ObjectId(),
              operationKey: filter.operationKey,
              ...update.$setOnInsert
            });
          }
          return trips.get(filter.operationKey);
        },
        async findById(id) {
          return [...trips.values()].find((t) => String(t._id) === String(id)) || null;
        }
      },
      OperationalService: {
        async bulkWrite(operations) {
          for (const operation of operations) {
            const { filter, update } = operation.updateOne;
            const key = `${filter.operationalTripId}:${filter.serviceKey}`;
            if (!services.has(key)) {
              services.set(key, {
                _id: new mongoose.Types.ObjectId(),
                operationalTripId: filter.operationalTripId,
                serviceKey: filter.serviceKey,
                ...update.$setOnInsert
              });
            }
          }
        },
        find(query) {
          return {
            sort() {
              return {
                lean: async () => [...services.values()].filter(
                  (service) => String(service.operationalTripId) === String(query.operationalTripId)
                )
              };
            }
          };
        }
      }
    }
  };
};

// Fixture 1: Custom booking
const customBooking = {
  _id: new mongoose.Types.ObjectId(),
  bookingId: 'WLX-CUSTOM-REGRESSION-01',
  tripId: 'custom-kashmir',
  bookingStatus: 'CONFIRMED',
  paymentStatus: 'PAID',
  isCustomQuotationBooking: true,
  numberOfTravelers: 2,
  occupancy: 'Double Sharing',
  customer: { name: 'Lead Traveler', email: 'lead@example.com', phone: '9999999999' },
  tripSnapshot: { title: 'Custom Kashmir Alpine', destination: 'Srinagar, Gulmarg', duration: '5D/4N' },
  pricing: { amountOutstanding: 0 },
  quotationSnapshot: {
    tripRequirements: { startDate: '2026-10-14', endDate: '2026-10-18', duration: '5D/4N' },
    selectedHotel: { optionId: 'hotel-opt-1', hotelName: 'Grand Residency', city: 'Srinagar', roomType: 'Deluxe', rooms: 1, selected: true },
    selectedTransport: [{ optionId: 'trans-opt-1', title: 'AC Innova', mode: 'CAB', provider: 'Himalayan Cabs', selected: true }],
    activities: [{ activityId: 'act-opt-1', name: 'Dal Lake Shikara', location: 'Srinagar', selected: true, isIncluded: true }]
  }
};

// Fixture 2: Catalog booking
const catalogTrip = {
  _id: new mongoose.Types.ObjectId(),
  slug: 'spiti-valley-circuit',
  title: 'Spiti Valley Circuit',
  destination: 'Himachal Pradesh',
  location: 'Spiti',
  duration: '7D/6N',
  batches: [
    { _id: new mongoose.Types.ObjectId(), batchId: 'batch-spiti-01', startDate: '2026-10-15', endDate: '2026-10-21', dates: '15 Oct - 21 Oct 2026' }
  ]
};

const catalogBooking = {
  _id: new mongoose.Types.ObjectId(),
  bookingId: 'WLX-CATALOG-REGRESSION-01',
  tripId: String(catalogTrip._id),
  batchId: 'batch-spiti-01',
  bookingStatus: 'CONFIRMED',
  paymentStatus: 'PAID',
  isCustomQuotationBooking: false,
  numberOfTravelers: 4,
  customer: { name: 'Catalog Lead', email: 'cat@example.com', phone: '8888888888' },
  tripSnapshot: { title: 'Spiti Valley Circuit', destination: 'Himachal Pradesh', duration: '7D/6N', batchDate: '15 Oct - 21 Oct 2026' },
  pricing: { amountOutstanding: 0 }
};

const lookups = createTripLookups([catalogTrip]);

test('REGRESSION: ensure — custom booking returns successful OperationalTrip with seeded services', async () => {
  const { models } = fakeModels();
  const groups = buildOperationalGroups([customBooking], lookups, now);
  assert.equal(groups.length, 1);
  const targetGroup = groups[0];

  const result = await ensureOperationalTrip({
    operationKey: targetGroup.operationKey,
    actor,
    now,
    readModelLoader: async () => ({ groups: [targetGroup], bookings: [customBooking], tripLookups: lookups, now }),
    models
  });

  assert(result.operationalTrip);
  assert.equal(result.operationalTrip.operationKey, targetGroup.operationKey);
  assert.equal(result.operationalTrip.sourceType, 'CUSTOM');
  assert.equal(result.services.length, 3);
  assert.equal(result.readiness.status, 'IN_PROGRESS');
  assert.equal(result.readiness.requiredServices, 3);
  assert.equal(result.readiness.unassignedRequiredServices, 3);
});

test('REGRESSION: ensure — catalog booking returns successful OperationalTrip with NOT_CONFIGURED readiness without failing', async () => {
  const { models } = fakeModels();
  const groups = buildOperationalGroups([catalogBooking], lookups, now);
  assert.equal(groups.length, 1);
  const targetGroup = groups[0];

  const result = await ensureOperationalTrip({
    operationKey: targetGroup.operationKey,
    actor,
    now,
    readModelLoader: async () => ({ groups: [targetGroup], bookings: [catalogBooking], tripLookups: lookups, now }),
    models
  });

  assert(result.operationalTrip);
  assert.equal(result.operationalTrip.operationKey, targetGroup.operationKey);
  assert.equal(result.operationalTrip.sourceType, 'CATALOG');
  assert.equal(result.services.length, 0);
  assert.equal(result.readiness.status, 'NOT_CONFIGURED');
  assert.equal(result.readiness.totalServices, 0);
});

test('REGRESSION: idempotency — calling ensure multiple times returns same OperationalTrip and zero duplicate services', async () => {
  const { models } = fakeModels();
  const groups = buildOperationalGroups([customBooking], lookups, now);
  const targetGroup = groups[0];
  const loader = async () => ({ groups: [targetGroup], bookings: [customBooking], tripLookups: lookups, now });

  const first = await ensureOperationalTrip({ operationKey: targetGroup.operationKey, actor, now, readModelLoader: loader, models });
  const second = await ensureOperationalTrip({ operationKey: targetGroup.operationKey, actor, now, readModelLoader: loader, models });

  assert.equal(String(first.operationalTrip._id), String(second.operationalTrip._id));
  assert.equal(first.services.length, 3);
  assert.equal(second.services.length, 3);
});

test('REGRESSION: list -> ensure invariant — every eligible group generated by list logic resolves through ensure', async () => {
  const { models } = fakeModels();
  const eligibleBookings = [customBooking, catalogBooking];
  const groups = buildOperationalGroups(eligibleBookings, lookups, now);
  assert.equal(groups.length, 2);

  const loader = async () => ({ groups, bookings: eligibleBookings, tripLookups: lookups, now });

  for (const group of groups) {
    const result = await ensureOperationalTrip({
      operationKey: group.operationKey,
      actor,
      now,
      readModelLoader: loader,
      models
    });
    assert(result.operationalTrip, `Group ${group.operationKey} failed to materialize`);
    assert.equal(result.operationalTrip.operationKey, group.operationKey);
  }
});

test('REGRESSION: stale/ineligible source returns 404 OPERATION_NOT_FOUND rather than 500', async () => {
  const { models } = fakeModels();
  const loader = async () => ({ groups: [], bookings: [], tripLookups: lookups, now });

  await assert.rejects(
    () => ensureOperationalTrip({ operationKey: 'custom:NON-EXISTENT', actor, now, readModelLoader: loader, models }),
    (err) => {
      assert(err instanceof OperationsDomainError);
      assert.equal(err.status, 404);
      assert.equal(err.code, 'OPERATION_NOT_FOUND');
      return true;
    }
  );
});

test('REGRESSION: legacy/non-ObjectId tripId does not cause CastError in sourceForGroup', async () => {
  const { models } = fakeModels();
  const legacyBooking = {
    ...catalogBooking,
    bookingId: 'WLX-LEGACY-01',
    tripId: 'non-object-id-slug'
  };
  const legacyTrip = {
    _id: 'string-id-from-legacy-stub',
    slug: 'non-object-id-slug',
    title: 'Legacy Trip',
    duration: '5D/4N',
    batches: [{ batchId: 'b-1', dates: '10 Oct - 15 Oct 2026' }]
  };
  const legacyLookups = createTripLookups([legacyTrip]);
  const groups = buildOperationalGroups([legacyBooking], legacyLookups, now);
  const targetGroup = groups[0];

  const result = await ensureOperationalTrip({
    operationKey: targetGroup.operationKey,
    actor,
    now,
    readModelLoader: async () => ({ groups: [targetGroup], bookings: [legacyBooking], tripLookups: legacyLookups, now }),
    models
  });

  assert(result.operationalTrip);
  // tripMongoId must be null safely rather than throwing CastError
  assert.equal(result.operationalTrip.source.tripMongoId, null);
});

test('REGRESSION: DETAIL_FIELDS does not project subfield and parent path collision', async () => {
  const fileContent = (await import('fs')).readFileSync(
    new URL('./services/operationsReadModelService.js', import.meta.url),
    'utf8'
  );
  // DETAIL_FIELDS must not append quotationSnapshot onto SUMMARY_FIELDS that already has quotationSnapshot.tripRequirements
  assert(!fileContent.includes('${SUMMARY_FIELDS} quotationSnapshot'), 'DETAIL_FIELDS must not cause Mongo 31250 path collision');
});
