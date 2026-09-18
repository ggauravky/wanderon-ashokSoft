import 'dotenv/config';
import mongoose from 'mongoose';
import { getMongoUri } from '../config/environment.js';
import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';

const apply = process.argv.includes('--apply');
if (!apply && !process.argv.includes('--dry-run')) {
  throw new Error('Choose --dry-run or --apply.');
}
const uri = getMongoUri();
if (!uri) throw new Error('MONGODB_URI (or MONGO_URI) is required.');

const report = { bookingsChecked: 0, leadsLinked: 0, leadsAlreadyCorrect: 0, missingLeads: 0, errors: 0 };
try {
  await mongoose.connect(uri);
  const bookings = Booking.find({ leadId: { $ne: null } }).select('_id bookingId leadId').lean().cursor();
  for await (const booking of bookings) {
    report.bookingsChecked += 1;
    try {
      const lead = await Lead.findById(booking.leadId).select('status convertedBookingId convertedBookingCode').lean();
      if (!lead) { report.missingLeads += 1; continue; }
      const correct = lead.status === 'CONVERTED'
        && String(lead.convertedBookingId || '') === String(booking._id)
        && lead.convertedBookingCode === booking.bookingId;
      if (correct) { report.leadsAlreadyCorrect += 1; continue; }
      report.leadsLinked += 1;
      if (apply) await Lead.updateOne({ _id: lead._id }, { $set: { status: 'CONVERTED', convertedBookingId: booking._id, convertedBookingCode: booking.bookingId } });
    } catch (error) {
      report.errors += 1;
      console.error(`Unable to inspect booking ${booking.bookingId}:`, error.message);
    }
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', ...report }, null, 2));
} finally {
  await mongoose.disconnect();
}

