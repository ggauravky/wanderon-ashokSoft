const DAY_MS = 86_400_000;
export const STARTING_SOON_DAYS = 7;
const PICKUP_ATTENTION_DAYS = 14;
const ACTIVE_BOOKING_STATUSES = new Set(['PROVISIONALLY_CONFIRMED', 'CONFIRMED']);
const ACTIVE_PAYMENT_STATUSES = new Set(['PARTIALLY_PAID', 'PAID']);
const SEVERITY_RANK = { HIGH: 2, MEDIUM: 1, NONE: 0 };
const MONTHS = new Map([
  ['jan', 0], ['january', 0], ['feb', 1], ['february', 1], ['mar', 2], ['march', 2],
  ['apr', 3], ['april', 3], ['may', 4], ['jun', 5], ['june', 5], ['jul', 6], ['july', 6],
  ['aug', 7], ['august', 7], ['sep', 8], ['sept', 8], ['september', 8], ['oct', 9], ['october', 9],
  ['nov', 10], ['november', 10], ['dec', 11], ['december', 11]
]);

const dateFromParts = (year, month, day) => {
  const normalizedYear = Number(year);
  const normalizedMonth = Number(month);
  const normalizedDay = Number(day);
  const value = new Date(Date.UTC(normalizedYear, normalizedMonth, normalizedDay));
  return Number.isNaN(value.getTime())
    || value.getUTCFullYear() !== normalizedYear
    || value.getUTCMonth() !== normalizedMonth
    || value.getUTCDate() !== normalizedDay
    ? null
    : value;
};

const kolkataDay = (input) => {
  if (!input) return null;
  if (typeof input === 'string') {
    const iso = input.match(/^(\d{4})-(\d{2})-(\d{2})(?:T|$)/);
    if (iso) return dateFromParts(iso[1], Number(iso[2]) - 1, iso[3]);
  }
  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return null;
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(value).reduce((result, part) => ({ ...result, [part.type]: part.value }), {});
  return dateFromParts(parts.year, Number(parts.month) - 1, parts.day);
};

const parseDisplayDateRange = (input) => {
  const text = String(input || '').trim().replace(/,/g, '');
  if (!text) return { startDate: null, endDate: null };
  const range = text.match(/^(\d{1,2})\s+([A-Za-z]+)(?:\s+(\d{4}))?\s*(?:-|–|—|to)\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (range) {
    const endYear = Number(range[6]);
    const startMonth = MONTHS.get(range[2].toLowerCase());
    const endMonth = MONTHS.get(range[5].toLowerCase());
    if (startMonth === undefined || endMonth === undefined) return { startDate: null, endDate: null };
    const startYear = range[3] ? Number(range[3]) : (startMonth > endMonth ? endYear - 1 : endYear);
    return { startDate: dateFromParts(startYear, startMonth, range[1]), endDate: dateFromParts(endYear, endMonth, range[4]) };
  }
  const single = text.match(/^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$/i);
  if (!single) return { startDate: null, endDate: null };
  const month = MONTHS.get(single[2].toLowerCase());
  return { startDate: month === undefined ? null : dateFromParts(single[3], month, single[1]), endDate: null };
};

const durationDays = (duration) => {
  const text = String(duration || '').trim();
  const match = text.match(/(\d+)\s*(?:D|day|days)\b/i);
  const days = match ? Number(match[1]) : null;
  return Number.isInteger(days) && days > 0 && days <= 90 ? days : null;
};

const deriveEndDate = (startDate, endDate, duration) => {
  if (endDate) return endDate;
  const days = durationDays(duration);
  return startDate && days ? new Date(startDate.getTime() + (days - 1) * DAY_MS) : null;
};

const tripLookupForBooking = (booking, tripLookups) => {
  const key = String(booking.tripId || '');
  return tripLookups?.byId?.get(key) || tripLookups?.bySlug?.get(key.toLowerCase()) || null;
};

const resolveCatalogBatch = (booking, trip) => {
  if (!trip) return null;
  const bookingBatchId = String(booking.batchId || '');
  return (trip.batches || []).find((batch) => (
    bookingBatchId && (String(batch.batchId || '') === bookingBatchId || String(batch._id || '') === bookingBatchId)
  )) || (trip.batches || []).find((batch) => (
    booking.tripSnapshot?.batchDate && String(batch.dates || '').trim() === String(booking.tripSnapshot.batchDate).trim()
  )) || null;
};

export const isOperationallyEligible = (booking) => (
  ACTIVE_BOOKING_STATUSES.has(booking?.bookingStatus) && ACTIVE_PAYMENT_STATUSES.has(booking?.paymentStatus)
);

export const resolveBookingTravelWindow = (booking, tripLookups = {}) => {
  if (booking?.isCustomQuotationBooking) {
    const requirements = booking.quotationSnapshot?.tripRequirements || {};
    const startDate = kolkataDay(requirements.startDate);
    const endDate = deriveEndDate(startDate, kolkataDay(requirements.endDate), requirements.duration || booking.tripSnapshot?.duration);
    return { startDate, endDate, catalogBatchResolved: true, source: startDate ? 'CUSTOM_REQUIREMENTS' : 'UNRESOLVED' };
  }

  const trip = tripLookupForBooking(booking, tripLookups);
  const batch = resolveCatalogBatch(booking, trip);
  if (batch) {
    const parsed = parseDisplayDateRange(batch.dates);
    const startDate = kolkataDay(batch.startDate) || parsed.startDate;
    const endDate = deriveEndDate(startDate, kolkataDay(batch.endDate) || parsed.endDate, trip?.duration || booking.tripSnapshot?.duration);
    return { startDate, endDate, catalogBatchResolved: true, source: 'CATALOG_BATCH', trip, batch };
  }

  const parsed = parseDisplayDateRange(booking?.tripSnapshot?.batchDate);
  return {
    startDate: parsed.startDate,
    endDate: deriveEndDate(parsed.startDate, parsed.endDate, booking?.tripSnapshot?.duration),
    catalogBatchResolved: false,
    source: parsed.startDate ? 'BOOKING_SNAPSHOT' : 'UNRESOLVED',
    trip
  };
};

export const deriveOperationalPhase = (window, now = new Date()) => {
  const today = kolkataDay(now);
  const start = kolkataDay(window?.startDate);
  const end = kolkataDay(window?.endDate);
  if (!start) return 'DATE_UNRESOLVED';
  if (start > today) return 'UPCOMING';
  if (end && end < today) return 'COMPLETED';
  return 'ONGOING';
};

const daysUntil = (startDate, now) => {
  const start = kolkataDay(startDate);
  const today = kolkataDay(now);
  return start ? Math.round((start.getTime() - today.getTime()) / DAY_MS) : null;
};

const travelerDetailsIncomplete = (booking) => {
  const expected = Number(booking.numberOfTravelers || 0);
  if (!Number.isFinite(expected) || expected < 1) return true;
  const leadName = String(booking.customer?.name || '').trim().toLowerCase();
  const names = new Set(leadName ? [leadName] : []);
  for (const traveler of booking.travelers || []) {
    const name = String(traveler?.name || '').trim().toLowerCase();
    if (name) names.add(name);
  }
  return names.size < expected;
};

export const deriveBookingAttention = (booking, window, now = new Date()) => {
  const reasons = [];
  const add = (code, label, severity) => reasons.push({ code, label, severity });
  const untilStart = daysUntil(window?.startDate, now);
  if (!window?.startDate) add('DATE_UNRESOLVED', 'Travel dates could not be resolved', 'HIGH');
  if (!booking?.isCustomQuotationBooking && !window?.catalogBatchResolved) add('CATALOG_BATCH_UNRESOLVED', 'Catalog departure batch could not be matched', 'HIGH');
  if (untilStart !== null && untilStart >= 0 && untilStart <= PICKUP_ATTENTION_DAYS && !String(booking.tripSnapshot?.pickupPoint || '').trim()) {
    add('PICKUP_POINT_MISSING', 'Pickup point is missing', 'MEDIUM');
  }
  if (travelerDetailsIncomplete(booking)) add('TRAVELER_DETAILS_INCOMPLETE', 'Traveler details are incomplete', 'MEDIUM');
  if (!String(booking.customer?.email || '').trim() || !String(booking.customer?.phone || '').trim()) {
    add('CUSTOMER_CONTACT_MISSING', 'Customer contact is incomplete', 'MEDIUM');
  }
  const outstanding = Number(booking.pricing?.amountOutstanding || 0);
  const due = kolkataDay(booking.pricing?.balanceDueDate);
  const today = kolkataDay(now);
  if (outstanding > 0 && due && due < today) add('BALANCE_OVERDUE', 'Balance payment is overdue', 'HIGH');
  if (outstanding > 0 && untilStart !== null && untilStart >= 0 && untilStart <= STARTING_SOON_DAYS) {
    add('BALANCE_PENDING_NEAR_DEPARTURE', 'Balance is pending near departure', 'HIGH');
  }
  const severity = reasons.reduce((highest, reason) => SEVERITY_RANK[reason.severity] > SEVERITY_RANK[highest] ? reason.severity : highest, 'NONE');
  return { required: reasons.length > 0, severity, reasons };
};

const operationKeyFor = (booking, window) => {
  if (booking.isCustomQuotationBooking) return `custom:${booking.bookingId}`;
  const tripKey = String(booking.tripId || 'unknown');
  const batchKey = String(window?.batch?.batchId || window?.batch?._id || booking.batchId || booking.tripSnapshot?.batchDate || `booking-${booking.bookingId}`)
    .trim().toLowerCase().replace(/\s+/g, '-');
  return `catalog:${tripKey}:${batchKey}`;
};

const safeIso = (date) => date ? date.toISOString() : null;

export const buildOperationalGroups = (bookings, tripLookups = {}, now = new Date()) => {
  const groups = new Map();
  for (const booking of bookings.filter(isOperationallyEligible)) {
    const window = resolveBookingTravelWindow(booking, tripLookups);
    const operationKey = operationKeyFor(booking, window);
    const attention = deriveBookingAttention(booking, window, now);
    const group = groups.get(operationKey) || {
      operationKey,
      type: booking.isCustomQuotationBooking ? 'CUSTOM' : 'CATALOG',
      title: booking.tripSnapshot?.title || window.trip?.title || 'Untitled journey',
      destination: booking.tripSnapshot?.destination || booking.tripSnapshot?.location || window.trip?.destination || window.trip?.location || '',
      startDate: safeIso(window.startDate),
      endDate: safeIso(window.endDate),
      bookingCount: 0,
      travelerCount: 0,
      bookingIds: [],
      payment: { paidBookings: 0, partiallyPaidBookings: 0, outstandingBookings: 0, outstandingAmount: 0 },
      pickup: { recordedBookings: 0, missingBookings: 0 },
      attentionCounts: new Map(),
      severity: 'NONE',
      latestBookingAt: null
    };
    group.bookingCount += 1;
    group.travelerCount += Math.max(0, Number(booking.numberOfTravelers || 0));
    group.bookingIds.push(booking.bookingId);
    if (booking.paymentStatus === 'PAID') group.payment.paidBookings += 1;
    if (booking.paymentStatus === 'PARTIALLY_PAID') group.payment.partiallyPaidBookings += 1;
    const outstanding = Math.max(0, Number(booking.pricing?.amountOutstanding || 0));
    if (outstanding > 0) group.payment.outstandingBookings += 1;
    group.payment.outstandingAmount += outstanding;
    if (String(booking.tripSnapshot?.pickupPoint || '').trim()) group.pickup.recordedBookings += 1;
    else group.pickup.missingBookings += 1;
    for (const reason of attention.reasons) {
      const current = group.attentionCounts.get(reason.code) || { code: reason.code, label: reason.label, count: 0, severity: reason.severity };
      current.count += 1;
      group.attentionCounts.set(reason.code, current);
    }
    if (SEVERITY_RANK[attention.severity] > SEVERITY_RANK[group.severity]) group.severity = attention.severity;
    const createdAt = booking.createdAt ? new Date(booking.createdAt) : null;
    if (createdAt && (!group.latestBookingAt || createdAt > group.latestBookingAt)) group.latestBookingAt = createdAt;
    groups.set(operationKey, group);
  }

  return [...groups.values()].map((group) => {
    const startDate = group.startDate ? new Date(group.startDate) : null;
    const endDate = group.endDate ? new Date(group.endDate) : null;
    const operationalPhase = deriveOperationalPhase({ startDate, endDate }, now);
    const daysUntilStart = daysUntil(startDate, now);
    const reasons = [...group.attentionCounts.values()].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.code.localeCompare(b.code));
    return {
      operationKey: group.operationKey,
      type: group.type,
      title: group.title,
      destination: group.destination,
      startDate: group.startDate,
      endDate: group.endDate,
      operationalPhase,
      startingSoon: daysUntilStart !== null && daysUntilStart >= 0 && daysUntilStart <= STARTING_SOON_DAYS,
      daysUntilStart,
      bookingCount: group.bookingCount,
      travelerCount: group.travelerCount,
      bookingIds: group.bookingIds.sort(),
      payment: group.payment,
      pickup: group.pickup,
      attention: { required: reasons.length > 0, severity: reasons.length ? group.severity : 'NONE', reasons },
      latestBookingAt: safeIso(group.latestBookingAt)
    };
  });
};

const byStart = (a, b) => String(a.startDate).localeCompare(String(b.startDate));
const attentionSort = (a, b) => SEVERITY_RANK[b.attention.severity] - SEVERITY_RANK[a.attention.severity] || byStart(a, b);

export const summarizeOperationsDashboard = (bookings, tripLookups = {}, { now = new Date(), awaitingHandoff = 0 } = {}) => {
  const groups = buildOperationalGroups(bookings, tripLookups, now);
  const upcoming = groups.filter((group) => group.operationalPhase === 'UPCOMING').sort(byStart);
  const ongoing = groups.filter((group) => group.operationalPhase === 'ONGOING').sort((a, b) => String(a.endDate || '9999').localeCompare(String(b.endDate || '9999')));
  const completed = groups.filter((group) => group.operationalPhase === 'COMPLETED').sort((a, b) => String(b.endDate).localeCompare(String(a.endDate)));
  const unresolved = groups.filter((group) => group.operationalPhase === 'DATE_UNRESOLVED').sort((a, b) => String(b.latestBookingAt || '').localeCompare(String(a.latestBookingAt || '')));
  const attention = groups.filter((group) => group.attention.required).sort(attentionSort);
  const activeBookings = bookings.filter(isOperationallyEligible);
  return {
    success: true,
    generatedAt: now.toISOString(),
    timezone: 'Asia/Kolkata',
    definitions: { startingSoonDays: STARTING_SOON_DAYS, operationalSource: 'Confirmed and provisionally confirmed MongoDB bookings' },
    summary: {
      operationalTrips: groups.length,
      upcoming: upcoming.length,
      startingSoon: groups.filter((group) => group.startingSoon).length,
      ongoing: ongoing.length,
      completed: completed.length,
      attentionRequired: attention.length,
      unresolvedDates: unresolved.length,
      activeBookings: activeBookings.length,
      travelers: activeBookings.reduce((sum, booking) => sum + Math.max(0, Number(booking.numberOfTravelers || 0)), 0),
      awaitingHandoff
    },
    attention,
    ongoing,
    upcoming,
    recentlyCompleted: completed.slice(0, 10),
    unresolved
  };
};

export const createTripLookups = (trips = []) => ({
  byId: new Map(trips.map((trip) => [String(trip._id), trip])),
  bySlug: new Map(trips.filter((trip) => trip.slug).map((trip) => [String(trip.slug).toLowerCase(), trip]))
});
