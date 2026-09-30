import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import User from '../models/User.js';
import Vendor from '../models/Vendor.js';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';
import OperationalTrip from '../models/OperationalTrip.js';
import OperationalService from '../models/OperationalService.js';
import OperationalTask from '../models/OperationalTask.js';
import OperationalIncident from '../models/OperationalIncident.js';
import OperationalCommunication from '../models/OperationalCommunication.js';
import OperationalCost from '../models/OperationalCost.js';
import OperationalSettlement from '../models/OperationalSettlement.js';
import OperationalFeedback from '../models/OperationalFeedback.js';
import OperationalTripClosure from '../models/OperationalTripClosure.js';
import { ensureOperationalTrip } from '../services/operationsExecutionService.js';
import { buildOperationsContextSnapshot } from '../services/operationsContextService.js';
import { buildStandardChecklistSeeds } from '../services/operationsTaskService.js';

// Stable demo identifiers
export const DEMO_MARKER = 'OPS_DEMO_2026';
export const DEMO_BOOKING_PREFIX = 'WLX-OPS-DEMO-';
export const DEMO_VENDOR_PREFIX = 'VND-OPS-DEMO-';
export const DEMO_TRIP_PREFIX = 'ops-demo-';
export const DEMO_INCIDENT_PREFIX = 'INC-OPS-DEMO-';
export const DEMO_COST_PREFIX = 'COST-OPS-DEMO-';
export const DEMO_SETTLEMENT_PREFIX = 'SET-OPS-DEMO-';

const isDemoBooking = (id) => String(id || '').startsWith(DEMO_BOOKING_PREFIX);
const isDemoVendor = (code) => String(code || '').startsWith(DEMO_VENDOR_PREFIX);

export async function cleanupOperationsDemo() {
  console.log('🧹 Starting cleanup of Operations Demo dataset...');

  // 1. Find all demo bookings
  const demoBookings = await Booking.find({ bookingId: new RegExp(`^${DEMO_BOOKING_PREFIX}`) }).select('_id bookingId').lean();
  const demoBookingIds = demoBookings.map((b) => b.bookingId);
  const demoBookingMongoIds = demoBookings.map((b) => b._id);
  console.log(`Found ${demoBookings.length} demo bookings.`);

  // 2. Find demo operational trips (custom for demo bookings, or catalog for demo trip slugs)
  const demoTrips = await Trip.find({ slug: new RegExp(`^${DEMO_TRIP_PREFIX}`) }).select('_id slug').lean();
  const demoTripSlugs = demoTrips.map((t) => t.slug);
  const demoTripMongoIds = demoTrips.map((t) => t._id);

  const demoOperationKeys = [
    ...demoBookingIds.map((id) => `custom:${id}`),
    ...demoTrips.map((t) => new RegExp(`^catalog:(${t._id}|${t.slug}):`))
  ];

  const opTrips = await OperationalTrip.find({
    $or: [
      { operationKey: { $in: demoBookingIds.map((id) => `custom:${id}`) } },
      { 'source.customBookingId': { $in: demoBookingIds } },
      { 'source.tripMongoId': { $in: demoTripMongoIds } },
      { 'source.tripSlug': { $in: demoTripSlugs } }
    ]
  }).select('_id operationKey').lean();
  const opTripIds = opTrips.map((t) => t._id);
  console.log(`Found ${opTrips.length} demo operational trips.`);

  // 3. Remove all child collections for demo operational trips
  if (opTripIds.length > 0) {
    const [delSettlements, delCosts, delFeedback, delClosures, delComms, delIncidents, delTasks, delServices] = await Promise.all([
      OperationalSettlement.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalCost.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalFeedback.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalTripClosure.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalCommunication.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalIncident.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalTask.deleteMany({ operationalTripId: { $in: opTripIds } }),
      OperationalService.deleteMany({ operationalTripId: { $in: opTripIds } })
    ]);

    console.log(`Removed child records:
  - Settlements: ${delSettlements.deletedCount}
  - Costs: ${delCosts.deletedCount}
  - Feedback: ${delFeedback.deletedCount}
  - Closures: ${delClosures.deletedCount}
  - Communications: ${delComms.deletedCount}
  - Incidents: ${delIncidents.deletedCount}
  - Tasks: ${delTasks.deletedCount}
  - Services: ${delServices.deletedCount}`);

    const delOpTrips = await OperationalTrip.deleteMany({ _id: { $in: opTripIds } });
    console.log(`Removed ${delOpTrips.deletedCount} OperationalTrip records.`);
  }

  // 4. Remove demo bookings
  if (demoBookingMongoIds.length > 0) {
    const delBookings = await Booking.deleteMany({ _id: { $in: demoBookingMongoIds } });
    console.log(`Removed ${delBookings.deletedCount} demo Booking records.`);
  }

  // 5. Remove demo catalog trips
  if (demoTripMongoIds.length > 0) {
    const delCatalogTrips = await Trip.deleteMany({ _id: { $in: demoTripMongoIds } });
    console.log(`Removed ${delCatalogTrips.deletedCount} demo catalog Trip templates.`);
  }

  // 6. Remove demo vendors
  const delVendors = await Vendor.deleteMany({ vendorCode: new RegExp(`^${DEMO_VENDOR_PREFIX}`) });
  console.log(`Removed ${delVendors.deletedCount} demo Vendor records.`);

  console.log('✅ Cleanup of Operations Demo dataset complete.');
}

export async function seedOperationsDemo() {
  console.log('🚀 Starting realistic Operations Demo Seeding...');

  // Identify active staff accounts
  let opsStaff = await User.findOne({ role: 'operations', isActive: true });
  let adminStaff = await User.findOne({ role: { $in: ['admin', 'super_admin'] }, isActive: true });
  const fallbackUser = await User.findOne({ isActive: true });

  if (!opsStaff) opsStaff = adminStaff || fallbackUser;
  if (!adminStaff) adminStaff = opsStaff || fallbackUser;

  if (!opsStaff) {
    throw new Error('At least one active user is required in the database to run the Operations demo seed.');
  }

  const actor = { id: opsStaff._id, name: opsStaff.name || 'Operations Lead' };
  const adminActor = { id: adminStaff._id, name: adminStaff.name || 'Admin Lead' };
  console.log(`Using Operations actor: "${actor.name}" (${actor.id}) and Admin actor: "${adminActor.name}" (${adminActor.id})`);

  // =========================================================================
  // 1. SEED 10 REALISTIC DEMO VENDORS
  // =========================================================================
  console.log('\n--- Seeding 10 Realistic Demo Vendors ---');
  const vendorDefinitions = [
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}01`,
      name: 'Kashmir Mountain Residency & Hospitality',
      types: ['HOTEL'],
      status: 'ACTIVE',
      contact: { personName: 'Tariq Ahmad Lone', phone: '+91 94190 11223', email: 'tariq.lone@kmr-residency.demo.invalid' },
      location: { address: 'Boulevard Road, Dal Lake', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', pincode: '190001' },
      serviceAreas: ['Srinagar', 'Gulmarg', 'Pahalgam'],
      commercialReference: { rateType: 'PER_ROOM_NIGHT', defaultRate: 4500, taxPercent: 12, paymentTerms: 'Net 15 days upon invoice submission' },
      notes: 'Premier 4-star boutique hotel partner in Srinagar with heating and lake view rooms.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}02`,
      name: 'Himalayan Mobility & Transport Network',
      types: ['TRANSPORT', 'DRIVER'],
      status: 'ACTIVE',
      contact: { personName: 'Manzoor Mir', phone: '+91 94191 88442', email: 'dispatch@himalayanmobility.demo.invalid' },
      location: { address: 'TRC Complex, Residency Road', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', pincode: '190001' },
      serviceAreas: ['Srinagar', 'Gulmarg', 'Pahalgam', 'Sonamarg', 'Leh'],
      commercialReference: { rateType: 'PER_DAY', defaultRate: 3500, taxPercent: 5, paymentTerms: '50% advance, balance post trip completion' },
      notes: 'Reliable fleet of Innova Crystas and 12-seater Tempo Travellers with mountain-trained drivers.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}03`,
      name: 'Dal Lake Shikara & Experience Guild',
      types: ['ACTIVITY'],
      status: 'ACTIVE',
      contact: { personName: 'Farooq Wangnoo', phone: '+91 97970 33441', email: 'farooq@dalexperiences.demo.invalid' },
      location: { address: 'Ghat No. 7, Boulevard', city: 'Srinagar', state: 'Jammu and Kashmir', country: 'India', pincode: '190001' },
      serviceAreas: ['Srinagar', 'Dal Lake', 'Nigeen Lake'],
      commercialReference: { rateType: 'PER_ACTIVITY', defaultRate: 1200, taxPercent: 0, paymentTerms: 'Full settlement within 7 days' },
      notes: 'Heritage Shikara operators offering floating market and sunset sunset circuits.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}04`,
      name: 'Pine Valley Luxury Resort Manali',
      types: ['HOTEL'],
      status: 'ACTIVE',
      contact: { personName: 'Sunil Sharma', phone: '+91 98160 55432', email: 'reservations@pinevalley-manali.demo.invalid' },
      location: { address: 'Hadimba Temple Road, Old Manali', city: 'Manali', state: 'Himachal Pradesh', country: 'India', pincode: '175131' },
      serviceAreas: ['Manali', 'Solang Valley', 'Naggar'],
      commercialReference: { rateType: 'PER_ROOM_NIGHT', defaultRate: 3800, taxPercent: 12, paymentTerms: 'Weekly batch settlement' },
      notes: 'Scenic apple orchard setting with 24-hour backup heating and campfire facilities.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}05`,
      name: 'North India Mobility & Express Fleet',
      types: ['TRANSPORT', 'DRIVER'],
      status: 'ACTIVE',
      contact: { personName: 'Rajinder Pal Singh', phone: '+91 98111 67890', email: 'fleet@northindiamobility.demo.invalid' },
      location: { address: 'Majnu ka Tilla Inter-State Hub', city: 'Delhi', state: 'Delhi', country: 'India', pincode: '110054' },
      serviceAreas: ['Delhi', 'Chandigarh', 'Manali', 'Shimla', 'Dharamshala'],
      commercialReference: { rateType: 'PER_VEHICLE', defaultRate: 18500, taxPercent: 5, paymentTerms: 'Per departure reconciliation' },
      notes: 'Dedicated Volvo 9600s and Force Urbania luxury vans for Delhi-Himachal corridor.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}06`,
      name: 'Adventure Trails India Outfitters',
      types: ['ACTIVITY', 'GUIDE'],
      status: 'ACTIVE',
      contact: { personName: 'Kishore Thakur', phone: '+91 98162 44331', email: 'expeditions@adventuretrailsindia.demo.invalid' },
      location: { address: 'Vashisht Village', city: 'Manali', state: 'Himachal Pradesh', country: 'India', pincode: '175131' },
      serviceAreas: ['Manali', 'Solang Valley', 'Spiti', 'Rohtang'],
      commercialReference: { rateType: 'PER_PERSON', defaultRate: 1500, taxPercent: 5, paymentTerms: 'Immediate upon activity completion' },
      notes: 'Certified IMF mountaineers and paragliding tandem masters with emergency satellite comms.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}07`,
      name: 'Northeast Express Mobility Network',
      types: ['TRANSPORT', 'DRIVER'],
      status: 'ACTIVE',
      contact: { personName: 'Biren Kalita', phone: '+91 98640 12345', email: 'dispatch@northeastmobility.demo.invalid' },
      location: { address: 'Paltan Bazaar Transport Hub', city: 'Guwahati', state: 'Assam', country: 'India', pincode: '781008' },
      serviceAreas: ['Guwahati', 'Shillong', 'Cherrapunji', 'Kaziranga'],
      commercialReference: { rateType: 'PER_DAY', defaultRate: 4200, taxPercent: 5, paymentTerms: 'Net 10 days' },
      notes: 'Guwahati Airport pickup and Meghalaya hill route specialists.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}08`,
      name: 'Cherrapunji Eco-Resort & Homestays',
      types: ['HOTEL'],
      status: 'ACTIVE',
      contact: { personName: 'Wanda Kharshiing', phone: '+91 94361 77654', email: 'wanda@cherraresort.demo.invalid' },
      location: { address: 'Nohkalikai Falls Road', city: 'Cherrapunji', state: 'Meghalaya', country: 'India', pincode: '793108' },
      serviceAreas: ['Cherrapunji', 'Sohra', 'Mawlynnong'],
      commercialReference: { rateType: 'PER_ROOM_NIGHT', defaultRate: 3600, taxPercent: 12, paymentTerms: 'Advance bank transfer on check-in' },
      notes: 'Clifftop eco-resort overlooking the Bangladesh plains.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}09`,
      name: 'Spice Country Resorts Munnar',
      types: ['HOTEL'],
      status: 'ACTIVE',
      contact: { personName: 'Mathew Thomas', phone: '+91 94471 99881', email: 'stay@spicecountrymunnar.demo.invalid' },
      location: { address: 'Chithirapuram Post', city: 'Munnar', state: 'Kerala', country: 'India', pincode: '685565' },
      serviceAreas: ['Munnar', 'Thekkady', 'Alleppey'],
      commercialReference: { rateType: 'PER_ROOM_NIGHT', defaultRate: 4200, taxPercent: 12, paymentTerms: 'Net 15 days' },
      notes: 'Charming tea-plantation resort with mountain view cottages.'
    },
    {
      vendorCode: `${DEMO_VENDOR_PREFIX}10`,
      name: 'Peak Winter Hospitality (Inactive)',
      types: ['HOTEL'],
      status: 'INACTIVE',
      contact: { personName: 'Ramesh Negi', phone: '+91 98160 00000', email: 'inactive@peakwinter.demo.invalid' },
      location: { address: 'Mall Road Extension', city: 'Shimla', state: 'Himachal Pradesh', country: 'India', pincode: '171001' },
      serviceAreas: ['Shimla'],
      commercialReference: { rateType: 'PER_ROOM_NIGHT', defaultRate: 3000, taxPercent: 12, paymentTerms: 'N/A' },
      notes: 'Temporarily blacklisted due to recurring inventory non-fulfillment.'
    }
  ];

  const seededVendors = new Map();
  for (const vDef of vendorDefinitions) {
    const doc = await Vendor.findOneAndUpdate(
      { vendorCode: vDef.vendorCode },
      { ...vDef, createdBy: actor.id, updatedBy: actor.id },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    seededVendors.set(vDef.vendorCode, doc);
  }
  console.log(`Seeded ${seededVendors.size} demo vendors successfully.`);

  // =========================================================================
  // 2. SEED 2 CATALOG TRIP TEMPLATES FOR SCENARIOS 2 & 5
  // =========================================================================
  console.log('\n--- Seeding Demo Catalog Trips for Group Departures ---');
  const now = new Date();
  const formatDatesRange = (start, end) => {
    const sD = start.getUTCDate();
    const sM = start.toLocaleString('en-US', { month: 'short' });
    const eD = end.getUTCDate();
    const eM = end.toLocaleString('en-US', { month: 'short' });
    const y = end.getUTCFullYear();
    return `${sD} ${sM} - ${eD} ${eM}, ${y}`;
  };

  // Scenario 2 trip: Manali Group departure 10 days in the future
  const manaliStart = new Date(now.getTime() + 10 * 86400000);
  const manaliEnd = new Date(manaliStart.getTime() + 5 * 86400000);
  const manaliBatchDates = formatDatesRange(manaliStart, manaliEnd);

  const manaliTrip = await Trip.findOneAndUpdate(
    { slug: `${DEMO_TRIP_PREFIX}manali-backpacking` },
    {
      title: 'Manali Backpacking Adventure: Solang, Kasol & Old Manali',
      slug: `${DEMO_TRIP_PREFIX}manali-backpacking`,
      location: 'Manali',
      destination: 'Himachal Pradesh',
      region: 'North India',
      duration: '6D/5N',
      days: 6,
      nights: 5,
      price: 12500,
      originalPrice: 15500,
      image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1200&q=80',
      currency: 'INR',
      batches: [
        {
          batchId: 'batch-manali-demo-01',
          startDate: manaliStart.toISOString().slice(0, 10),
          endDate: manaliEnd.toISOString().slice(0, 10),
          dates: manaliBatchDates,
          price: 12500,
          capacity: 20,
          bookedSeats: 10,
          status: 'available'
        }
      ],
      itinerary: [
        { day: 1, title: 'Overnight Volvo from Delhi to Manali' },
        { day: 2, title: 'Arrival, Check-in & Old Manali Cafe Trail' },
        { day: 3, title: 'Solang Valley Adventure & Paragliding' },
        { day: 4, title: 'Kasol & Manikaran Hot Springs Excursion' },
        { day: 5, title: 'Jogini Waterfall Trek & Evening Departure' },
        { day: 6, title: 'Morning Arrival in Delhi' }
      ]
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  // Scenario 5 trip: Rajasthan Royal Circuit (Started 2 days ago, ends in 4 days)
  const rajasthanStart = new Date(now.getTime() - 2 * 86400000);
  const rajasthanEnd = new Date(rajasthanStart.getTime() + 6 * 86400000);
  const rajasthanBatchDates = formatDatesRange(rajasthanStart, rajasthanEnd);

  const rajasthanTrip = await Trip.findOneAndUpdate(
    { slug: `${DEMO_TRIP_PREFIX}rajasthan-royal-circuit` },
    {
      title: 'Rajasthan Royal Heritage: Jaipur, Jodhpur & Udaipur',
      slug: `${DEMO_TRIP_PREFIX}rajasthan-royal-circuit`,
      location: 'Jaipur, Jodhpur, Udaipur',
      destination: 'Rajasthan',
      region: 'West India',
      duration: '7D/6N',
      days: 7,
      nights: 6,
      price: 24500,
      originalPrice: 28500,
      image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=1200&q=80',
      currency: 'INR',
      batches: [
        {
          batchId: 'batch-rajasthan-demo-01',
          startDate: rajasthanStart.toISOString().slice(0, 10),
          endDate: rajasthanEnd.toISOString().slice(0, 10),
          dates: rajasthanBatchDates,
          price: 24500,
          capacity: 15,
          bookedSeats: 6,
          status: 'available'
        }
      ],
      itinerary: [
        { day: 1, title: 'Jaipur Pink City Palace & Amer Fort' },
        { day: 2, title: 'Jaipur to Jodhpur via Pushkar' },
        { day: 3, title: 'Mehrangarh Fort & Blue City Walk' },
        { day: 4, title: 'Jodhpur to Udaipur via Ranakpur' },
        { day: 5, title: 'Udaipur City Palace & Lake Pichola Boat Ride' },
        { day: 6, title: 'Saheliyon ki Bari & Local Craft Markets' },
        { day: 7, title: 'Departure from Udaipur' }
      ]
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  console.log(`Seeded catalog trips: Manali (${manaliTrip._id}) and Rajasthan (${rajasthanTrip._id})`);

  // =========================================================================
  // 3. SEED 8 CONNECTED DEMO BOOKINGS
  // =========================================================================
  console.log('\n--- Seeding 8 Connected Operational Bookings ---');

  // Helper date generators
  const inDays = (d) => new Date(now.getTime() + d * 86400000);
  const daysAgo = (d) => new Date(now.getTime() - d * 86400000);

  const bookingSeeds = [
    // Scenario 1: Kashmir Winter Escape (Starts in 4 days, 8 travelers, NEEDS ATTENTION)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}01`,
      tripId: 'custom-kashmir-winter-escape',
      isCustomQuotationBooking: true,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Rohit Sharma', email: 'rohit.sharma@example.demo.invalid', phone: '+91 98200 12345', age: '32', gender: 'Male' },
      numberOfTravelers: 8,
      occupancy: 'Double Sharing',
      travelers: [
        { name: 'Rohit Sharma', age: '32', gender: 'Male', phone: '+91 98200 12345' },
        { name: 'Ritika Sajdeh', age: '31', gender: 'Female', phone: '+91 98200 12346' },
        { name: 'Sameer Sen', age: '34', gender: 'Male', phone: '+91 98200 12347' },
        { name: 'Pooja Sen', age: '33', gender: 'Female', phone: '+91 98200 12348' },
        { name: 'Aditya Roy', age: '29', gender: 'Male', phone: '+91 98200 12349' },
        { name: 'Kavita Roy', age: '28', gender: 'Female', phone: '+91 98200 12350' },
        { name: 'Vikram Joshi', age: '35', gender: 'Male', phone: '+91 98200 12351' },
        { name: 'Deepa Joshi', age: '34', gender: 'Female', phone: '+91 98200 12352' }
      ],
      tripSnapshot: {
        title: 'Kashmir Winter Escape: Srinagar, Gulmarg & Pahalgam',
        destination: 'Srinagar, Gulmarg, Pahalgam',
        location: 'Kashmir',
        duration: '6D/5N',
        pickupPoint: 'Sheikh ul-Alam International Airport, Srinagar'
      },
      pricing: { basePricePerPerson: 22000, subtotal: 176000, taxes: 8800, finalAmount: 184800, amountPaid: 184800, amountOutstanding: 0, currency: 'INR' },
      quotationSnapshot: {
        tripRequirements: {
          startDate: inDays(4).toISOString().slice(0, 10),
          endDate: inDays(9).toISOString().slice(0, 10),
          duration: '6D/5N',
          notes: 'High-altitude snow trip. Need 24h heated rooms and snow chains on cabs.'
        },
        selectedHotel: {
          optionId: 'hotel-kmr-srinagar',
          hotelName: 'Kashmir Mountain Residency',
          city: 'Srinagar',
          roomType: 'Deluxe Heated Cottage',
          rooms: 4,
          checkIn: inDays(4),
          checkOut: inDays(9),
          nights: 5
        },
        selectedTransport: [
          {
            optionId: 'trans-tempo-12s',
            title: '12-Seater Luxury Tempo Traveller with Heater',
            mode: 'TEMPO_TRAVELLER',
            vehicle: 'Force Tempo Traveller 12-Seater',
            provider: 'Himalayan Mobility Services',
            route: { from: 'Srinagar Airport', to: 'Gulmarg / Pahalgam Circuit', pickupPoint: 'Srinagar Airport' },
            schedule: { departureDate: inDays(4), arrivalDate: inDays(9) }
          }
        ],
        activities: [
          {
            activityId: 'act-shikara-ride',
            name: 'Sunset Shikara Ride & Floating Vegetable Market',
            location: 'Dal Lake, Srinagar',
            date: inDays(5),
            isIncluded: true
          }
        ]
      }
    },

    // Scenario 2: Manali Backpacking Adventure (Catalog, Starts in 10 days, 10 travelers, READY)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}02`,
      tripId: String(manaliTrip._id),
      batchId: 'batch-manali-demo-01',
      isCustomQuotationBooking: false,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Amit Patel', email: 'amit.patel@example.demo.invalid', phone: '+91 97123 45678', age: '27', gender: 'Male' },
      numberOfTravelers: 10,
      occupancy: 'Quad Sharing',
      tripSnapshot: {
        title: 'Manali Backpacking Adventure: Solang, Kasol & Old Manali',
        destination: 'Himachal Pradesh',
        location: 'Manali',
        duration: '6D/5N',
        batchDate: manaliBatchDates,
        pickupPoint: 'Majnu ka Tilla, Delhi'
      },
      pricing: { basePricePerPerson: 12500, subtotal: 125000, taxes: 6250, finalAmount: 131250, amountPaid: 131250, amountOutstanding: 0, currency: 'INR' }
    },

    // Scenario 3: Meghalaya Explorer (Starts today, 4 travelers, CUSTOMER INCIDENT)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}03`,
      tripId: 'custom-meghalaya-explorer',
      isCustomQuotationBooking: true,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Ananya Iyer', email: 'ananya.iyer@example.demo.invalid', phone: '+91 98450 99887', age: '29', gender: 'Female' },
      numberOfTravelers: 4,
      occupancy: 'Double Sharing',
      travelers: [
        { name: 'Ananya Iyer', age: '29', gender: 'Female', phone: '+91 98450 99887' },
        { name: 'Karthik Subramanian', age: '30', gender: 'Male', phone: '+91 98450 99888' },
        { name: 'Meera Nambiar', age: '28', gender: 'Female', phone: '+91 98450 99889' },
        { name: 'Arjun Nambiar', age: '31', gender: 'Male', phone: '+91 98450 99890' }
      ],
      tripSnapshot: {
        title: 'Meghalaya Explorer: Living Root Bridges & Waterfalls',
        destination: 'Shillong, Cherrapunji, Mawlynnong',
        location: 'Meghalaya',
        duration: '5D/4N',
        pickupPoint: 'Lokpriya Gopinath Bordoloi International Airport, Guwahati'
      },
      pricing: { basePricePerPerson: 18000, subtotal: 72000, taxes: 3600, finalAmount: 75600, amountPaid: 75600, amountOutstanding: 0, currency: 'INR' },
      quotationSnapshot: {
        tripRequirements: {
          startDate: now.toISOString().slice(0, 10),
          endDate: inDays(4).toISOString().slice(0, 10),
          duration: '5D/4N',
          notes: 'Focus on trekking and photography.'
        },
        selectedHotel: {
          optionId: 'hotel-cherra-eco',
          hotelName: 'Cherrapunji Eco-Resort',
          city: 'Cherrapunji',
          roomType: 'Canyon View Cottage',
          rooms: 2,
          checkIn: now,
          checkOut: inDays(4),
          nights: 4
        },
        selectedTransport: [
          {
            optionId: 'trans-innova-meghalaya',
            title: 'Dedicated AC Innova Crysta Guwahati to Meghalaya',
            mode: 'CAB',
            vehicle: 'Toyota Innova Crysta',
            provider: 'Northeast Express Mobility Network',
            route: { from: 'Guwahati Airport', to: 'Shillong & Cherrapunji Circuit', pickupPoint: 'Guwahati Airport Arrival Terminal' },
            schedule: { departureDate: now, arrivalDate: inDays(4) }
          }
        ],
        activities: [
          {
            activityId: 'act-root-bridge',
            name: 'Double Decker Living Root Bridge Guided Trek',
            location: 'Nongriat, Cherrapunji',
            date: inDays(1),
            isIncluded: true
          }
        ]
      }
    },

    // Scenario 4: Kerala Backwaters & Munnar Hills (Starts in 12 days, VENDOR DECLINE/REASSIGNMENT)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}04`,
      tripId: 'custom-kerala-backwaters-munnar',
      isCustomQuotationBooking: true,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Vikram Malhotra', email: 'vikram.m@example.demo.invalid', phone: '+91 99300 77112', age: '35', gender: 'Male' },
      numberOfTravelers: 2,
      occupancy: 'Double Sharing',
      travelers: [
        { name: 'Vikram Malhotra', age: '35', gender: 'Male', phone: '+91 99300 77112' },
        { name: 'Radhika Malhotra', age: '33', gender: 'Female', phone: '+91 99300 77113' }
      ],
      tripSnapshot: {
        title: 'Kerala Backwaters & Munnar Tea Sanctuaries',
        destination: 'Kochi, Munnar, Alleppey',
        location: 'Kerala',
        duration: '5D/4N',
        pickupPoint: 'Cochin International Airport'
      },
      pricing: { basePricePerPerson: 21000, subtotal: 42000, taxes: 2100, finalAmount: 44100, amountPaid: 44100, amountOutstanding: 0, currency: 'INR' },
      quotationSnapshot: {
        tripRequirements: {
          startDate: inDays(12).toISOString().slice(0, 10),
          endDate: inDays(16).toISOString().slice(0, 10),
          duration: '5D/4N',
          notes: 'Anniversary celebration journey.'
        },
        selectedHotel: {
          optionId: 'hotel-spice-munnar',
          hotelName: 'Spice Country Resorts Munnar',
          city: 'Munnar',
          roomType: 'Valley View Premium Room',
          rooms: 1,
          checkIn: inDays(12),
          checkOut: inDays(15),
          nights: 3
        },
        selectedTransport: [
          {
            optionId: 'trans-etios-kerala',
            title: 'Dedicated AC Sedan Kochi-Munnar-Alleppey',
            mode: 'CAB',
            vehicle: 'Toyota Etios AC',
            route: { from: 'Kochi Airport', to: 'Munnar & Alleppey Circuit', pickupPoint: 'Kochi Airport' },
            schedule: { departureDate: inDays(12), arrivalDate: inDays(16) }
          }
        ],
        activities: [
          {
            activityId: 'act-houseboat-alleppey',
            name: 'Alleppey Backwaters Deluxe Day Cruise with Kerala Lunch',
            location: 'Alleppey Finishing Point',
            date: inDays(15),
            isIncluded: true
          }
        ]
      }
    },

    // Scenario 5: Rajasthan Royal Circuit (Catalog, Ongoing, started 2 days ago, 6 travelers)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}05`,
      tripId: String(rajasthanTrip._id),
      batchId: 'batch-rajasthan-demo-01',
      isCustomQuotationBooking: false,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Neha Gupta', email: 'neha.gupta@example.demo.invalid', phone: '+91 98100 66554', age: '30', gender: 'Female' },
      numberOfTravelers: 6,
      occupancy: 'Double Sharing',
      tripSnapshot: {
        title: 'Rajasthan Royal Heritage: Jaipur, Jodhpur & Udaipur',
        destination: 'Rajasthan',
        location: 'Jaipur, Jodhpur, Udaipur',
        duration: '7D/6N',
        batchDate: rajasthanBatchDates,
        pickupPoint: 'Jaipur Junction Railway Station'
      },
      pricing: { basePricePerPerson: 24500, subtotal: 147000, taxes: 7350, finalAmount: 154350, amountPaid: 154350, amountOutstanding: 0, currency: 'INR' }
    },

    // Scenario 6: Spiti Valley High Altitude Expedition (Ended 10 days ago, 6 travelers, SETTLED COSTS)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}06`,
      tripId: 'custom-spiti-valley-expedition',
      isCustomQuotationBooking: true,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Siddharth Mehra', email: 'sid.mehra@example.demo.invalid', phone: '+91 98711 22334', age: '31', gender: 'Male' },
      numberOfTravelers: 6,
      occupancy: 'Triple Sharing',
      tripSnapshot: {
        title: 'Spiti Valley High Altitude Expedition: Kaza, Tabo & Chandratal',
        destination: 'Kaza, Tabo, Chandratal',
        location: 'Himachal Pradesh',
        duration: '8D/7N',
        pickupPoint: 'Shimla Old Bus Stand'
      },
      pricing: { basePricePerPerson: 28000, subtotal: 168000, taxes: 8400, finalAmount: 176400, amountPaid: 176400, amountOutstanding: 0, currency: 'INR' },
      quotationSnapshot: {
        tripRequirements: {
          startDate: daysAgo(17).toISOString().slice(0, 10),
          endDate: daysAgo(10).toISOString().slice(0, 10),
          duration: '8D/7N'
        },
        selectedHotel: {
          optionId: 'hotel-spiti-kaza',
          hotelName: 'Grand Dewachen Kaza',
          city: 'Kaza',
          roomType: 'Traditional Tibetan Suite',
          rooms: 2,
          checkIn: daysAgo(17),
          checkOut: daysAgo(10),
          nights: 7
        },
        selectedTransport: [
          {
            optionId: 'trans-4x4-spiti',
            title: '4x4 High-Clearance Force Gurkha Caravan',
            mode: 'CAB',
            vehicle: 'Force Gurkha 4x4',
            schedule: { departureDate: daysAgo(17), arrivalDate: daysAgo(10) }
          }
        ],
        activities: [
          {
            activityId: 'act-chandratal-camp',
            name: 'Chandratal Lake Wilderness Camp & Stargazing',
            location: 'Chandratal Lake',
            date: daysAgo(12),
            isIncluded: true
          }
        ]
      }
    },

    // Scenario 7: Andaman Coastal Discovery (Ended 5 days ago, 2 travelers, READY FOR CLOSURE)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}07`,
      tripId: 'custom-andaman-coastal-discovery',
      isCustomQuotationBooking: true,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Priya Nair', email: 'priya.nair@example.demo.invalid', phone: '+91 94460 33221', age: '28', gender: 'Female' },
      numberOfTravelers: 2,
      occupancy: 'Double Sharing',
      tripSnapshot: {
        title: 'Andaman Coastal Discovery: Havelock, Neil Island & Radhanagar',
        destination: 'Port Blair, Havelock, Neil Island',
        location: 'Andaman and Nicobar Islands',
        duration: '6D/5N',
        pickupPoint: 'Veer Savarkar International Airport, Port Blair'
      },
      pricing: { basePricePerPerson: 32000, subtotal: 64000, taxes: 3200, finalAmount: 67200, amountPaid: 67200, amountOutstanding: 0, currency: 'INR' },
      quotationSnapshot: {
        tripRequirements: {
          startDate: daysAgo(11).toISOString().slice(0, 10),
          endDate: daysAgo(5).toISOString().slice(0, 10),
          duration: '6D/5N'
        },
        selectedHotel: {
          optionId: 'hotel-havelock-beach',
          hotelName: 'Symphony Palms Beach Resort',
          city: 'Havelock Island',
          roomType: 'Lagoon Suite',
          rooms: 1,
          checkIn: daysAgo(11),
          checkOut: daysAgo(5),
          nights: 5
        },
        selectedTransport: [
          {
            optionId: 'trans-makruzz-ferry',
            title: 'Makruzz Premium Catamaran Ferry Transfers',
            mode: 'FERRY',
            vehicle: 'Makruzz Catamaran',
            schedule: { departureDate: daysAgo(11), arrivalDate: daysAgo(5) }
          }
        ],
        activities: [
          {
            activityId: 'act-elephant-beach-snorkeling',
            name: 'Elephant Beach Coral Snorkeling & Sea Walk',
            location: 'Havelock Island',
            date: daysAgo(8),
            isIncluded: true
          }
        ]
      }
    },

    // Scenario 8: Ladakh Monasteries & High Passes (Ended 30 days ago, 4 travelers, HISTORICALLY CLOSED)
    {
      bookingId: `${DEMO_BOOKING_PREFIX}08`,
      tripId: 'custom-ladakh-monasteries-passes',
      isCustomQuotationBooking: true,
      bookingStatus: 'CONFIRMED',
      paymentStatus: 'PAID',
      customer: { name: 'Karan Verma', email: 'karan.verma@example.demo.invalid', phone: '+91 98110 55443', age: '33', gender: 'Male' },
      numberOfTravelers: 4,
      occupancy: 'Double Sharing',
      tripSnapshot: {
        title: 'Ladakh High Passes: Leh, Nubra Valley & Pangong Tso',
        destination: 'Leh, Nubra, Pangong',
        location: 'Ladakh',
        duration: '7D/6N',
        pickupPoint: 'Kushok Bakula Rimpochee Airport, Leh'
      },
      pricing: { basePricePerPerson: 35000, subtotal: 140000, taxes: 7000, finalAmount: 147000, amountPaid: 147000, amountOutstanding: 0, currency: 'INR' },
      quotationSnapshot: {
        tripRequirements: {
          startDate: daysAgo(37).toISOString().slice(0, 10),
          endDate: daysAgo(30).toISOString().slice(0, 10),
          duration: '7D/6N'
        },
        selectedHotel: {
          optionId: 'hotel-leh-heritage',
          hotelName: 'The Grand Dragon Ladakh',
          city: 'Leh',
          roomType: 'Heritage Suite',
          rooms: 2,
          checkIn: daysAgo(37),
          checkOut: daysAgo(30),
          nights: 7
        },
        selectedTransport: [
          {
            optionId: 'trans-crysta-ladakh',
            title: '4x4 Mountain Cab with Oxygen Cylinder',
            mode: 'CAB',
            vehicle: 'Toyota Innova Crysta 4x4',
            schedule: { departureDate: daysAgo(37), arrivalDate: daysAgo(30) }
          }
        ],
        activities: [
          {
            activityId: 'act-nubra-camel-safari',
            name: 'Hunder Sand Dunes Double-Humped Camel Safari',
            location: 'Nubra Valley',
            date: daysAgo(33),
            isIncluded: true
          }
        ]
      }
    }
  ];

  const seededBookings = [];
  for (const bSeed of bookingSeeds) {
    const doc = await Booking.findOneAndUpdate(
      { bookingId: bSeed.bookingId },
      { ...bSeed, createdBy: actor.id, updatedBy: actor.id },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    seededBookings.push(doc);
  }
  console.log(`Seeded ${seededBookings.length} demo bookings.`);

  // =========================================================================
  // 4. MATERIALIZE OPERATIONAL TRIPS VIA ensureOperationalTrip
  // =========================================================================
  console.log('\n--- Materializing Operational Trips via ensureOperationalTrip ---');
  const ensuredTrips = new Map();

  // For custom trips: operationKey is `custom:${bookingId}`
  // For catalog trips: operationKey is derived by group
  for (const booking of seededBookings) {
    let operationKey = '';
    if (booking.isCustomQuotationBooking) {
      operationKey = `custom:${booking.bookingId}`;
    } else if (booking.bookingId === `${DEMO_BOOKING_PREFIX}02`) {
      operationKey = `catalog:${manaliTrip._id}:batch-manali-demo-01`;
    } else if (booking.bookingId === `${DEMO_BOOKING_PREFIX}05`) {
      operationKey = `catalog:${rajasthanTrip._id}:batch-rajasthan-demo-01`;
    }

    console.log(`Ensuring operational departure for key: "${operationKey}"...`);
    const ensured = await ensureOperationalTrip({ operationKey, actor });
    ensuredTrips.set(booking.bookingId, ensured);
    console.log(`  -> Ensured OperationalTrip ${ensured.operationalTrip._id} with ${ensured.services.length} services.`);
  }

  // =========================================================================
  // 5. CONFIGURE EACH DEMO SCENARIO SPECIFICS
  // =========================================================================
  console.log('\n--- Configuring Scenario Lifecycles & Coordination Records ---');

  // -------------------------------------------------------------------------
  // SCENARIO 1: Kashmir Winter Escape (NEEDS ATTENTION)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}01`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: now,
      coordinatorAssignedBy: actor.id,
      internalNotes: 'VIP winter group. Needs special attention on heating and transport confirmation.'
    });

    // Configure services:
    // 1. Hotel: CONFIRMED
    const hotelVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}01`);
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'HOTEL' },
      {
        vendorId: hotelVendor._id,
        vendorSnapshot: { vendorCode: hotelVendor.vendorCode, name: hotelVendor.name, type: 'HOTEL', phone: hotelVendor.contact.phone, email: hotelVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'KMR-CONF-8821',
        confirmedAt: daysAgo(1),
        confirmedBy: actor.id
      }
    );

    // 2. Transport: PENDING_CONFIRMATION (Attention trigger!)
    const transVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}02`);
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'TRANSPORT' },
      {
        vendorId: transVendor._id,
        vendorSnapshot: { vendorCode: transVendor.vendorCode, name: transVendor.name, type: 'TRANSPORT', phone: transVendor.contact.phone, email: transVendor.contact.email },
        confirmationStatus: 'PENDING_CONFIRMATION',
        confirmationRequestedAt: daysAgo(2)
      }
    );

    // 3. Activity: CONFIRMED
    const actVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}03`);
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'ACTIVITY' },
      {
        vendorId: actVendor._id,
        vendorSnapshot: { vendorCode: actVendor.vendorCode, name: actVendor.name, type: 'ACTIVITY', phone: actVendor.contact.phone, email: actVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'DAL-7712',
        confirmedAt: daysAgo(1),
        confirmedBy: actor.id
      }
    );

    // Standard Checklist: 1 High Priority Overdue Task
    const checklistSeeds = buildStandardChecklistSeeds({ group, hasTransport: true, actor, now });
    for (const seed of checklistSeeds) {
      const isOverdueTarget = seed.taskKey === 'standard:verify-pickup';
      await OperationalTask.findOneAndUpdate(
        { operationalTripId: operationalTrip._id, taskKey: seed.taskKey },
        {
          ...seed,
          operationalTripId: operationalTrip._id,
          contextSnapshot,
          status: isOverdueTarget ? 'TODO' : 'COMPLETED',
          priority: isOverdueTarget ? 'HIGH' : seed.priority,
          dueAt: isOverdueTarget ? daysAgo(1) : seed.dueAt, // Overdue!
          assignedTo: opsStaff._id
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    // Customer Communication Log
    await OperationalCommunication.create({
      operationalTripId: operationalTrip._id,
      contextSnapshot,
      direction: 'OUTBOUND',
      channel: 'WHATSAPP',
      communicationType: 'PRE_DEPARTURE_CONFIRMATION',
      summary: 'Winter clothing guidelines and flight arrival check shared with lead traveler Rohit Sharma.',
      details: 'Informed traveler that temperatures in Gulmarg are sub-zero. Reconfirmed winter gear and shared Srinagar arrival meeting point.',
      occurredAt: daysAgo(1),
      contactNameSnapshot: 'Rohit Sharma',
      loggedBy: actor.id
    });

    // Draft Operational Cost
    await OperationalCost.findOneAndUpdate(
      { costCode: `${DEMO_COST_PREFIX}01` },
      {
        costCode: `${DEMO_COST_PREFIX}01`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        category: 'HOTEL',
        description: 'Advance payment for 4 heated deluxe cottages at Srinagar (5 nights)',
        vendorId: hotelVendor._id,
        vendorSnapshot: { vendorCode: hotelVendor.vendorCode, name: hotelVendor.name, phone: hotelVendor.contact.phone, email: hotelVendor.contact.email },
        currency: 'INR',
        subtotal: 30000,
        taxAmount: 2000,
        adjustmentAmount: 0,
        totalAmount: 32000,
        incurredAt: daysAgo(2),
        dueDate: inDays(3),
        status: 'DRAFT',
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Scenario 1 configured: Kashmir trip needs attention (pending transport + overdue task).');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 2: Manali Backpacking Adventure (Catalog, READY)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}02`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: now,
      coordinatorAssignedBy: actor.id,
      internalNotes: 'All services confirmed and verified. Driver contact details sent to ground team.'
    });

    // Create 3 confirmed services for Catalog trip
    const hotelVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}04`);
    const transVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}05`);
    const actVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}06`);

    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceKey: 'hotel:pine-valley-manali' },
      {
        operationalTripId: operationalTrip._id,
        serviceKey: 'hotel:pine-valley-manali',
        serviceType: 'HOTEL',
        source: { type: 'CATALOG' },
        title: 'Pine Valley Luxury Resort - Group Quad Rooms',
        required: true,
        vendorId: hotelVendor._id,
        vendorSnapshot: { vendorCode: hotelVendor.vendorCode, name: hotelVendor.name, type: 'HOTEL', phone: hotelVendor.contact.phone, email: hotelVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'PVM-GRP-9021',
        confirmedAt: daysAgo(3),
        confirmedBy: actor.id,
        hotelDetails: { hotelName: 'Pine Valley Luxury Resort', city: 'Manali', rooms: 3, occupancy: 'Quad Sharing', checkIn: manaliStart, checkOut: manaliEnd },
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceKey: 'transport:urbania-delhi-manali' },
      {
        operationalTripId: operationalTrip._id,
        serviceKey: 'transport:urbania-delhi-manali',
        serviceType: 'TRANSPORT',
        source: { type: 'CATALOG' },
        title: 'Force Urbania 17-Seater Luxury Van (Delhi-Manali-Delhi)',
        required: true,
        vendorId: transVendor._id,
        vendorSnapshot: { vendorCode: transVendor.vendorCode, name: transVendor.name, type: 'TRANSPORT', phone: transVendor.contact.phone, email: transVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'NIM-URB-4410',
        confirmedAt: daysAgo(3),
        confirmedBy: actor.id,
        transportDetails: {
          mode: 'TEMPO_TRAVELLER',
          vehicleType: 'Force Urbania 17-Seater',
          vehicleNumber: 'DL-01-TC-8899',
          driverSnapshot: { name: 'Rajesh Kumar', phone: '+91 98160 12345', licenseNumber: 'HP-01-2022-9988' }
        },
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceKey: 'activity:solang-paragliding' },
      {
        operationalTripId: operationalTrip._id,
        serviceKey: 'activity:solang-paragliding',
        serviceType: 'ACTIVITY',
        source: { type: 'CATALOG' },
        title: 'Solang Valley High Fly Paragliding & Trek',
        required: true,
        vendorId: actVendor._id,
        vendorSnapshot: { vendorCode: actVendor.vendorCode, name: actVendor.name, type: 'ACTIVITY', phone: actVendor.contact.phone, email: actVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'ATI-SOL-1102',
        confirmedAt: daysAgo(2),
        confirmedBy: actor.id,
        activityDetails: { activityName: 'Solang Valley Paragliding', location: 'Solang Valley', travelerCount: 10 },
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // All checklist tasks completed
    const checklistSeeds = buildStandardChecklistSeeds({ group, hasTransport: true, actor, now });
    for (const seed of checklistSeeds) {
      await OperationalTask.findOneAndUpdate(
        { operationalTripId: operationalTrip._id, taskKey: seed.taskKey },
        {
          ...seed,
          operationalTripId: operationalTrip._id,
          contextSnapshot,
          status: 'COMPLETED',
          completedAt: daysAgo(1),
          completedBy: opsStaff._id,
          assignedTo: opsStaff._id
        },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }
    console.log('  -> Scenario 2 configured: Manali departure READY (all services confirmed, driver assigned).');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 3: Meghalaya Explorer (ACTIVE CUSTOMER INCIDENT)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}03`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: now,
      coordinatorAssignedBy: actor.id,
      internalNotes: 'Handling delayed airport pickup. Operations actively tracking backup vehicle.'
    });

    const hotelVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}08`);
    const transVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}07`);

    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'HOTEL' },
      {
        vendorId: hotelVendor._id,
        vendorSnapshot: { vendorCode: hotelVendor.vendorCode, name: hotelVendor.name, type: 'HOTEL', phone: hotelVendor.contact.phone, email: hotelVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'CER-MEG-3091',
        confirmedAt: daysAgo(1),
        confirmedBy: actor.id
      }
    );

    const transService = await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'TRANSPORT' },
      {
        vendorId: transVendor._id,
        vendorSnapshot: { vendorCode: transVendor.vendorCode, name: transVendor.name, type: 'TRANSPORT', phone: transVendor.contact.phone, email: transVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'NEM-GAU-1002',
        confirmedAt: daysAgo(1),
        confirmedBy: actor.id
      },
      { new: true }
    );

    // Create Active High-Severity Incident
    const incident = await OperationalIncident.findOneAndUpdate(
      { incidentCode: `${DEMO_INCIDENT_PREFIX}01` },
      {
        incidentCode: `${DEMO_INCIDENT_PREFIX}01`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        title: 'Airport pickup vehicle delayed at Guwahati Airport',
        incidentType: 'TRANSPORT_ISSUE',
        severity: 'HIGH',
        status: 'IN_PROGRESS',
        scope: 'SERVICE',
        linkedServiceId: transService._id,
        linkedVendorId: transVendor._id,
        serviceSnapshot: { serviceType: 'TRANSPORT', title: transService.title, vendorCode: transVendor.vendorCode, vendorName: transVendor.name },
        description: 'Customer Ananya Iyer called at 14:15 reporting that scheduled Innova Crysta had not arrived at Guwahati Airport Arrival Gate 2. Driver phone was initially switching off.',
        assignedTo: opsStaff._id,
        reportedAt: new Date(now.getTime() - 45 * 60 * 1000), // 45 mins ago
        reportedBy: actor.id,
        actionTaken: 'Contacted Northeast Express fleet manager Biren Kalita. Driver experienced breakdown on highway. Backup vehicle (Innova AS-01-EA-3321, driver Dipankar Das, +91 94350 44556) dispatched and 15 mins away.',
        history: [
          { action: 'REPORTED', fromStatus: '', toStatus: 'OPEN', note: 'Customer reported delayed airport pickup.', actorId: actor.id, actorName: actor.name, at: new Date(now.getTime() - 45 * 60 * 1000) },
          { action: 'ASSIGNED', fromStatus: 'OPEN', toStatus: 'OPEN', note: 'Assigned to Operations Coordinator.', actorId: actor.id, actorName: actor.name, at: new Date(now.getTime() - 40 * 60 * 1000) },
          { action: 'STARTED', fromStatus: 'OPEN', toStatus: 'IN_PROGRESS', note: 'Dispatching backup cab from airport staging area.', actorId: actor.id, actorName: actor.name, at: new Date(now.getTime() - 30 * 60 * 1000) },
          { action: 'CUSTOMER_UPDATED', fromStatus: 'IN_PROGRESS', toStatus: 'IN_PROGRESS', note: 'Spoke to Ananya Iyer. Shared backup driver name & number.', actorId: actor.id, actorName: actor.name, at: new Date(now.getTime() - 20 * 60 * 1000) }
        ],
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Customer Communication Log
    await OperationalCommunication.create({
      operationalTripId: operationalTrip._id,
      contextSnapshot,
      direction: 'OUTBOUND',
      channel: 'PHONE',
      communicationType: 'CUSTOMER_QUERY',
      summary: 'Spoke with lead guest Ananya Iyer regarding airport pickup delay and backup dispatch.',
      details: 'Informed guest about highway traffic delay. Confirmed backup Innova Crysta (driver Dipankar Das) is arriving at Gate 2 within 15 minutes. Guest acknowledged and thanked.',
      occurredAt: new Date(now.getTime() - 20 * 60 * 1000),
      contactNameSnapshot: 'Ananya Iyer',
      relatedServiceId: transService._id,
      relatedIncidentId: incident._id,
      loggedBy: actor.id
    });

    // Follow-up task for the incident
    await OperationalTask.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, taskKey: 'followup:guwahati-pickup-boarded' },
      {
        operationalTripId: operationalTrip._id,
        taskKey: 'followup:guwahati-pickup-boarded',
        source: 'INCIDENT_FOLLOWUP',
        contextSnapshot,
        title: 'Confirm travelers safely boarded Guwahati backup cab',
        description: 'Verify with driver Dipankar Das that Ananya and all 3 co-passengers are inside vehicle and en-route to Shillong.',
        category: 'DURING_TRIP',
        status: 'IN_PROGRESS',
        priority: 'CRITICAL',
        assignedTo: opsStaff._id,
        dueAt: new Date(now.getTime() + 30 * 60 * 1000), // Due in 30 mins
        linkedIncidentId: incident._id,
        linkedServiceId: transService._id,
        history: [{ action: 'CREATED', fromStatus: null, toStatus: 'IN_PROGRESS', note: 'Created from delayed pickup incident.', actorId: actor.id, actorName: actor.name, at: now }],
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Scenario 3 configured: Meghalaya trip with active HIGH incident & phone communication.');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 4: Kerala Backwaters & Munnar Hills (VENDOR DECLINE & REASSIGNMENT)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}04`);
    const replacementHotelVendor = seededVendors.get(`${DEMO_VENDOR_PREFIX}09`);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: now,
      coordinatorAssignedBy: actor.id,
      internalNotes: 'Primary hotel partner declined due to sold-out inventory. Successfully reassigned to Spice Country Resorts.'
    });

    // Update Hotel service to reflect full decline -> reassignment -> confirmation history
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'HOTEL' },
      {
        vendorId: replacementHotelVendor._id,
        vendorSnapshot: { vendorCode: replacementHotelVendor.vendorCode, name: replacementHotelVendor.name, type: 'HOTEL', phone: replacementHotelVendor.contact.phone, email: replacementHotelVendor.contact.email },
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'SC-MNR-4412',
        confirmedAt: daysAgo(2),
        confirmedBy: actor.id,
        history: [
          { action: 'CREATED', fromStatus: null, toStatus: 'UNASSIGNED', note: 'Seeded from quotation.', actorId: actor.id, actorName: actor.name, at: daysAgo(5) },
          { action: 'VENDOR_ASSIGNED', fromStatus: 'UNASSIGNED', toStatus: 'PENDING_CONFIRMATION', note: 'Requested confirmation from Tea Valley Resort.', actorId: actor.id, actorName: actor.name, at: daysAgo(4) },
          { action: 'DECLINED', fromStatus: 'PENDING_CONFIRMATION', toStatus: 'DECLINED', note: 'Vendor declined: No deluxe valley view inventory available for requested dates.', actorId: actor.id, actorName: actor.name, at: daysAgo(3) },
          { action: 'VENDOR_CHANGED', fromStatus: 'DECLINED', toStatus: 'PENDING_CONFIRMATION', note: 'Reassigned to Spice Country Resorts Munnar.', actorId: actor.id, actorName: actor.name, at: daysAgo(3) },
          { action: 'CONFIRMED', fromStatus: 'PENDING_CONFIRMATION', toStatus: 'CONFIRMED', note: 'Spice Country confirmed Valley View cottage #204.', actorId: actor.id, actorName: actor.name, at: daysAgo(2) }
        ]
      }
    );

    // Confirm Transport and Activity
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'TRANSPORT' },
      { confirmationStatus: 'CONFIRMED', confirmationNumber: 'KCH-CAB-7719', confirmedAt: daysAgo(2), confirmedBy: actor.id }
    );
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceType: 'ACTIVITY' },
      { confirmationStatus: 'CONFIRMED', confirmationNumber: 'ALP-HB-3301', confirmedAt: daysAgo(2), confirmedBy: actor.id }
    );
    console.log('  -> Scenario 4 configured: Kerala trip demonstrated Vendor Decline & Reassignment lifecycle.');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 5: Rajasthan Royal Circuit (Catalog, ONGOING)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}05`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: daysAgo(3),
      coordinatorAssignedBy: actor.id,
      internalNotes: 'Journey currently ongoing. Travelers reached Jodhpur today.'
    });

    // Create services for Catalog ongoing trip
    await OperationalService.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, serviceKey: 'hotel:rajasthan-heritage' },
      {
        operationalTripId: operationalTrip._id,
        serviceKey: 'hotel:rajasthan-heritage',
        serviceType: 'HOTEL',
        source: { type: 'CATALOG' },
        title: 'Heritage Palaces Circuit (Jaipur, Jodhpur, Udaipur)',
        required: true,
        confirmationStatus: 'CONFIRMED',
        confirmationNumber: 'RAJ-HRTG-5542',
        confirmedAt: daysAgo(5),
        confirmedBy: actor.id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Mid-trip task IN_PROGRESS
    await OperationalTask.findOneAndUpdate(
      { operationalTripId: operationalTrip._id, taskKey: 'standard:midtrip-checkin' },
      {
        operationalTripId: operationalTrip._id,
        taskKey: 'standard:midtrip-checkin',
        source: 'STANDARD_CHECKLIST',
        contextSnapshot,
        title: 'Mid-trip customer check-in',
        description: 'Call Neha Gupta to review hotel comfort and driver experience at halfway mark in Jodhpur.',
        category: 'DURING_TRIP',
        status: 'IN_PROGRESS',
        priority: 'NORMAL',
        assignedTo: opsStaff._id,
        dueAt: inDays(1),
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Minor resolved incident
    await OperationalIncident.findOneAndUpdate(
      { incidentCode: `${DEMO_INCIDENT_PREFIX}02` },
      {
        incidentCode: `${DEMO_INCIDENT_PREFIX}02`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        title: 'Room AC remote battery dead at Jodhpur hotel',
        incidentType: 'HOTEL_ISSUE',
        severity: 'LOW',
        status: 'RESOLVED',
        scope: 'TRIP_WIDE',
        description: 'Guest mentioned room AC remote was unresponsive at check-in.',
        actionTaken: 'Hotel front desk delivered fresh batteries and tested air conditioning in 10 minutes.',
        resolutionSummary: 'Issue resolved within 10 minutes by hotel staff.',
        resolvedAt: daysAgo(1),
        resolvedBy: opsStaff._id,
        reportedAt: daysAgo(1),
        reportedBy: actor.id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Scenario 5 configured: Rajasthan ONGOING departure with active coordination.');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 6: Spiti Valley High Altitude Expedition (COMPLETED, SETTLED COSTS)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}06`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: daysAgo(20),
      coordinatorAssignedBy: actor.id,
      internalNotes: 'Journey ended successfully. Full vendor reconciliation and guest feedback complete.'
    });

    // Confirm all services
    await OperationalService.updateMany({ operationalTripId: operationalTrip._id }, { confirmationStatus: 'CONFIRMED', confirmedAt: daysAgo(18), confirmedBy: actor.id });

    // Mark all tasks completed
    const checklistSeeds = buildStandardChecklistSeeds({ group, hasTransport: true, actor, now });
    for (const seed of checklistSeeds) {
      await OperationalTask.findOneAndUpdate(
        { operationalTripId: operationalTrip._id, taskKey: seed.taskKey },
        { ...seed, operationalTripId: operationalTrip._id, contextSnapshot, status: 'COMPLETED', completedAt: daysAgo(10), completedBy: opsStaff._id, assignedTo: opsStaff._id },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    // Finalized Operational Costs & Settlements
    const costHotel = await OperationalCost.findOneAndUpdate(
      { costCode: `${DEMO_COST_PREFIX}02` },
      {
        costCode: `${DEMO_COST_PREFIX}02`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        category: 'HOTEL',
        description: 'Spiti Homestay & Hotel Collective accommodations (7 nights, 6 travelers)',
        payeeName: 'Spiti Homestay Collective',
        currency: 'INR',
        subtotal: 40000,
        taxAmount: 2000,
        adjustmentAmount: 0,
        totalAmount: 42000,
        incurredAt: daysAgo(15),
        status: 'FINALIZED',
        finalizedAt: daysAgo(11),
        finalizedBy: opsStaff._id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Settlement for Hotel: Full ₹42,000 paid via BANK_TRANSFER
    await OperationalSettlement.findOneAndUpdate(
      { settlementCode: `${DEMO_SETTLEMENT_PREFIX}01` },
      {
        settlementCode: `${DEMO_SETTLEMENT_PREFIX}01`,
        operationalTripId: operationalTrip._id,
        operationalCostId: costHotel._id,
        amount: 42000,
        currency: 'INR',
        paymentMethod: 'BANK_TRANSFER',
        externalReference: 'HDFC-NEFT-99120044',
        paidAt: daysAgo(10),
        status: 'RECORDED',
        notes: 'Full payment cleared against final stay invoice #SP-2026-99.',
        recordedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    const costTrans = await OperationalCost.findOneAndUpdate(
      { costCode: `${DEMO_COST_PREFIX}03` },
      {
        costCode: `${DEMO_COST_PREFIX}03`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        category: 'TRANSPORT',
        description: '4x4 Mountain Cab fleet & fuel for high pass crossing',
        payeeName: 'Himalayan 4x4 Adventures',
        currency: 'INR',
        subtotal: 18000,
        taxAmount: 500,
        adjustmentAmount: 0,
        totalAmount: 18500,
        incurredAt: daysAgo(15),
        status: 'FINALIZED',
        finalizedAt: daysAgo(11),
        finalizedBy: opsStaff._id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Settlement for Transport: Full ₹18,500 paid via UPI
    await OperationalSettlement.findOneAndUpdate(
      { settlementCode: `${DEMO_SETTLEMENT_PREFIX}02` },
      {
        settlementCode: `${DEMO_SETTLEMENT_PREFIX}02`,
        operationalTripId: operationalTrip._id,
        operationalCostId: costTrans._id,
        amount: 18500,
        currency: 'INR',
        paymentMethod: 'UPI',
        externalReference: 'UPI-REF-99220011',
        paidAt: daysAgo(9),
        status: 'RECORDED',
        notes: 'UPI transfer to driver union account.',
        recordedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    const costActivity = await OperationalCost.findOneAndUpdate(
      { costCode: `${DEMO_COST_PREFIX}04` },
      {
        costCode: `${DEMO_COST_PREFIX}04`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        category: 'ACTIVITY',
        description: 'Chandratal Lake Wilderness Dome Tents & Astro Equipment',
        payeeName: 'Kaza High Trails Outpost',
        currency: 'INR',
        subtotal: 9000,
        taxAmount: 0,
        adjustmentAmount: 0,
        totalAmount: 9000,
        incurredAt: daysAgo(14),
        status: 'FINALIZED',
        finalizedAt: daysAgo(11),
        finalizedBy: opsStaff._id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Settlement for Activity: Full ₹9,000 paid
    await OperationalSettlement.findOneAndUpdate(
      { settlementCode: `${DEMO_SETTLEMENT_PREFIX}03` },
      {
        settlementCode: `${DEMO_SETTLEMENT_PREFIX}03`,
        operationalTripId: operationalTrip._id,
        operationalCostId: costActivity._id,
        amount: 9000,
        currency: 'INR',
        paymentMethod: 'BANK_TRANSFER',
        externalReference: 'ICICI-IMPS-884433',
        paidAt: daysAgo(8),
        status: 'RECORDED',
        notes: 'Cleared against camp invoice.',
        recordedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    const costGuide = await OperationalCost.findOneAndUpdate(
      { costCode: `${DEMO_COST_PREFIX}05` },
      {
        costCode: `${DEMO_COST_PREFIX}05`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        category: 'GUIDE',
        description: 'Local Spiti Mountaineering Guide Honorarium',
        payeeName: 'Tenzin Norbu (Spiti Local Guide Union)',
        currency: 'INR',
        subtotal: 6000,
        taxAmount: 0,
        adjustmentAmount: 0,
        totalAmount: 6000,
        incurredAt: daysAgo(13),
        status: 'FINALIZED',
        finalizedAt: daysAgo(11),
        finalizedBy: opsStaff._id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Settlement for Guide: Partial ₹3,000 paid via UPI (demonstrates partial settlement!)
    await OperationalSettlement.findOneAndUpdate(
      { settlementCode: `${DEMO_SETTLEMENT_PREFIX}04` },
      {
        settlementCode: `${DEMO_SETTLEMENT_PREFIX}04`,
        operationalTripId: operationalTrip._id,
        operationalCostId: costGuide._id,
        amount: 3000,
        currency: 'INR',
        paymentMethod: 'UPI',
        externalReference: 'UPI-REF-33445511',
        paidAt: daysAgo(8),
        status: 'RECORDED',
        notes: 'Advance guide fee paid; remaining ₹3,000 pending receipt of signed logbook.',
        recordedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Customer Feedback
    await OperationalFeedback.findOneAndUpdate(
      { operationalTripId: operationalTrip._id },
      {
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        bookingId: seededBookings[5]._id,
        customerSnapshot: { name: 'Siddharth Mehra', bookingId: `${DEMO_BOOKING_PREFIX}06` },
        rating: 5,
        comments: 'Incredible trip coordination across Kaza and Chandratal! Driver Stanzin was exceptional on treacherous roads, and the camps were spotless.',
        highlights: 'Chandratal stargazing, Key Monastery blessing with butter tea.',
        concerns: 'High altitude headache on day 2, but trip leader handled with portable oxygen canister smoothly.',
        sourceChannel: 'WHATSAPP',
        receivedAt: daysAgo(9),
        recordedBy: opsStaff._id,
        updatedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Scenario 6 configured: Spiti Valley COMPLETED with ₹75.5k finalized costs & partial settlement demonstration.');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 7: Andaman Coastal Discovery (READY FOR CLOSURE)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}07`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: daysAgo(12),
      coordinatorAssignedBy: actor.id,
      internalNotes: 'Journey ended 5 days ago. All required services confirmed, all tasks closed, costs finalized and settled. READY FOR CLOSURE.'
    });

    // Confirm all services
    await OperationalService.updateMany({ operationalTripId: operationalTrip._id }, { confirmationStatus: 'CONFIRMED', confirmedAt: daysAgo(10), confirmedBy: actor.id });

    // Mark all tasks completed
    const checklistSeeds = buildStandardChecklistSeeds({ group, hasTransport: true, actor, now });
    for (const seed of checklistSeeds) {
      await OperationalTask.findOneAndUpdate(
        { operationalTripId: operationalTrip._id, taskKey: seed.taskKey },
        { ...seed, operationalTripId: operationalTrip._id, contextSnapshot, status: 'COMPLETED', completedAt: daysAgo(5), completedBy: opsStaff._id, assignedTo: opsStaff._id },
        { upsert: true, setDefaultsOnInsert: true }
      );
    }

    // Finalized & Fully Settled Cost
    const costAndaman = await OperationalCost.findOneAndUpdate(
      { costCode: `${DEMO_COST_PREFIX}06` },
      {
        costCode: `${DEMO_COST_PREFIX}06`,
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        category: 'HOTEL',
        description: 'Symphony Palms Lagoon Suite accommodation & ferry charges',
        payeeName: 'Andaman Island Hospitality Co.',
        currency: 'INR',
        subtotal: 52000,
        taxAmount: 3000,
        adjustmentAmount: 0,
        totalAmount: 55000,
        incurredAt: daysAgo(8),
        status: 'FINALIZED',
        finalizedAt: daysAgo(6),
        finalizedBy: opsStaff._id,
        createdBy: actor.id,
        updatedBy: actor.id
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await OperationalSettlement.findOneAndUpdate(
      { settlementCode: `${DEMO_SETTLEMENT_PREFIX}05` },
      {
        settlementCode: `${DEMO_SETTLEMENT_PREFIX}05`,
        operationalTripId: operationalTrip._id,
        operationalCostId: costAndaman._id,
        amount: 55000,
        currency: 'INR',
        paymentMethod: 'BANK_TRANSFER',
        externalReference: 'HDFC-RTGS-ANDAMAN-9988',
        paidAt: daysAgo(5),
        status: 'RECORDED',
        notes: 'Full settlement completed before trip closure.',
        recordedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Feedback
    await OperationalFeedback.findOneAndUpdate(
      { operationalTripId: operationalTrip._id },
      {
        operationalTripId: operationalTrip._id,
        contextSnapshot,
        bookingId: seededBookings[6]._id,
        customerSnapshot: { name: 'Priya Nair', bookingId: `${DEMO_BOOKING_PREFIX}07` },
        rating: 5,
        comments: 'Breathtaking Havelock sunsets. The Makruzz ferry boarding was smooth and hassle-free.',
        highlights: 'Elephant beach scuba diving.',
        sourceChannel: 'EMAIL',
        receivedAt: daysAgo(4),
        recordedBy: opsStaff._id,
        updatedBy: opsStaff._id
      },
      { upsert: true, setDefaultsOnInsert: true }
    );

    // Ensure closure status is OPEN so Admin can test the "Close Trip" button in UI!
    await OperationalTripClosure.findOneAndUpdate(
      { operationalTripId: operationalTrip._id },
      {
        operationalTripId: operationalTrip._id,
        closureStatus: 'OPEN',
        history: []
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Scenario 7 configured: Andaman trip READY FOR CLOSURE (eligible for UI close button).');
  }

  // -------------------------------------------------------------------------
  // SCENARIO 8: Ladakh Monasteries & High Passes (HISTORICALLY CLOSED)
  // -------------------------------------------------------------------------
  {
    const { operationalTrip, group } = ensuredTrips.get(`${DEMO_BOOKING_PREFIX}08`);
    const contextSnapshot = buildOperationsContextSnapshot(group);

    // Assign coordinator
    await OperationalTrip.findByIdAndUpdate(operationalTrip._id, {
      coordinatorId: opsStaff._id,
      coordinatorAssignedAt: daysAgo(40),
      coordinatorAssignedBy: actor.id,
      internalNotes: 'Trip historically completed and closed. Reopenable only by Administrator.'
    });

    // Confirm services & tasks
    await OperationalService.updateMany({ operationalTripId: operationalTrip._id }, { confirmationStatus: 'CONFIRMED', confirmedAt: daysAgo(35), confirmedBy: actor.id });

    // Mark closure as CLOSED
    await OperationalTripClosure.findOneAndUpdate(
      { operationalTripId: operationalTrip._id },
      {
        operationalTripId: operationalTrip._id,
        closureStatus: 'CLOSED',
        actualEndAt: daysAgo(30),
        closureSummary: 'Post-travel reconciliation finished. All guest permits, Nubra Valley camp dues, and Leh taxi association settlements reconciled without discrepancies. Overall traveler rating 4.8/5.',
        closedAt: daysAgo(25),
        closedBy: adminStaff._id,
        finalSnapshot: {
          operationKey: operationalTrip.operationKey,
          title: group.title,
          destination: group.destination,
          closedAt: daysAgo(25),
          closedBy: adminStaff.name || 'Admin',
          travelerCount: 4,
          serviceSummary: { total: 3, confirmed: 3, cancelled: 0 },
          financialSummary: { totalCost: 110000, totalPaid: 110000, vendorOutstanding: 0 }
        },
        history: [
          { action: 'CLOSED', note: 'Financial and operational audit approved by management.', actorId: adminStaff._id, actorName: adminStaff.name || 'Admin', at: daysAgo(25) }
        ]
      },
      { upsert: true, setDefaultsOnInsert: true }
    );
    console.log('  -> Scenario 8 configured: Ladakh trip HISTORICALLY CLOSED (read-only, mutation blocked).');
  }

  console.log('\n=============================================================');
  console.log('🎉 OPERATIONS DEMO SEEDING COMPLETED SUCCESSFULLY!');
  console.log('All 8 operational scenarios are live in MongoDB and ready for browser inspection.');
  console.log('=============================================================');
}

import path from 'path';
import { fileURLToPath } from 'url';

// Direct execution CLI runner
const isDirectRun = Boolean(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url));
if (isDirectRun) {
  const connected = await connectDB();
  if (!connected) {
    console.error('Database connection failed. Exiting.');
    process.exit(1);
  }

  try {
    if (process.argv.includes('--cleanup')) {
      await cleanupOperationsDemo();
    } else {
      await seedOperationsDemo();
    }
  } catch (err) {
    console.error('Error during operations demo execution:', err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}
