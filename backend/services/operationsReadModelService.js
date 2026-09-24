import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import { buildOperationalGroups, createTripLookups } from './operationsDashboardService.js';

export const OPERATIONS_ELIGIBLE_FILTER = Object.freeze({
  bookingStatus: { $in: ['PROVISIONALLY_CONFIRMED', 'CONFIRMED'] },
  paymentStatus: { $in: ['PARTIALLY_PAID', 'PAID'] }
});

const SUMMARY_FIELDS = 'bookingId tripId batchId tripSnapshot customer travelers numberOfTravelers occupancy pricing paymentStatus bookingStatus isCustomQuotationBooking quotationSnapshot.tripRequirements createdAt';
const DETAIL_FIELDS = `${SUMMARY_FIELDS} quotationSnapshot sourceQuotationId sourceQuotationRevisionId updatedAt`;

const loadTripsForBookings = async (bookings) => {
  const identifiers = [...new Set(bookings
    .filter((booking) => !booking.isCustomQuotationBooking)
    .map((booking) => String(booking.tripId || ''))
    .filter(Boolean))];
  if (!identifiers.length) return [];
  const objectIds = identifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));
  const slugs = identifiers.map((value) => value.toLowerCase());
  return Trip.find({ $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }] })
    .select('_id slug title destination location duration batches itinerary pickupPoints')
    .lean();
};

export const loadOperationalReadModel = async ({ now = new Date(), includeSource = false } = {}) => {
  const bookings = await Booking.find(OPERATIONS_ELIGIBLE_FILTER)
    .select(includeSource ? DETAIL_FIELDS : SUMMARY_FIELDS)
    .lean();
  const trips = await loadTripsForBookings(bookings);
  const tripLookups = createTripLookups(trips);
  return { bookings, trips, tripLookups, groups: buildOperationalGroups(bookings, tripLookups, now), now };
};

export const resolveOperationalGroup = (readModel, operationKey) => (
  readModel.groups.find((group) => group.operationKey === String(operationKey || '')) || null
);

export const bookingsForOperationalGroup = (readModel, group) => {
  const bookingIds = new Set(group?.bookingIds || []);
  return readModel.bookings.filter((booking) => bookingIds.has(booking.bookingId));
};

export const tripForBooking = (readModel, booking) => {
  const key = String(booking?.tripId || '');
  return readModel.tripLookups.byId.get(key) || readModel.tripLookups.bySlug.get(key.toLowerCase()) || null;
};
