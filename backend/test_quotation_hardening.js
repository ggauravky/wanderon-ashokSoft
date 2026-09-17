import 'dotenv/config';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
  createQuotationRevision,
  approveQuotation,
  createBookingFromQuotation,
  convertToTrip,
  getPublicQuotationByToken,
  sanitizeForCustomer
} from './controllers/quotationController.js';

// Helper mock req/res
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

async function runTests() {
  console.log('🧪 Starting WanderLuxe Quotation Production Hardening Test Suite...\n');
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
    // Test 1: Create a Draft Quotation
    // -------------------------------------------------------------
    const mockDraft = {
      customerSnapshot: { name: 'Vikram Mehta', email: 'vikram@example.com', phone: '+919876543210', notes: 'Top secret VIP client' },
      tripRequirements: { title: 'Royal Ladakh Odyssey', destination: 'Ladakh', days: 6, nights: 5, totalTravelers: 2 },
      itinerary: [{ day: 1, title: 'Arrival in Leh', stay: 'The Grand Dragon' }],
      hotelOptions: [
        { optionId: 'h1', hotelName: 'The Grand Dragon', tier: 'Luxury', costPerNight: 8000, pricePerNight: 12000, nights: 5, selected: true }
      ],
      transportOptions: [
        { optionId: 't1', vehicle: 'Toyota Innova Crysta', unitCost: 15000, unitPrice: 22000, selected: true }
      ],
      pricing: { markupPercent: 20 }
    };

    const { req: createReq, res: createRes, getStatusCode: getCreateCode, getData: getCreateData } = createMockReqRes(mockDraft);
    await createQuotation(createReq, createRes);

    const createdQuote = getCreateData()?.quotation;
    assert(getCreateCode() === 201 && createdQuote?.status === 'DRAFT', 'Quotation drafted successfully with status DRAFT');
    const quoteId = createdQuote?._id || createdQuote?.id;

    // -------------------------------------------------------------
    // Test 2: Send Quotation to Customer (Status -> SENT)
    // -------------------------------------------------------------
    const { req: sendReq, res: sendRes, getStatusCode: getSendCode, getData: getSendData } = createMockReqRes({}, { id: quoteId });
    await sendQuotation(sendReq, sendRes);

    const sentQuote = getSendData()?.quotation;
    assert(getSendCode() === 200 && sentQuote?.status === 'SENT' && sentQuote?.priceSnapshot, 'Quotation transitioned to SENT and price snapshot frozen');

    // -------------------------------------------------------------
    // Test 3: Attempt direct PATCH on SENT Quotation (Must return 409 Conflict)
    // -------------------------------------------------------------
    const { req: patchSentReq, res: patchSentRes, getStatusCode: getPatchSentCode, getData: getPatchSentData } = createMockReqRes(
      { customerSnapshot: { name: 'Hacked Name' } },
      { id: quoteId }
    );
    await updateQuotation(patchSentReq, patchSentRes);

    assert(getPatchSentCode() === 409, `Direct PATCH on SENT quotation rejected with 409 Conflict: "${getPatchSentData()?.message}"`);

    // -------------------------------------------------------------
    // Test 4: Create Revision (Increments version, resets DRAFT, stores previous revision)
    // -------------------------------------------------------------
    const { req: revReq, res: revRes, getStatusCode: getRevCode, getData: getRevData } = createMockReqRes(
      { reason: 'Customer requested luxury hotel upgrade' },
      { id: quoteId }
    );
    await createQuotationRevision(revReq, revRes);

    const revisedQuote = getRevData()?.quotation;
    assert(
      getRevCode() === 200 && 
      revisedQuote?.version === 2 && 
      revisedQuote?.status === 'DRAFT' && 
      revisedQuote?.revisions?.length === 1,
      `Revision v2 created cleanly in DRAFT state, previous v1 archived in revisions array`
    );

    // -------------------------------------------------------------
    // Test 5: Approve Quotation (Status -> APPROVED with approvedSnapshot)
    // -------------------------------------------------------------
    const { req: appReq, res: appRes, getStatusCode: getAppCode, getData: getAppData } = createMockReqRes(
      { reason: 'Customer approved proposal' },
      { id: quoteId }
    );
    await approveQuotation(appReq, appRes);

    const approvedQuote = getAppData()?.quotation;
    assert(
      getAppCode() === 200 && 
      approvedQuote?.status === 'APPROVED' && 
      approvedQuote?.approvedSnapshot !== null,
      `Quotation approved and commercial approvedSnapshot permanently stored`
    );

    // -------------------------------------------------------------
    // Test 6: Idempotent Approval Test (Re-calling approve returns 200 without error)
    // -------------------------------------------------------------
    const { req: app2Req, res: app2Res, getStatusCode: getApp2Code } = createMockReqRes(
      { reason: 'Double-clicked approval' },
      { id: quoteId }
    );
    await approveQuotation(app2Req, app2Res);
    assert(getApp2Code() === 200, `Re-calling approve on already approved quotation is idempotent (200 OK)`);

    // -------------------------------------------------------------
    // Test 7: Attempt direct PATCH on APPROVED Quotation (Must return 409 Conflict)
    // -------------------------------------------------------------
    const { req: patchAppReq, res: patchAppRes, getStatusCode: getPatchAppCode, getData: getPatchAppData } = createMockReqRes(
      { tripRequirements: { destination: 'Maldives' } },
      { id: quoteId }
    );
    await updateQuotation(patchAppReq, patchAppRes);
    assert(getPatchAppCode() === 409, `Direct PATCH on APPROVED quotation rejected with 409 Conflict: "${getPatchAppData()?.message}"`);

    // -------------------------------------------------------------
    // Test 8: Convert Approved Quotation to Booking Order (Generates WLX-2026-XXXXXXXX)
    // -------------------------------------------------------------
    const { req: convReq, res: convRes, getStatusCode: getConvCode, getData: getConvData } = createMockReqRes(
      {},
      { id: quoteId }
    );
    await createBookingFromQuotation(convReq, convRes);

    const bookingRes = getConvData();
    const createdBookingCode = bookingRes?.quotation?.bookingCode || bookingRes?.booking?.bookingId;
    assert(
      (getConvCode() === 200 || getConvCode() === 201) && 
      bookingRes?.quotation?.status === 'CONVERTED' && 
      createdBookingCode?.startsWith('WLX-2026-'),
      `Quotation converted to Booking order: ${createdBookingCode} (starts with WLX-2026-)`
    );

    // -------------------------------------------------------------
    // Test 9: Idempotent Conversion Protection (Re-conversion returns same booking)
    // -------------------------------------------------------------
    const { req: conv2Req, res: conv2Res, getStatusCode: getConv2Code, getData: getConv2Data } = createMockReqRes(
      {},
      { id: quoteId }
    );
    await createBookingFromQuotation(conv2Req, conv2Res);
    assert(
      getConv2Code() === 200 && getConv2Data()?.isExisting === true,
      `Double-click / re-conversion prevented cleanly via idempotency (returned existing booking)`
    );

    // -------------------------------------------------------------
    // Test 10: Delete Protection on Converted Quotation (Must return 400)
    // -------------------------------------------------------------
    const { req: delReq, res: delRes, getStatusCode: getDelCode, getData: getDelData } = createMockReqRes(
      {},
      { id: quoteId }
    );
    await deleteQuotation(delReq, delRes);
    assert(getDelCode() === 400, `Hard delete on CONVERTED quote rejected (400 Bad Request): "${getDelData()?.message}"`);

    // -------------------------------------------------------------
    // Test 11: Public Sanitization Security Audit (Zero Supplier Costs or Internal Margins)
    // -------------------------------------------------------------
    const sanitized = sanitizeForCustomer(approvedQuote);
    const hasSupplierCost = sanitized?.hotelOptions?.[0]?.costPerNight !== undefined ||
                            sanitized?.transportOptions?.[0]?.unitCost !== undefined ||
                            sanitized?.pricing?.totalInternalCost !== undefined ||
                            sanitized?.pricing?.markupPercent !== undefined ||
                            sanitized?.pricing?.projectedMargin !== undefined ||
                            sanitized?.customerSnapshot?.notes !== undefined ||
                            sanitized?.revisions !== undefined ||
                            sanitized?.auditTrail !== undefined;

    assert(!hasSupplierCost, `Public sanitization projection strictly stripped all internal supplier costs, markup, profit margins, internal notes, revisions, and audit trails`);

    // -------------------------------------------------------------
    // Test 12: Sales Data Isolation / IDOR Protection (Section 70, 74, 124)
    // -------------------------------------------------------------
    // Create a quote assigned specifically to Sales Agent A
    const { req: quoteAReq, res: quoteARes, getData: getQuoteAData } = createMockReqRes(
      {
        customerSnapshot: { name: 'Exclusive Client', email: 'exclusive@test.com', phone: '+919999999999' },
        tripRequirements: { title: 'Secret Trek', destination: 'Spiti', days: 5, nights: 4, totalTravelers: 2 },
        hotelOptions: [{ optionId: 'h1', hotelName: 'Spiti Homestay', tier: 'Standard', costPerNight: 2000, pricePerNight: 3500, nights: 4, selected: true }],
        transportOptions: [{ optionId: 't1', vehicle: 'Scorpio', unitCost: 10000, unitPrice: 15000, selected: true }],
        assignedTo: 'sales_agent_a'
      },
      {},
      {},
      { _id: 'sales_agent_a', role: 'sales', name: 'Sales Agent A' }
    );
    await createQuotation(quoteAReq, quoteARes);
    const quoteA = getQuoteAData()?.quotation;
    const quoteAId = quoteA?._id || quoteA?.id;

    // Sales Agent B attempts to read Quote A
    const { req: readByBReq, res: readByBRes, getStatusCode: getReadByBCode } = createMockReqRes(
      {},
      { id: quoteAId },
      {},
      { _id: 'sales_agent_b', role: 'sales', name: 'Sales Agent B' }
    );
    await getQuotationById(readByBReq, readByBRes);
    assert(getReadByBCode() === 403, `Sales B reading Sales A's quotation blocked with 403 Forbidden (Sales Isolation enforced)`);

    // Sales Agent B attempts to modify Quote A
    const { req: editByBReq, res: editByBRes, getStatusCode: getEditByBCode } = createMockReqRes(
      { customerSnapshot: { name: 'Hacked by Sales B' } },
      { id: quoteAId },
      {},
      { _id: 'sales_agent_b', role: 'sales', name: 'Sales Agent B' }
    );
    await updateQuotation(editByBReq, editByBRes);
    assert(getEditByBCode() === 403, `Sales B modifying Sales A's quotation blocked with 403 Forbidden (IDOR prevented)`);

    // -------------------------------------------------------------
    // Test 13: Search By Converted Booking Code (Section 9)
    // -------------------------------------------------------------
    const { req: searchReq, res: searchRes, getData: getSearchData } = createMockReqRes(
      {},
      {},
      { search: createdBookingCode }
    );
    await getQuotations(searchReq, searchRes);
    const searchMatches = getSearchData()?.quotations || [];
    const foundBooking = searchMatches.some(q => q.bookingCode === createdBookingCode);
    assert(foundBooking, `Search by converted bookingCode "${createdBookingCode}" returned target quotation in results`);

    // -------------------------------------------------------------
    // Test 14: Role-Based Conversion Permissions (Section 54)
    // -------------------------------------------------------------
    // Sales role cannot convert to Catalog Trip (Admin/Operations only)
    const { req: convTripSalesReq, res: convTripSalesRes, getStatusCode: getConvTripSalesCode } = createMockReqRes(
      {},
      { id: quoteId },
      {},
      { _id: 'sales_agent_a', role: 'sales', name: 'Sales Agent A' }
    );
    await convertToTrip(convTripSalesReq, convTripSalesRes);
    assert(getConvTripSalesCode() === 403, `Sales user converting quotation into Catalog Trip rejected with 403 Forbidden`);

    // -------------------------------------------------------------
    // Test 15: Mass Assignment & Privilege Escalation Protection (Section 73)
    // -------------------------------------------------------------
    // Attacker passes unauthorized fields in PATCH
    const { req: massReq, res: massRes, getData: getMassData } = createMockReqRes(
      {
        status: 'APPROVED',
        bookingId: 'fake_booking_id',
        assignedTo: 'hijacked_user',
        auditTrail: []
      },
      { id: quoteAId },
      {},
      { _id: 'sales_agent_a', role: 'sales', name: 'Sales Agent A' }
    );
    await updateQuotation(massReq, massRes);
    const massUpdated = getMassData()?.quotation;
    assert(
      massUpdated?.status === 'DRAFT' && 
      massUpdated?.bookingId !== 'fake_booking_id' && 
      massUpdated?.assignedTo === 'sales_agent_a',
      `Mass assignment of status/bookingId/assignedTo in PATCH strictly ignored; privilege escalation prevented`
    );

  } catch (err) {
    console.error('Fatal test execution error:', err);
    failed++;
  }

  console.log(`\n📊 Test Suite Completed: ${passed} Passed, ${failed} Failed`);
  if (failed === 0) {
    console.log('🎉 ALL QUOTATION HARDENING TESTS PASSED WITH 100% SUCCESS!');
  } else {
    process.exit(1);
  }
}

runTests();
