import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Itinerary from '../models/Itinerary.js';
import Lead from '../models/Lead.js';
import { cloneQuotationAiSampleItinerary } from '../fixtures/quotationAiSampleItinerary.js';

const DEMO_EMAIL = 'quotation-ai-demo@wanderluxe.invalid';
const SAVED_TITLE = '[DEMO][QUOTATION_AI] Himachal Valleys Sample';
const SHARED_TITLE = '[DEMO][QUOTATION_AI] Shared Himachal Valleys Sample';
const LEAD_REFERENCE = 'WLX-DEMO-QUOTATION-AI';

if (process.env.NODE_ENV === 'production') throw new Error('Quotation AI demo seed refuses to run in production.');
if (!(await connectDB())) throw new Error('Database connection is required for the quotation AI demo seed.');

try {
  if (process.argv.includes('--cleanup')) {
    const itineraries = await Itinerary.find({ title: { $in: [SAVED_TITLE, SHARED_TITLE] }, userEmail: DEMO_EMAIL }).select('_id');
    await Lead.deleteMany({ referenceId: LEAD_REFERENCE, email: DEMO_EMAIL });
    await Itinerary.deleteMany({ _id: { $in: itineraries.map((item) => item._id) }, userEmail: DEMO_EMAIL });
    console.log(`Quotation AI demo cleanup complete (${itineraries.length} itineraries).`);
  } else {
    const staffEmail = String(process.env.DEMO_QUOTATION_STAFF_EMAIL || '').trim().toLowerCase();
    if (!staffEmail) throw new Error('Set DEMO_QUOTATION_STAFF_EMAIL to an active Admin, Super Admin, or Sales account.');
    const staff = await User.findOne({ email: staffEmail, isActive: true, role: { $in: ['admin', 'super_admin', 'sales'] } });
    if (!staff) throw new Error('DEMO_QUOTATION_STAFF_EMAIL does not identify an active quotation staff account.');
    const fixture = cloneQuotationAiSampleItinerary().itinerary;
    const saved = await Itinerary.findOneAndUpdate(
      { title: SAVED_TITLE, userEmail: DEMO_EMAIL },
      { ...fixture, title: SAVED_TITLE, user: staff._id, userEmail: DEMO_EMAIL, source: 'template-engine', isPublic: false },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const shared = await Itinerary.findOneAndUpdate(
      { title: SHARED_TITLE, userEmail: DEMO_EMAIL },
      { ...fixture, title: SHARED_TITLE, user: staff._id, userEmail: DEMO_EMAIL, source: 'template-engine', isPublic: true, shareToken: 'quotation-ai-demo-plan' },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    const lead = await Lead.findOneAndUpdate(
      { referenceId: LEAD_REFERENCE, email: DEMO_EMAIL },
      {
        name: '[DEMO] Quotation AI Traveler', email: DEMO_EMAIL, phone: '0000000000',
        leadType: 'trip_enquiry', source: 'ai_planner', priority: 'LOW', status: 'NEW',
        destination: fixture.destination, travelersCount: fixture.travelers,
        tripTitle: fixture.title, tripTitleSnapshot: fixture.title, sourceItineraryId: saved._id,
        assignedToUser: staff._id, assignedToUserName: staff.name, assignedTo: staff.name,
        message: '[DEMO][QUOTATION_AI] Synthetic workflow fixture. Do not contact.'
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    console.log(`Quotation AI demo ready: saved=${saved._id} lead=${lead._id} sharedToken=${shared.shareToken}`);
  }
} finally {
  await mongoose.disconnect();
}
