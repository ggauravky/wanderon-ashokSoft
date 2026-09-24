import crypto from 'crypto';
import OperationalTrip from '../models/OperationalTrip.js';
import OperationalService from '../models/OperationalService.js';
import Vendor from '../models/Vendor.js';
import {
  bookingsForOperationalGroup,
  loadOperationalReadModel,
  resolveOperationalGroup,
  tripForBooking
} from './operationsReadModelService.js';

const CONFIRMED = 'CONFIRMED';
const STATUS_REASON = Object.freeze({
  UNASSIGNED: ['REQUIRED_SERVICE_UNASSIGNED', 'Required service has no assigned Vendor'],
  PENDING_CONFIRMATION: ['SERVICE_CONFIRMATION_PENDING', 'Vendor confirmation is pending'],
  DECLINED: ['SERVICE_DECLINED', 'Vendor declined a required service'],
  CANCELLED: ['REQUIRED_SERVICE_CANCELLED', 'Required service was cancelled and needs replacement']
});

export class OperationsDomainError extends Error {
  constructor(status, message, code = 'OPERATIONS_ERROR') {
    super(message);
    this.name = 'OperationsDomainError';
    this.status = status;
    this.code = code;
  }
}

const plain = (value) => value?.toObject ? value.toObject() : value;
const cleanText = (value) => String(value || '').trim();
const safeDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const compactKey = (value) => cleanText(value).toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
const contentKey = (type, index, value) => crypto
  .createHash('sha256')
  .update(JSON.stringify([type, index, value?.title, value?.name, value?.hotelName, value?.startDate, value?.date]))
  .digest('hex')
  .slice(0, 12);
const stableServiceKey = (type, item, index) => {
  const identity = item?.optionId || item?.activityId || item?.sectionId || item?.segmentId || contentKey(type, index, item);
  return `${type.toLowerCase()}:${compactKey(identity)}`;
};
const asArray = (value) => Array.isArray(value) ? value : (value ? [value] : []);
const selected = (items) => asArray(items).filter((item) => item && item.selected !== false);
const createdHistory = (actor, now) => [{
  action: 'CREATED', fromStatus: null, toStatus: 'UNASSIGNED', note: 'Seeded from immutable quotation handoff.',
  actorId: actor.id, actorName: actor.name, at: now
}];

export const buildCustomQuotationServiceSeeds = (booking, actor, now = new Date()) => {
  const snapshot = plain(booking?.quotationSnapshot) || {};
  const hotelItems = snapshot.selectedHotel
    ? asArray(snapshot.selectedHotel)
    : selected(snapshot.hotelOptions);
  const selectedTransport = asArray(snapshot.selectedTransport);
  const transportItems = selected(selectedTransport.length ? selectedTransport : snapshot.transportOptions);
  const activityItems = selected(snapshot.activities).filter((item) => item.isIncluded !== false);
  const base = {
    operationalTripId: null,
    confirmationStatus: 'UNASSIGNED',
    vendorId: null,
    required: true,
    createdBy: actor.id,
    updatedBy: actor.id,
    history: createdHistory(actor, now)
  };

  const hotels = hotelItems.map((item, index) => ({
    ...base,
    serviceKey: stableServiceKey('HOTEL', item, index),
    serviceType: 'HOTEL',
    source: { type: 'QUOTATION', sectionId: item.optionId || item.segmentId || '', sectionType: 'HOTEL', bookingId: booking.bookingId },
    title: item.hotelName || item.label || `Stay ${index + 1}`,
    hotelDetails: {
      hotelName: item.hotelName || '', city: item.city || item.location || '', address: item.address || '', roomType: item.roomType || '',
      rooms: item.rooms ?? null, occupancy: item.occupancy || booking.occupancy || '', mealPlan: item.mealPlan || '',
      checkIn: safeDate(item.checkIn), checkOut: safeDate(item.checkOut), nights: item.nights ?? null
    }
  }));

  const transports = transportItems.map((item, index) => ({
    ...base,
    serviceKey: stableServiceKey('TRANSPORT', item, index),
    serviceType: 'TRANSPORT',
    source: {
      type: 'QUOTATION', sectionId: item.optionId || '', sectionType: 'TRANSPORT', bookingId: booking.bookingId,
      sourceProviderName: item.provider || ''
    },
    title: item.title || item.vehicle || item.type || item.mode || `Transport ${index + 1}`,
    bookingReference: item.reference?.bookingReference || '',
    transportDetails: {
      mode: item.mode || '', vehicleType: item.vehicle || item.type || '', vehicleNumber: item.reference?.vehicleNumber || '',
      capacity: item.capacity ?? null,
      route: {
        from: item.route?.from || item.pickup || '', to: item.route?.to || item.drop || '',
        pickupPoint: item.route?.pickupPoint || item.pickup || '', dropPoint: item.route?.dropPoint || item.drop || ''
      },
      departureDate: safeDate(item.schedule?.departureDate || item.startDate), departureTime: item.schedule?.departureTime || '',
      arrivalDate: safeDate(item.schedule?.arrivalDate || item.endDate), arrivalTime: item.schedule?.arrivalTime || '',
      driverSnapshot: {
        name: item.driverDetails?.name || '', phone: item.driverDetails?.phone || '', licenseNumber: item.driverDetails?.licenseNumber || ''
      }
    }
  }));

  const activities = activityItems.map((item, index) => ({
    ...base,
    serviceKey: stableServiceKey('ACTIVITY', item, index),
    serviceType: 'ACTIVITY',
    source: { type: 'QUOTATION', sectionId: item.activityId || '', sectionType: 'ACTIVITY', bookingId: booking.bookingId },
    title: item.name || `Activity ${index + 1}`,
    required: item.isOptional !== true,
    activityDetails: {
      activityName: item.name || '', location: item.location || '', date: safeDate(item.date),
      travelerCount: item.quantity ?? booking.numberOfTravelers ?? null, dayNumber: item.dayNumber ?? null
    }
  }));

  return [...hotels, ...transports, ...activities];
};

export const deriveExecutionReadiness = (services = []) => {
  const activeServices = services.filter((service) => service.confirmationStatus !== 'CANCELLED' || service.required);
  if (!activeServices.length) {
    return {
      status: 'NOT_CONFIGURED', totalServices: 0, requiredServices: 0, confirmedRequiredServices: 0,
      pendingRequiredServices: 0, unassignedRequiredServices: 0, declinedRequiredServices: 0, cancelledRequiredServices: 0
    };
  }
  const required = services.filter((service) => service.required);
  const count = (status) => required.filter((service) => service.confirmationStatus === status).length;
  const confirmedRequiredServices = count(CONFIRMED);
  return {
    status: required.length === confirmedRequiredServices ? 'READY' : 'IN_PROGRESS',
    totalServices: services.length,
    requiredServices: required.length,
    confirmedRequiredServices,
    pendingRequiredServices: count('PENDING_CONFIRMATION'),
    unassignedRequiredServices: count('UNASSIGNED'),
    declinedRequiredServices: count('DECLINED'),
    cancelledRequiredServices: count('CANCELLED')
  };
};

export const deriveExecutionAttention = (services = [], group = {}) => {
  const severity = group.operationalPhase === 'ONGOING'
    || (Number.isFinite(group.daysUntilStart) && group.daysUntilStart >= 0 && group.daysUntilStart <= 7)
    ? 'HIGH'
    : 'MEDIUM';
  const counts = new Map();
  for (const service of services.filter((item) => item.required && item.confirmationStatus !== CONFIRMED)) {
    const definition = STATUS_REASON[service.confirmationStatus];
    if (!definition) continue;
    const [code, label] = definition;
    const key = `${code}:${service.serviceType}`;
    const current = counts.get(key) || { code, label, serviceType: service.serviceType, severity, count: 0 };
    current.count += 1;
    counts.set(key, current);
  }
  return [...counts.values()];
};

const severityRank = { HIGH: 2, MEDIUM: 1, NONE: 0 };

export const enrichOperationalGroups = (groups = [], operationalTrips = [], services = []) => {
  const tripsByKey = new Map(operationalTrips.map((trip) => [trip.operationKey, trip]));
  const servicesByTrip = new Map();
  for (const service of services) {
    const key = String(service.operationalTripId);
    const current = servicesByTrip.get(key) || [];
    current.push(service);
    servicesByTrip.set(key, current);
  }

  return groups.map((group) => {
    const operationalTrip = tripsByKey.get(group.operationKey) || null;
    const tripServices = operationalTrip ? (servicesByTrip.get(String(operationalTrip._id)) || []) : [];
    const readiness = deriveExecutionReadiness(tripServices);
    const executionReasons = deriveExecutionAttention(tripServices, group);
    const reasons = [...(group.attention?.reasons || []), ...executionReasons];
    const severity = reasons.reduce((highest, reason) => (
      severityRank[reason.severity] > severityRank[highest] ? reason.severity : highest
    ), 'NONE');
    return {
      ...group,
      attention: { required: reasons.length > 0, severity, reasons },
      execution: {
        materialized: Boolean(operationalTrip),
        operationalTripId: operationalTrip?._id || null,
        coordinator: operationalTrip?.coordinatorId || null,
        updatedAt: operationalTrip?.updatedAt || null,
        readiness
      }
    };
  });
};

export const executionMetricsFor = (groups = [], activeVendors = 0) => ({
  pendingConfirmations: groups.reduce((sum, group) => sum + (group.execution?.readiness?.pendingRequiredServices || 0), 0),
  unassignedRequiredServices: groups.reduce((sum, group) => sum + (group.execution?.readiness?.unassignedRequiredServices || 0), 0),
  readyTrips: groups.filter((group) => group.execution?.readiness?.status === 'READY').length,
  activeVendors
});

export const vendorSupportsAssignment = (serviceType, vendor, { driver = false } = {}) => {
  const expected = driver ? 'DRIVER' : serviceType;
  return vendor?.status === 'ACTIVE' && Array.isArray(vendor.types) && vendor.types.includes(expected);
};

export const buildVendorSnapshot = (vendor, serviceType) => ({
  vendorCode: vendor.vendorCode,
  name: vendor.name,
  type: serviceType,
  contactName: vendor.contact?.personName || '',
  phone: vendor.contact?.phone || vendor.contact?.whatsapp || '',
  email: vendor.contact?.email || ''
});

export const applyVendorAssignment = (service, vendor, actor, now = new Date()) => {
  if (!vendorSupportsAssignment(service.serviceType, vendor)) {
    throw new OperationsDomainError(
      400,
      vendor?.status !== 'ACTIVE' ? 'This Vendor is inactive and cannot be assigned.' : `This Vendor cannot fulfill a ${service.serviceType} service.`,
      'INVALID_VENDOR_ASSIGNMENT'
    );
  }
  const changed = String(service.vendorId || '') !== String(vendor._id);
  const fromStatus = service.confirmationStatus;
  service.vendorId = vendor._id;
  service.vendorSnapshot = buildVendorSnapshot(vendor, service.serviceType);
  service.confirmationStatus = 'PENDING_CONFIRMATION';
  service.confirmationRequestedAt = now;
  service.confirmedAt = null;
  service.confirmedBy = null;
  service.confirmationNumber = '';
  service.declinedAt = null;
  service.declineReason = '';
  service.updatedBy = actor.id;
  service.history = service.history || [];
  service.history.push({
    action: changed && fromStatus !== 'UNASSIGNED' ? 'VENDOR_CHANGED' : 'VENDOR_ASSIGNED',
    fromStatus,
    toStatus: 'PENDING_CONFIRMATION',
    actorId: actor.id,
    actorName: actor.name,
    at: now
  });
  return service;
};

export const applyServiceConfirmation = (service, payload, actor, now = new Date()) => {
  if (!service.vendorId) throw new OperationsDomainError(409, 'Assign an active Vendor before confirming this service.', 'VENDOR_REQUIRED');
  if (service.confirmationStatus === 'CONFIRMED') throw new OperationsDomainError(409, 'This service has already been confirmed.', 'ALREADY_CONFIRMED');
  if (service.confirmationStatus === 'CANCELLED') throw new OperationsDomainError(409, 'A cancelled service cannot be confirmed.', 'SERVICE_CANCELLED');
  const fromStatus = service.confirmationStatus;
  service.confirmationStatus = 'CONFIRMED';
  service.confirmedAt = now;
  service.confirmedBy = actor.id;
  service.confirmationNumber = cleanText(payload.confirmationNumber);
  service.bookingReference = cleanText(payload.bookingReference || service.bookingReference);
  service.declinedAt = null;
  service.declineReason = '';
  service.updatedBy = actor.id;
  service.history = service.history || [];
  service.history.push({ action: 'CONFIRMED', fromStatus, toStatus: 'CONFIRMED', note: cleanText(payload.note), actorId: actor.id, actorName: actor.name, at: now });
  return service;
};

export const applyServiceDecline = (service, reason, actor, now = new Date()) => {
  const normalizedReason = cleanText(reason);
  if (!normalizedReason) throw new OperationsDomainError(400, 'A decline reason is required.', 'DECLINE_REASON_REQUIRED');
  if (!service.vendorId) throw new OperationsDomainError(409, 'An unassigned service cannot be declined.', 'VENDOR_REQUIRED');
  if (service.confirmationStatus === 'CANCELLED') throw new OperationsDomainError(409, 'A cancelled service cannot be declined.', 'SERVICE_CANCELLED');
  const fromStatus = service.confirmationStatus;
  service.confirmationStatus = 'DECLINED';
  service.declinedAt = now;
  service.declineReason = normalizedReason;
  service.confirmedAt = null;
  service.confirmedBy = null;
  service.updatedBy = actor.id;
  service.history = service.history || [];
  service.history.push({ action: 'DECLINED', fromStatus, toStatus: 'DECLINED', note: normalizedReason, actorId: actor.id, actorName: actor.name, at: now });
  return service;
};

const sourceForGroup = (readModel, group, booking) => {
  const trip = group.type === 'CATALOG' ? tripForBooking(readModel, booking) : null;
  return {
    tripId: String(booking?.tripId || ''),
    tripMongoId: trip?._id || null,
    tripSlug: trip?.slug || (!trip && group.type === 'CATALOG' ? String(booking?.tripId || '') : ''),
    batchId: group.type === 'CATALOG' ? String(booking?.batchId || booking?.tripSnapshot?.batchDate || '') : '',
    customBookingId: group.type === 'CUSTOM' ? booking?.bookingId || '' : ''
  };
};

export const ensureOperationalTrip = async ({
  operationKey,
  actor,
  now = new Date(),
  readModelLoader = loadOperationalReadModel,
  models = { OperationalTrip, OperationalService }
}) => {
  const readModel = await readModelLoader({ now, includeSource: true });
  const group = resolveOperationalGroup(readModel, operationKey);
  if (!group) throw new OperationsDomainError(404, 'Operational departure no longer exists.', 'OPERATION_NOT_FOUND');
  const groupBookings = bookingsForOperationalGroup(readModel, group);
  const booking = groupBookings[0];
  const operationalTrip = await models.OperationalTrip.findOneAndUpdate(
    { operationKey: group.operationKey },
    {
      $setOnInsert: {
        operationKey: group.operationKey,
        sourceType: group.type,
        source: sourceForGroup(readModel, group, booking),
        materializedAt: now,
        createdBy: actor.id,
        updatedBy: actor.id
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  if (group.type === 'CUSTOM' && booking) {
    const seeds = buildCustomQuotationServiceSeeds(booking, actor, now);
    if (seeds.length) {
      await models.OperationalService.bulkWrite(seeds.map((seed) => ({
        updateOne: {
          filter: { operationalTripId: operationalTrip._id, serviceKey: seed.serviceKey },
          update: { $setOnInsert: { ...seed, operationalTripId: operationalTrip._id } },
          upsert: true
        }
      })), { ordered: false });
    }
  }

  const services = await models.OperationalService.find({ operationalTripId: operationalTrip._id }).sort({ serviceType: 1, createdAt: 1 }).lean();
  return { operationalTrip: plain(operationalTrip), group, bookings: groupBookings, services, readiness: deriveExecutionReadiness(services), readModel };
};

const PRIVATE_SOURCE_KEYS = new Set([
  'costPerNight', 'unitCost', 'totalCost', 'supplierCost', 'margin', 'commission', 'manualPricing',
  'razorpaySignature', 'signature', 'verificationToken', 'shareToken', 'shareTokenHash', 'publicId'
]);

export const sanitizeSourceHandoff = (value) => {
  if (Array.isArray(value)) return value.map(sanitizeSourceHandoff);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value)
    .filter(([key]) => !PRIVATE_SOURCE_KEYS.has(key))
    .map(([key, child]) => [key, sanitizeSourceHandoff(child)]));
};

export const buildExecutionBookingDto = (booking) => ({
  bookingId: booking.bookingId,
  customer: {
    name: booking.customer?.name || '',
    phone: booking.customer?.phone || '',
    email: booking.customer?.email || ''
  },
  travelers: (booking.travelers || []).map((traveler) => ({
    name: traveler.name || '', age: traveler.age || '', gender: traveler.gender || '', phone: traveler.phone || '', email: traveler.email || ''
  })),
  numberOfTravelers: Number(booking.numberOfTravelers || 0),
  occupancy: booking.occupancy || '',
  pickupPoint: booking.tripSnapshot?.pickupPoint || '',
  payment: {
    status: booking.paymentStatus,
    amountOutstanding: Number(booking.pricing?.amountOutstanding || 0),
    balanceDueDate: booking.pricing?.balanceDueDate || null
  }
});

export const buildSourceHandoffDto = (bookings, trip) => {
  const custom = bookings.find((booking) => booking.isCustomQuotationBooking);
  return sanitizeSourceHandoff({
    bookings: bookings.map(buildExecutionBookingDto),
    itinerary: custom?.quotationSnapshot?.itinerary || trip?.itinerary || [],
    proposedHotel: custom?.quotationSnapshot?.selectedHotel || null,
    proposedTransport: custom?.quotationSnapshot?.selectedTransport || [],
    activities: custom?.quotationSnapshot?.activities || [],
    addOns: custom?.quotationSnapshot?.addOns || [],
    specialRequests: custom?.quotationSnapshot?.tripRequirements?.specialRequests || custom?.quotationSnapshot?.tripRequirements?.notes || ''
  });
};

export const createVendorCode = (now = new Date(), randomBytes = crypto.randomBytes) => {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  return `VND-${date}-${randomBytes(3).toString('hex').toUpperCase()}`;
};

export const createVendorWithUniqueCode = async (payload, actorId, { VendorModel = Vendor, attempts = 5 } = {}) => {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await VendorModel.create({ ...payload, vendorCode: createVendorCode(), createdBy: actorId, updatedBy: actorId });
    } catch (error) {
      if (error?.code !== 11000 || !String(error?.message || '').includes('vendorCode') || attempt === attempts - 1) throw error;
    }
  }
  throw new OperationsDomainError(503, 'Unable to allocate a Vendor code. Please retry.', 'VENDOR_CODE_UNAVAILABLE');
};
