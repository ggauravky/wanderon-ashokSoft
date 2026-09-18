import Lead from '../models/Lead.js';

export const syncLeadConversionFromBooking = async (booking) => {
  if (!booking?.leadId) return null;
  return Lead.findByIdAndUpdate(booking.leadId, {
    $set: {
      status: 'CONVERTED',
      convertedBookingId: booking._id,
      convertedBookingCode: booking.bookingId
    }
  }, { new: true });
};

