import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import { createTripLookups, summarizeOperationsDashboard } from '../services/operationsDashboardService.js';

const ELIGIBLE_FILTER = {
  bookingStatus: { $in: ['PROVISIONALLY_CONFIRMED', 'CONFIRMED'] },
  paymentStatus: { $in: ['PARTIALLY_PAID', 'PAID'] }
};

export const getOperationsDashboard = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Operations dashboard is temporarily unavailable.' });
    }
    const bookings = await Booking.find(ELIGIBLE_FILTER)
      .select('bookingId tripId batchId tripSnapshot customer travelers numberOfTravelers pricing paymentStatus bookingStatus isCustomQuotationBooking quotationSnapshot.tripRequirements createdAt')
      .lean();

    const catalogIdentifiers = [...new Set(bookings.filter((booking) => !booking.isCustomQuotationBooking).map((booking) => String(booking.tripId || '')).filter(Boolean))];
    const objectIds = catalogIdentifiers.filter((value) => mongoose.Types.ObjectId.isValid(value));
    const slugs = catalogIdentifiers.map((value) => value.toLowerCase());
    const trips = catalogIdentifiers.length
      ? await Trip.find({ $or: [{ _id: { $in: objectIds } }, { slug: { $in: slugs } }] }).select('_id slug title destination location duration batches').lean()
      : [];
    const awaitingHandoff = await Booking.countDocuments({ bookingStatus: 'PENDING_PAYMENT' });
    return res.json(summarizeOperationsDashboard(bookings, createTripLookups(trips), { now: new Date(), awaitingHandoff }));
  } catch (error) {
    console.error('Operations dashboard error:', error.message);
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ success: false, message: 'Operations dashboard is temporarily unavailable.' });
    }
    return res.status(500).json({ success: false, message: 'Unable to load Operations dashboard.' });
  }
};
