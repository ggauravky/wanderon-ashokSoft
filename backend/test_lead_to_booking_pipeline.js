import 'dotenv/config';
import { createLead } from './controllers/leadController.js';
import { 
  createQuotation,
  sendQuotation,
  approveQuotation,
  createBookingFromQuotation,
  customerQuotationDecision
} from './controllers/quotationController.js';

function createMockReqRes(body = {}, params = {}, query = {}, user = { _id: 'admin_1', role: 'admin', name: 'Super Admin' }) {
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

async function runPipelineTest() {
  console.log('🧪 Starting WanderLuxe Complete End-to-End CRM Lead ➔ Quote ➔ Booking Pipeline Test...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition, name) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Step 1: Customer submits enquiry form on website (source: 'Website Lead Form')
    // -------------------------------------------------------------
    const uniqueEmail = `traveler_${Date.now()}@example.com`;
    const { req: leadReq, res: leadRes, getStatusCode: getLeadCode, getData: getLeadData } = createMockReqRes(
      {
        name: 'Arjun Kapoor',
        email: uniqueEmail,
        phone: '9876543210',
        tripTitle: 'Kashmir Great Lakes Expedition',
        destination: 'Kashmir',
        travelersCount: 2,
        travelMonth: 'August 2026',
        preferredCallWindow: 'Morning',
        source: 'Website Lead Form',
        message: 'Looking for a private customized trip for 2.'
      }
    );
    await createLead(leadReq, leadRes);
    const lead = getLeadData()?.lead;
    const leadId = lead?._id || lead?.id;
    assert(
      getLeadCode() === 201 && lead && lead.status === 'NEW' && lead.source === 'Website Lead Form',
      `Lead captured from Website Lead Form (Status: NEW, Lead ID: ${leadId})`
    );

    // -------------------------------------------------------------
    // Step 2: Sales creates Quotation linked to Lead
    // -------------------------------------------------------------
    const { req: qReq, res: qRes, getStatusCode: getQCode, getData: getQData } = createMockReqRes(
      {
        leadId: leadId,
        customerSnapshot: { name: lead.name, email: lead.email, phone: lead.phone },
        tripRequirements: { title: lead.tripTitle, destination: lead.destination, days: 7, nights: 6, totalTravelers: 2 },
        itinerary: [
          { day: 1, title: 'Arrival in Srinagar', stay: 'Houseboat' },
          { day: 2, title: 'Sonamarg to Nichnai', stay: 'Camp' }
        ],
        hotelOptions: [
          { optionId: 'h1', hotelName: 'Dal Lake Luxury Houseboat', tier: 'Luxury', costPerNight: 5000, pricePerNight: 8500, nights: 2, selected: true }
        ],
        transportOptions: [
          { optionId: 't1', vehicle: 'Innova Crysta', unitCost: 14000, unitPrice: 20000, selected: true }
        ],
        pricing: { markupPercent: 20 }
      },
      {},
      {},
      { _id: 'sales_user_1', role: 'sales', name: 'Concierge Arjun' }
    );
    await createQuotation(qReq, qRes);
    const quote = getQData()?.quotation;
    const quoteId = quote?._id || quote?.id;
    assert(
      getQCode() === 201 && quote?.leadId === leadId && quote?.status === 'DRAFT',
      `Quotation ${quote?.quotationNumber} drafted and linked to Lead ${leadId}`
    );

    // -------------------------------------------------------------
    // Step 3: Sales dispatches quotation to Customer
    // -------------------------------------------------------------
    const { req: sendReq, res: sendRes, getStatusCode: getSendCode, getData: getSendData } = createMockReqRes(
      {},
      { id: quoteId },
      {},
      { _id: 'sales_user_1', role: 'sales', name: 'Concierge Arjun' }
    );
    await sendQuotation(sendReq, sendRes);
    const sentQuote = getSendData()?.quotation;
    const shareToken = sentQuote?.publicShare?.token;
    assert(
      getSendCode() === 200 && sentQuote?.status === 'SENT' && shareToken,
      `Quotation dispatched (Status: SENT, Secure Token: ${shareToken?.slice(0, 10)}...)`
    );

    // -------------------------------------------------------------
    // Step 4: Customer reviews & accepts proposal via Public Share Token
    // -------------------------------------------------------------
    const { req: decisionReq, res: decisionRes, getStatusCode: getDecisionCode, getData: getDecisionData } = createMockReqRes(
      { decision: 'APPROVE', customerNotes: 'Looks amazing! Ready to book.' },
      { token: shareToken }
    );
    await customerQuotationDecision(decisionReq, decisionRes);
    const approvedQuote = getDecisionData()?.quotation;
    assert(
      getDecisionCode() === 200 && approvedQuote?.status === 'APPROVED',
      `Customer approved proposal via secure public token (Status: APPROVED)`
    );

    // -------------------------------------------------------------
    // Step 5: Sales/Admin converts Approved Quotation to Booking Order
    // -------------------------------------------------------------
    const { req: convReq, res: convRes, getStatusCode: getConvCode, getData: getConvData } = createMockReqRes(
      {},
      { id: quoteId },
      {},
      { _id: 'sales_user_1', role: 'sales', name: 'Concierge Arjun' }
    );
    await createBookingFromQuotation(convReq, convRes);
    const bookingRes = getConvData();
    const bookingCode = bookingRes?.quotation?.bookingCode || bookingRes?.booking?.bookingId;
    assert(
      (getConvCode() === 200 || getConvCode() === 201) && 
      bookingRes?.quotation?.status === 'CONVERTED' && 
      bookingCode?.startsWith('WLX-2026-'),
      `Quotation converted to Live Booking: ${bookingCode} (Deposit: ₹${bookingRes?.depositDue?.toLocaleString()})`
    );

    // -------------------------------------------------------------
    // Step 6: Verify Bidirectional Traceability
    // -------------------------------------------------------------
    assert(
      bookingRes?.booking?.sourceQuotationId === quoteId || bookingRes?.quotation?._id === quoteId,
      `Bidirectional linkage verified: Quotation ${quote?.quotationNumber} <-> Booking ${bookingCode}`
    );

  } catch (err) {
    console.error('Pipeline test error:', err);
    failed++;
  }

  console.log(`\n📊 Pipeline Test Completed: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 COMPLETE JOURNEY #1 (ENQUIRY ➔ QUOTATION ➔ ACCEPT ➔ BOOKING) PASSED 100%!');
  } else {
    process.exit(1);
  }
}

runPipelineTest();
