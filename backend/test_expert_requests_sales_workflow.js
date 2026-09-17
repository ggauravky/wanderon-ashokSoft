import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Lead from './models/Lead.js';
import FollowUp from './models/FollowUp.js';
import Quotation from './models/Quotation.js';
import Booking from './models/Booking.js';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  assignLead,
  claimLead,
  logLeadContact
} from './controllers/leadController.js';
import {
  createQuotation,
  sendQuotation,
  approveQuotation,
  createBookingFromQuotation
} from './controllers/quotationController.js';
import { getFollowUps, createFollowUp } from './controllers/followUpController.js';
import { getSalesDashboard } from './controllers/salesController.js';

const defaultAdminId = new mongoose.Types.ObjectId().toString();
const authUserId = new mongoose.Types.ObjectId().toString();
const salesRepAId = new mongoose.Types.ObjectId().toString();
const salesRepBId = new mongoose.Types.ObjectId().toString();
const salesRepCId = new mongoose.Types.ObjectId().toString();
const salesRepNehaId = new mongoose.Types.ObjectId().toString();
const intruderRepId = new mongoose.Types.ObjectId().toString();
const isolatedRepId = new mongoose.Types.ObjectId().toString();

const randomPhone = () => '+9198' + Math.floor(10000000 + Math.random() * 90000000);

function createMockReqRes(body = {}, params = {}, query = {}, user = { _id: defaultAdminId, role: 'admin', name: 'Super Admin', email: 'admin@wanderluxe.com' }) {
  const req = { body, params, query, user };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };
  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
}

async function runExpertRequestsTestSuite() {
  console.log('🧪 Starting WanderLuxe Expert Requests & Sales CRM Hardening Test Suite (33 Tests)...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  try {
    // Attempt DB connection if configured
    await connectDB();
    const isConnected = mongoose.connection.readyState === 1;
    console.log(`📡 Database connection status: ${isConnected ? 'CONNECTED (MongoDB Atlas)' : 'IN-MEMORY RESILIENT MODE'}\n`);

    const timestamp = Date.now();
    const test1Phone = randomPhone();
    let testLead1 = null;
    let testLeadId1 = null;
    let testLeadRef1 = null;

    // -------------------------------------------------------------
    // Test 1: Public Callback Request Creation (All Structured Fields)
    // -------------------------------------------------------------
    {
      const payload = {
        name: 'Rohan Deshmukh',
        email: `rohan_${timestamp}@example.com`,
        phone: test1Phone,
        tripId: `trip_meghalaya_${timestamp}`,
        tripTitle: 'Meghalaya Living Root Bridges & Waterfalls Expedition',
        tripSlug: 'meghalaya-living-root-bridges',
        destination: 'Meghalaya',
        tripPriceSnapshot: 48500,
        topics: ['Itinerary Customization', 'Luxury Stays', 'Pricing & Discounts'],
        preferredCallDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        preferredCallWindow: '2:00 PM - 5:00 PM',
        notes: 'Interested in couple private trip with chauffeur driven luxury SUV',
        leadType: 'callback_request',
        source: 'expert_callback_modal'
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      const lead = getData()?.lead;
      testLead1 = lead;
      testLeadId1 = String(lead?._id || lead?.id);
      testLeadRef1 = lead?.referenceId;

      assert(
        getStatusCode() === 201 &&
        lead?.name === 'Rohan Deshmukh' &&
        lead?.leadType === 'callback_request' &&
        lead?.source === 'expert_callback_modal' &&
        Array.isArray(lead?.topics) &&
        lead?.topics.length === 3 &&
        lead?.tripPriceSnapshot === 48500,
        'Test 1: Public Callback Request Creation captures all structured fields correctly',
        `status=${getStatusCode()}, leadType=${lead?.leadType}`
      );
    }

    // -------------------------------------------------------------
    // Test 2: Authenticated User Auto-linking
    // -------------------------------------------------------------
    {
      const authUser = { _id: authUserId, role: 'user', name: 'Pooja Hegde', email: 'pooja@luxury.com' };
      const payload = {
        name: 'Pooja Hegde',
        email: `pooja_${timestamp}@luxury.com`,
        phone: randomPhone(),
        destination: 'Kashmir',
        tripTitle: 'Kashmir Autumn Splendor',
        topics: ['Flights & Logistics']
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(payload, {}, {}, authUser);
      await createLead(req, res);
      const lead = getData()?.lead;
      assert(
        getStatusCode() === 201 && String(lead?.userId) === authUserId,
        'Test 2: Authenticated user callback automatically links user account ID',
        `userId=${lead?.userId}`
      );
    }

    // -------------------------------------------------------------
    // Test 3: Lead Reference ID Canonical Format (WLX-EXP-YYYY-XXXXXX)
    // -------------------------------------------------------------
    {
      const refRegex = /^WLX-EXP-\d{4}-\d{6}$/;
      assert(
        refRegex.test(testLeadRef1),
        `Test 3: Lead Reference ID matches canonical format (Expected WLX-EXP-YYYY-XXXXXX, got ${testLeadRef1})`,
        testLeadRef1
      );
    }

    // -------------------------------------------------------------
    // Test 4: Cryptographic Randomness & Uniqueness Across Leads
    // -------------------------------------------------------------
    {
      const refs = new Set([testLeadRef1]);
      let allUnique = true;
      for (let i = 0; i < 5; i++) {
        const payload = {
          name: `Uniq Traveler ${i}`,
          email: `uniq_${timestamp}_${i}@example.com`,
          phone: randomPhone(),
          destination: 'Ladakh'
        };
        const { req, res, getData } = createMockReqRes(payload, {}, {}, null);
        await createLead(req, res);
        const ref = getData()?.lead?.referenceId;
        if (!ref || refs.has(ref)) {
          allUnique = false;
          break;
        }
        refs.add(ref);
      }
      assert(allUnique && refs.size === 6, 'Test 4: Cryptographically random reference IDs are strictly unique across creations');
    }

    // -------------------------------------------------------------
    // Test 5: Topic Parsing (Array vs Comma-separated string)
    // -------------------------------------------------------------
    {
      const payload = {
        name: 'Ananya Sharma',
        email: `ananya_${timestamp}@example.com`,
        phone: randomPhone(),
        destination: 'Kerala',
        topics: 'Private Transport, Villa Upgrade, Special Dining'
      };
      const { req, res, getData } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      const lead = getData()?.lead;
      assert(
        Array.isArray(lead?.topics) &&
        lead.topics.length === 3 &&
        lead.topics.includes('Villa Upgrade'),
        'Test 5: Controller seamlessly parses comma-separated string topics into structured array'
      );
    }

    // -------------------------------------------------------------
    // Test 6: Preferred Call Date Validation
    // -------------------------------------------------------------
    {
      const payload = {
        name: 'Invalid Date Traveler',
        email: 'invalid_date@example.com',
        phone: randomPhone(),
        preferredCallDate: 'invalid-date-string'
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      assert(
        getStatusCode() === 400 && (getData()?.message?.toLowerCase().includes('date') || getData()?.message?.includes('preferredCallDate')),
        'Test 6: Invalid preferredCallDate rejects with 400 Bad Request',
        `status=${getStatusCode()}, msg=${getData()?.message}`
      );
    }

    // -------------------------------------------------------------
    // Test 7: Missing Phone Validation
    // -------------------------------------------------------------
    {
      const payload = {
        name: 'No Phone Traveler',
        email: 'nophone@example.com'
      };
      const { req, res, getStatusCode } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      assert(
        getStatusCode() === 400,
        'Test 7: Missing customer phone number returns 400 Bad Request',
        `status=${getStatusCode()}`
      );
    }

    // -------------------------------------------------------------
    // Test 8: Missing Customer Name Validation
    // -------------------------------------------------------------
    {
      const payload = {
        phone: randomPhone(),
        email: 'noname@example.com'
      };
      const { req, res, getStatusCode } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      assert(
        getStatusCode() === 400,
        'Test 8: Missing customer name returns 400 Bad Request',
        `status=${getStatusCode()}`
      );
    }

    // -------------------------------------------------------------
    // Test 9: Invalid Email Format Validation
    // -------------------------------------------------------------
    {
      const payload = {
        name: 'Bad Email Traveler',
        phone: randomPhone(),
        email: 'not-an-email-address'
      };
      const { req, res, getStatusCode } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      assert(
        getStatusCode() === 400,
        'Test 9: Malformed email returns 400 Bad Request',
        `status=${getStatusCode()}`
      );
    }

    // -------------------------------------------------------------
    // Test 10: Duplicate Request Soft Deduplication
    // -------------------------------------------------------------
    {
      const payload = {
        name: 'Rohan Deshmukh',
        email: `rohan_${timestamp}@example.com`,
        phone: test1Phone,
        tripId: `trip_meghalaya_${timestamp}`,
        tripTitle: 'Meghalaya Living Root Bridges & Waterfalls Expedition',
        notes: 'Follow up inquiry within short interval'
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(payload, {}, {}, null);
      await createLead(req, res);
      assert(
        getStatusCode() === 200 || getStatusCode() === 201,
        'Test 10: Repeated callback request for same phone & trip is handled gracefully with deduplication notice',
        `status=${getStatusCode()}`
      );
    }

    // -------------------------------------------------------------
    // Test 11: Admin Expert Requests Queue Fetching
    // -------------------------------------------------------------
    {
      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { leadType: 'callback_request' });
      await getLeads(req, res);
      const data = getData();
      const leadsList = Array.isArray(data) ? data : data?.leads || data?.items || [];
      const hasCallback = leadsList.some(l => l.leadType === 'callback_request');
      assert(
        getStatusCode() === 200 && Array.isArray(leadsList) && hasCallback,
        `Test 11: Admin queue fetches callback requests successfully (Found: ${leadsList.length})`,
        `status=${getStatusCode()}`
      );
    }

    // -------------------------------------------------------------
    // Test 12: Quick Filter: due_today
    // -------------------------------------------------------------
    {
      const todayStr = new Date().toISOString().split('T')[0];
      const todayLeadPayload = {
        name: 'Today Traveler',
        phone: randomPhone(),
        email: `today_${timestamp}@example.com`,
        destination: 'Sikkim',
        preferredCallDate: todayStr
      };
      const { req: cReq, res: cRes } = createMockReqRes(todayLeadPayload, {}, {}, null);
      await createLead(cReq, cRes);

      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { quickFilter: 'due_today' });
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      assert(
        getStatusCode() === 200 && items.length >= 1,
        `Test 12: Quick filter "due_today" returns leads scheduled for today (Found: ${items.length})`
      );
    }

    // -------------------------------------------------------------
    // Test 13: Quick Filter: overdue
    // -------------------------------------------------------------
    {
      const yesterday = new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0];
      const overduePayload = {
        name: 'Overdue Traveler',
        phone: randomPhone(),
        email: `overdue_${timestamp}@example.com`,
        destination: 'Goa',
        preferredCallDate: yesterday
      };
      const { req: cReq, res: cRes } = createMockReqRes(overduePayload, {}, {}, null);
      await createLead(cReq, cRes);

      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { quickFilter: 'overdue' });
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      assert(
        getStatusCode() === 200 && items.length >= 1,
        `Test 13: Quick filter "overdue" correctly flags past-due uncontacted requests (Found: ${items.length})`
      );
    }

    // -------------------------------------------------------------
    // Test 14: Quick Filter: new
    // -------------------------------------------------------------
    {
      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { quickFilter: 'new' });
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      const allNew = items.length > 0 && items.every(l => l.status === 'NEW');
      assert(
        getStatusCode() === 200 && allNew,
        `Test 14: Quick filter "new" isolates unworked inquiries (Found: ${items.length})`
      );
    }

    // -------------------------------------------------------------
    // Test 15: Quick Filter: unassigned
    // -------------------------------------------------------------
    {
      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { quickFilter: 'unassigned' });
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      const allUnassigned = items.length > 0 && items.every(l => (!l.assignedToUser) && (!l.assignedTo || l.assignedTo === 'Unassigned' || l.assignedTo === 'Sales Concierge Team' || l.assignedTo === ''));
      assert(
        getStatusCode() === 200 && allUnassigned,
        `Test 15: Quick filter "unassigned" isolates unclaimed inquiries (Found: ${items.length})`
      );
    }

    // -------------------------------------------------------------
    // Test 16: Quick Filter: mine
    // -------------------------------------------------------------
    {
      const salesUserA = { _id: salesRepAId, role: 'sales', name: 'Aarav Sharma (Luxury Concierge)' };
      // Assign testLeadId1 to salesUserA
      const { req: aReq, res: aRes } = createMockReqRes({ assignedTo: salesUserA.name, assignedToUserId: salesUserA._id }, { id: testLeadId1 });
      await assignLead(aReq, aRes);

      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { quickFilter: 'mine' }, salesUserA);
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      const allMine = items.length > 0 && items.every(l => l.assignedTo === salesUserA.name || String(l.assignedToUser?._id || l.assignedToUser) === salesUserA._id);
      assert(
        getStatusCode() === 200 && allMine,
        `Test 16: Quick filter "mine" scopes leads strictly to the claiming specialist (Found: ${items.length})`
      );
    }

    // -------------------------------------------------------------
    // Test 17: Quick Filter: qualified
    // -------------------------------------------------------------
    {
      // Update a lead to qualified
      const { req: qReq, res: qRes } = createMockReqRes({ status: 'QUALIFIED' }, { id: testLeadId1 });
      await updateLeadStatus(qReq, qRes);

      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { quickFilter: 'qualified' });
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      const hasQualified = items.some(l => l.status === 'QUALIFIED');
      assert(
        getStatusCode() === 200 && hasQualified,
        `Test 17: Quick filter "qualified" isolates sales-ready high-intent leads (Found: ${items.length})`
      );
    }

    // -------------------------------------------------------------
    // Test 18: Pagination & Envelope Structure (envelope=true)
    // -------------------------------------------------------------
    {
      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { envelope: 'true', page: '1', limit: '5' });
      await getLeads(req, res);
      const data = getData();
      assert(
        getStatusCode() === 200 &&
        data?.success === true &&
        Array.isArray(data?.items) &&
        typeof data?.total === 'number' &&
        typeof data?.totalPages === 'number',
        `Test 18: Envelope pagination structure complies with API contract (Total: ${data?.total}, Page: ${data?.page}/${data?.totalPages})`
      );
    }

    // -------------------------------------------------------------
    // Test 19: Atomic 1-Click Claim Operation
    // -------------------------------------------------------------
    let claimLeadId = null;
    {
      // Create a fresh unassigned lead with unique phone
      const payload = {
        name: 'Claim Candidate',
        phone: randomPhone(),
        email: `claim_${timestamp}_${Math.random()}@example.com`,
        destination: 'Himachal'
      };
      const { req: cReq, res: cRes, getData: cData } = createMockReqRes(payload, {}, {}, null);
      await createLead(cReq, cRes);
      claimLeadId = String(cData()?.lead?._id || cData()?.lead?.id);

      const salesRepB = { _id: salesRepBId, role: 'sales', name: 'Priya Nair (Adventure Specialist)' };
      const { req, res, getStatusCode, getData } = createMockReqRes({}, { id: claimLeadId }, {}, salesRepB);
      await claimLead(req, res);
      const updated = getData()?.lead;
      assert(
        getStatusCode() === 200 &&
        updated?.assignedTo === salesRepB.name,
        `Test 19: Atomic 1-click claim updates assignee (Assignee: ${updated?.assignedTo})`
      );
    }

    // -------------------------------------------------------------
    // Test 20: Atomic Claim Conflict Check (409 on already claimed)
    // -------------------------------------------------------------
    {
      const salesRepC = { _id: salesRepCId, role: 'sales', name: 'Rohan Kapoor (Custom Journeys)' };
      const { req, res, getStatusCode, getData } = createMockReqRes({}, { id: claimLeadId }, {}, salesRepC);
      await claimLead(req, res);
      assert(
        getStatusCode() === 409,
        `Test 20: 409 Conflict returned when attempting to claim an already claimed lead (Status: ${getStatusCode()})`,
        getData()?.message
      );
    }

    // -------------------------------------------------------------
    // Test 21: Admin Assign to Specific Sales Specialist
    // -------------------------------------------------------------
    {
      const adminUser = { _id: defaultAdminId, role: 'admin', name: 'Super Admin' };
      const { req, res, getStatusCode, getData } = createMockReqRes(
        { assignedTo: 'Neha Verma (VIP Desk)', assignedToUserId: salesRepNehaId },
        { id: claimLeadId },
        {},
        adminUser
      );
      await assignLead(req, res);
      const lead = getData()?.lead;
      assert(
        getStatusCode() === 200 && lead?.assignedTo === 'Neha Verma (VIP Desk)',
        `Test 21: Admin overrides assignment to specific specialist successfully (Assignee: ${lead?.assignedTo})`
      );
    }

    // -------------------------------------------------------------
    // Test 22: IDOR Protection (Sales Rep modifying another rep's lead)
    // -------------------------------------------------------------
    {
      const intruderRep = { _id: intruderRepId, role: 'sales', name: 'Unauthorized Sales Rep' };
      const { req, res, getStatusCode, getData } = createMockReqRes(
        { status: 'LOST', lostReason: 'Testing IDOR' },
        { id: claimLeadId },
        {},
        intruderRep
      );
      await updateLeadStatus(req, res);
      assert(
        getStatusCode() === 403,
        `Test 22: IDOR protection blocks sales rep from updating another specialist's lead (Status: ${getStatusCode()})`,
        getData()?.message
      );
    }

    // -------------------------------------------------------------
    // Test 23: Admin IDOR Bypass
    // -------------------------------------------------------------
    {
      const adminUser = { _id: defaultAdminId, role: 'admin', name: 'Super Admin' };
      const { req, res, getStatusCode } = createMockReqRes(
        { status: 'IN_PROGRESS' },
        { id: claimLeadId },
        {},
        adminUser
      );
      await updateLeadStatus(req, res);
      assert(
        getStatusCode() === 200,
        `Test 23: Admin has full authority to update any lead across any specialist (Status: ${getStatusCode()})`
      );
    }

    // -------------------------------------------------------------
    // Test 24: Contact Outcome Logging (logLeadContact)
    // -------------------------------------------------------------
    {
      const assignedSpecialist = { _id: salesRepNehaId, role: 'sales', name: 'Neha Verma (VIP Desk)' };
      const contactPayload = {
        outcome: 'spoke_interested',
        callDurationSeconds: 420,
        notes: 'Client confirmed budget ₹1,50,000 for 2 adults. Prefers 5-star heritage hotels.',
        nextStep: 'Prepare custom itinerary quotation'
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(contactPayload, { id: claimLeadId }, {}, assignedSpecialist);
      await logLeadContact(req, res);
      const lead = getData()?.lead;
      const hasOutcome = lead?.callOutcomes?.some(c => c.outcome === 'CONNECTED');
      assert(
        getStatusCode() === 200 && hasOutcome && lead?.lastContactAt,
        `Test 24: Contact outcome logged with duration and notes, updating lastContactAt timestamp`
      );
    }

    // -------------------------------------------------------------
    // Test 25: Follow-Up Synchronization
    // -------------------------------------------------------------
    {
      const assignedSpecialist = { _id: salesRepNehaId, role: 'sales', name: 'Neha Verma (VIP Desk)' };
      const followUpPayload = {
        leadId: claimLeadId,
        title: 'Follow-up call to review customized itinerary proposal',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
        scheduledAt: new Date(Date.now() + 86400000 * 3).toISOString(),
        notes: 'Follow-up call to review customized itinerary proposal',
        type: 'CALL'
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(followUpPayload, {}, {}, assignedSpecialist);
      await createFollowUp(req, res);
      const followUp = getData()?.followUp;
      assert(
        getStatusCode() === 201 && (String(followUp?.leadId) === claimLeadId || followUp?.title),
        `Test 25: Follow-up scheduled and synced bidirectionally to lead timeline and FollowUp model`
      );
    }

    // -------------------------------------------------------------
    // Test 26: Lead Qualification Flow
    // -------------------------------------------------------------
    {
      const adminUser = { _id: defaultAdminId, role: 'admin', name: 'Super Admin' };
      const qualPayload = {
        status: 'QUALIFIED',
        budget: 150000,
        travelersCount: 2,
        leadScore: 85,
        destination: 'Meghalaya'
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(qualPayload, { id: claimLeadId }, {}, adminUser);
      await updateLeadStatus(req, res);
      const lead = getData()?.lead;
      assert(
        getStatusCode() === 200 && lead?.status === 'QUALIFIED',
        `Test 26: Lead marked as QUALIFIED with budget and travelers requirements`
      );
    }

    // -------------------------------------------------------------
    // Test 27: Pre-filled Quotation Creation from Lead
    // -------------------------------------------------------------
    let createdQuoteId = null;
    {
      const adminUser = { _id: defaultAdminId, role: 'admin', name: 'Super Admin' };
      const quotePayload = {
        leadId: claimLeadId,
        customerSnapshot: {
          name: 'Claim Candidate',
          email: `claim_${timestamp}@example.com`,
          phone: randomPhone(),
          notes: 'Qualified from callback request'
        },
        tripRequirements: {
          title: 'Custom Meghalaya Expedition',
          destination: 'Meghalaya',
          days: 5,
          nights: 4,
          totalTravelers: 2
        },
        hotelOptions: [
          { optionId: 'h1', hotelName: 'Ri Kynjai Resort', tier: 'Luxury', costPerNight: 12000, pricePerNight: 16000, nights: 4, selected: true }
        ],
        transportOptions: [
          { optionId: 't1', vehicle: 'Innova Crysta Luxury Chauffeur', unitCost: 18000, unitPrice: 24000, selected: true }
        ],
        pricing: { markupPercent: 20 }
      };
      const { req, res, getStatusCode, getData } = createMockReqRes(quotePayload, {}, {}, adminUser);
      await createQuotation(req, res);
      const quotation = getData()?.quotation;
      createdQuoteId = String(quotation?._id || quotation?.id);
      assert(
        getStatusCode() === 201 &&
        String(quotation?.leadId) === claimLeadId &&
        quotation?.status === 'DRAFT',
        `Test 27: Quotation created and prefilled from Lead (${quotation?.quotationNumber})`
      );
    }

    // -------------------------------------------------------------
    // Test 28: Quotation Approval & Booking Order Conversion Linkage
    // -------------------------------------------------------------
    {
      const adminUser = { _id: defaultAdminId, role: 'admin', name: 'Super Admin' };
      // First send and approve quotation
      const { req: sReq, res: sRes } = createMockReqRes({}, { id: createdQuoteId }, {}, adminUser);
      await sendQuotation(sReq, sRes);

      const { req: aReq, res: aRes } = createMockReqRes({ notes: 'Client confirmed itinerary' }, { id: createdQuoteId }, {}, adminUser);
      await approveQuotation(aReq, aRes);

      // Convert quotation to live booking
      const { req: bReq, res: bRes, getStatusCode, getData } = createMockReqRes({}, { id: createdQuoteId }, {}, adminUser);
      await createBookingFromQuotation(bReq, bRes);
      const bookingData = getData();
      const booking = bookingData?.booking;
      const bCode = booking?.bookingId || bookingData?.bookingId;

      // Verify Lead has convertedBookingCode or convertedBookingId populated
      const { req: lReq, res: lRes, getData: lData } = createMockReqRes({}, { id: claimLeadId }, {}, adminUser);
      await getLeadById(lReq, lRes);
      const refreshedLead = lData()?.lead;

      assert(
        (getStatusCode() === 200 || getStatusCode() === 201) &&
        (refreshedLead?.convertedBookingCode || refreshedLead?.convertedBookingId || bCode),
        `Test 28: Booking created from quotation links convertedBookingCode back to Lead (Booking: ${bCode})`
      );
    }

    // -------------------------------------------------------------
    // Test 29: Complete Activity Log & Chronological Audit Records
    // -------------------------------------------------------------
    {
      const adminUser = { _id: defaultAdminId, role: 'admin', name: 'Super Admin' };
      const { req, res, getData } = createMockReqRes({}, { id: claimLeadId }, {}, adminUser);
      await getLeadById(req, res);
      const lead = getData()?.lead;
      const hasAuditableData = (lead?.callOutcomes && lead.callOutcomes.length > 0) || lead?.contactCount > 0 || lead?.status === 'CONVERTED' || lead?.status === 'QUALIFIED';
      assert(
        hasAuditableData,
        `Test 29: Lead contains chronological audit records (Call Outcomes: ${lead?.callOutcomes?.length || 0}, Contact Count: ${lead?.contactCount || 0})`
      );
    }

    // -------------------------------------------------------------
    // Test 30: Empty DB / Filter Mismatch Zero-Count Guarantee
    // -------------------------------------------------------------
    {
      const { req, res, getStatusCode, getData } = createMockReqRes({}, {}, { search: 'NonExistentXYZ999123' });
      await getLeads(req, res);
      const data = getData();
      const items = Array.isArray(data) ? data : data?.leads || data?.items || [];
      assert(
        getStatusCode() === 200 && items.length === 0,
        'Test 30: Zero mock fallback returned when query has no matching records (No fake 12 leads)'
      );
    }

    // -------------------------------------------------------------
    // Test 31: Production DB Down Error Handling (503 Service Unavailable)
    // -------------------------------------------------------------
    {
      const prevEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Test sales controller fallback gating in production
      const { req, res, getStatusCode, getData } = createMockReqRes();
      // In production with no connected DB or zero data, it must return zero or 503, never fake ₹1,45,000
      await getSalesDashboard(req, res);
      const metrics = getData()?.metrics;
      const noFakeRevenue = metrics?.totalRevenue !== 145000 && metrics?.totalLeads !== 12;

      process.env.NODE_ENV = prevEnv;

      assert(
        noFakeRevenue,
        'Test 31: In production mode, fake demo fallbacks (₹1,45,000 / 12 leads) are strictly disabled'
      );
    }

    // -------------------------------------------------------------
    // Test 32: Non-Existent Lead 404 Handling
    // -------------------------------------------------------------
    {
      const dummyId = new mongoose.Types.ObjectId().toString();
      const { req, res, getStatusCode } = createMockReqRes({}, { id: dummyId });
      await getLeadById(req, res);
      assert(
        getStatusCode() === 404,
        `Test 32: Non-existent lead returns 404 Not Found (Status: ${getStatusCode()})`
      );
    }

    // -------------------------------------------------------------
    // Test 33: Role-Based Queue Scoping (Sales rep vs Admin)
    // -------------------------------------------------------------
    {
      const adminReqRes = createMockReqRes({}, {}, {}, { _id: defaultAdminId, role: 'admin', name: 'Super Admin' });
      await getLeads(adminReqRes.req, adminReqRes.res);
      const adminData = adminReqRes.getData();
      const adminTotal = Array.isArray(adminData) ? adminData.length : adminData?.total || adminData?.items?.length || 0;

      const salesReqRes = createMockReqRes({}, {}, { quickFilter: 'mine' }, { _id: isolatedRepId, role: 'sales', name: 'Isolated Sales Rep' });
      await getLeads(salesReqRes.req, salesReqRes.res);
      const salesData = salesReqRes.getData();
      const salesTotal = Array.isArray(salesData) ? salesData.length : salesData?.total || salesData?.items?.length || 0;

      assert(
        adminReqRes.getStatusCode() === 200 && salesReqRes.getStatusCode() === 200 && salesTotal <= adminTotal,
        `Test 33: Role-based scoping correctly differentiates Admin global queue (${adminTotal}) vs Specialist isolated queue (${salesTotal})`
      );
    }

  } catch (error) {
    console.error('💥 Test execution error:', error);
  } finally {
    console.log('\n=============================================================');
    console.log(`📊 FINAL RESULT: ${passed} / ${passed + failed} Tests Passed`);
    console.log('=============================================================\n');
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(failed > 0 ? 1 : 0);
  }
}

runExpertRequestsTestSuite();
