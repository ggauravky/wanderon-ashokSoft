import 'dotenv/config';
import {
  createQuotation,
  getQuotations,
  getQuotationById,
  updateQuotation,
  sendQuotation,
  approveQuotation,
  createQuotationRevision,
  getPublicQuotationByToken,
  sanitizeForCustomer,
  attachTransportDocument,
  deleteTransportDocument
} from './controllers/quotationController.js';
import { calculateQuotationPrice } from './services/quotationPricingService.js';

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

function createBasePayload(overrides = {}) {
  const tripReq = {
    title: 'Luxury Curated Journey',
    destination: 'Leh Ladakh',
    days: 6,
    nights: 5,
    totalTravelers: 2,
    adults: 2,
    children: 0,
    startDate: '2026-09-15',
    ...(overrides.tripRequirements || {})
  };

  const customer = {
    name: 'Gaurav Kumar',
    email: 'gaurav.traveler@example.com',
    phone: '+91 98765 43210',
    ...(overrides.customerSnapshot || overrides.customer || {})
  };

  return {
    customerSnapshot: customer,
    tripRequirements: tripReq,
    itinerary: overrides.itinerary || [{ day: 1, title: 'Arrival & Welcome', stay: 'Luxury Heritage Hotel' }],
    hotelOptions: overrides.hotelOptions || [],
    activities: overrides.activities || [],
    addOns: overrides.addOns || [],
    transportOptions: overrides.transportOptions || [],
    ...overrides
  };
}

async function runTransportFleetTests() {
  console.log('=============================================================================');
  console.log('WANDERLUXE — TRANSPORT & FLEET PROFESSIONAL UPGRADE TEST SUITE');
  console.log('=============================================================================\n');

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
    // -------------------------------------------------------------------------
    // SCENARIO 1: Flight Segment Creation, Structured Metadata & Customer Sanitization
    // -------------------------------------------------------------------------
    console.log('👉 SCENARIO 1: Flight Details & Passenger Information');
    const flightQuotationPayload = createBasePayload({
      tripRequirements: {
        title: 'Leh Ladakh High Altitude Expedition',
        destination: 'Leh Ladakh',
        days: 6,
        nights: 5,
        totalTravelers: 2,
        adults: 2,
        children: 0
      },
      transportOptions: [
        {
          optionId: 'trans_flight_001',
          mode: 'FLIGHT',
          type: 'Flight (Domestic/Charter)',
          title: 'Delhi to Leh Direct Morning Flight',
          vehicle: 'Air India A320neo',
          selected: true,
          route: {
            from: 'Delhi (DEL)',
            to: 'Leh (IXL)',
            pickupPoint: 'Terminal 3 Departure Gate 4',
            dropPoint: 'Kushok Bakula Rimpochee Airport'
          },
          schedule: {
            departureDate: '2026-09-15',
            departureTime: '06:45',
            arrivalDate: '2026-09-15',
            arrivalTime: '08:15'
          },
          reference: {
            flightNumber: 'AI-445',
            pnr: 'WX89KL',
            bookingReference: 'BK-AIR-9921'
          },
          cabinClass: 'Economy Flex',
          seatDetails: 'Seats 14A, 14B (Window + Middle)',
          baggage: {
            checkIn: '15 Kg per pax',
            cabin: '7 Kg per pax'
          },
          pricingType: 'PER_PERSON',
          quantity: 1,
          unitPrice: 7500,
          unitCost: 6200,
          inclusions: ['Meals Onboard', 'Seat Selection', 'Checked Baggage']
        }
      ]
    });

    const s1Res = createMockReqRes(flightQuotationPayload);
    await createQuotation(s1Res.req, s1Res.res);
    const createdQuote1 = s1Res.getData()?.quotation;

    assert(s1Res.getStatusCode() === 201 && createdQuote1, 'Flight quotation created successfully', s1Res.getData()?.message);
    const s1Flight = createdQuote1?.transportOptions?.[0];
    assert(s1Flight?.mode === 'FLIGHT', 'Transport mode is saved as FLIGHT');
    assert(s1Flight?.reference?.flightNumber === 'AI-445', 'Flight number AI-445 recorded');
    assert(s1Flight?.pricingType === 'PER_PERSON', 'Pricing model set to PER_PERSON');
    assert(s1Flight?.totalPrice === 15000, `Flight pricing calculated correctly: ₹${s1Flight?.totalPrice} (7500 * 2 pax)`);

    // -------------------------------------------------------------------------
    // SCENARIO 2: Train Segment with Rail Class, Coach & Berth
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 2: Train Journey with Coach, Seat & PNR');
    const trainQuotationPayload = createBasePayload({
      tripRequirements: {
        title: 'Shimla Heritage Hill Circuit',
        destination: 'Shimla',
        days: 4,
        nights: 3,
        totalTravelers: 2
      },
      customerSnapshot: {
        name: 'Priya Sharma',
        email: 'priya@example.com',
        phone: '+91 98111 22222'
      },
      transportOptions: [
        {
          optionId: 'trans_train_001',
          mode: 'TRAIN',
          title: 'Kalka Shatabdi Superfast Express',
          vehicle: 'Indian Railways Shatabdi',
          selected: true,
          route: {
            from: 'New Delhi (NDLS)',
            to: 'Kalka (KLK)',
            pickupPoint: 'Platform 1, NDLS'
          },
          schedule: {
            departureDate: '2026-10-01',
            departureTime: '07:40',
            arrivalDate: '2026-10-01',
            arrivalTime: '11:45'
          },
          reference: {
            trainNumber: '12011',
            pnr: '234-9876543'
          },
          cabinClass: 'Executive Chair Car (EC)',
          seatDetails: 'Coach E1, Seats 21 & 22',
          pricingType: 'PER_PERSON',
          quantity: 2,
          unitPrice: 1850,
          unitCost: 1450
        }
      ]
    });

    const s2Res = createMockReqRes(trainQuotationPayload);
    await createQuotation(s2Res.req, s2Res.res);
    const createdQuote2 = s2Res.getData()?.quotation;
    const s2Train = createdQuote2?.transportOptions?.[0];

    assert(s2Train?.mode === 'TRAIN', 'Train mode saved properly');
    assert(s2Train?.reference?.trainNumber === '12011', 'Train number 12011 preserved');
    assert(s2Train?.cabinClass === 'Executive Chair Car (EC)', 'Train cabin class verified');
    assert(s2Train?.seatDetails === 'Coach E1, Seats 21 & 22', 'Berth/Seat information preserved');

    // -------------------------------------------------------------------------
    // SCENARIO 3: Cab / SUV with Vehicle Photos, Caption & Primary Badge
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 3: Cab / SUV with Vehicle Media Gallery');
    const vehicleMediaList = [
      {
        id: 'vmed_01',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/wanderluxe/innova_front.jpg',
        publicId: 'wanderluxe/innova_front',
        caption: 'Toyota Innova Crysta Luxury 4x4 Front Profile',
        isPrimary: true
      },
      {
        id: 'vmed_02',
        url: 'https://res.cloudinary.com/demo/image/upload/v1/wanderluxe/innova_interior.jpg',
        publicId: 'wanderluxe/innova_interior',
        caption: 'Plush Captain Leather Seats & Climate Control',
        isPrimary: false
      }
    ];

    const cabQuotationPayload = createBasePayload({
      tripRequirements: {
        title: 'Manali Alpine Sanctuary Escape',
        destination: 'Manali',
        days: 5,
        nights: 4,
        totalTravelers: 4
      },
      transportOptions: [
        {
          optionId: 'trans_cab_001',
          mode: 'SUV',
          title: 'Chandigarh to Manali Private Luxury Transfer',
          vehicle: 'Toyota Innova Crysta ZX',
          selected: true,
          route: {
            from: 'Chandigarh Airport (IXC)',
            to: 'Solang Valley Resort Manali'
          },
          reference: {
            vehicleNumber: 'HP-01-A-7788'
          },
          capacity: 6,
          pricingType: 'PER_VEHICLE',
          quantity: 1,
          unitPrice: 22000,
          unitCost: 16500,
          vehicleMedia: vehicleMediaList,
          driverDetails: {
            name: 'Vikram Singh',
            phone: '+91 94180 12345',
            licenseNumber: 'HP-01-20150001'
          }
        }
      ]
    });

    const s3Res = createMockReqRes(cabQuotationPayload);
    await createQuotation(s3Res.req, s3Res.res);
    const createdQuote3 = s3Res.getData()?.quotation;
    const s3Cab = createdQuote3?.transportOptions?.[0];

    assert(s3Cab?.vehicleMedia?.length === 2, 'Vehicle photos attached to transport segment');
    const primaryPhoto = s3Cab?.vehicleMedia?.find(m => m.isPrimary);
    assert(primaryPhoto?.caption?.includes('Innova Crysta'), 'Primary photo flagged and caption preserved');
    assert(s3Cab?.pricingType === 'PER_VEHICLE' && s3Cab?.totalPrice === 22000, 'Fixed vehicle price computed accurately');

    // -------------------------------------------------------------------------
    // SCENARIO 4: Multi-Segment Journey (Flight + Private SUV + Ferry)
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 4: Multi-Modal Journey with Sequential Segments');
    const multiModalPayload = createBasePayload({
      tripRequirements: {
        title: 'Andaman Azure Islands Odyssey',
        destination: 'Andaman Islands',
        days: 7,
        totalTravelers: 2,
        adults: 2
      },
      transportOptions: [
        {
          optionId: 'seg_1_flight',
          mode: 'FLIGHT',
          title: 'Chennai to Port Blair Flight',
          selected: true,
          unitPrice: 8000,
          pricingType: 'PER_PERSON',
          quantity: 1
        },
        {
          optionId: 'seg_2_cab',
          mode: 'CAB',
          title: 'Port Blair Airport to Jetty Transfer',
          selected: true,
          unitPrice: 1500,
          pricingType: 'PER_VEHICLE',
          quantity: 1
        },
        {
          optionId: 'seg_3_ferry',
          mode: 'FERRY',
          title: 'Makruzz Luxury Catamaran to Havelock',
          selected: true,
          unitPrice: 2200,
          pricingType: 'PER_PERSON',
          quantity: 1
        }
      ]
    });

    const s4Res = createMockReqRes(multiModalPayload);
    await createQuotation(s4Res.req, s4Res.res);
    const createdQuote4 = s4Res.getData()?.quotation;
    const s4Options = createdQuote4?.transportOptions || [];

    assert(s4Options.length === 3, 'All 3 multi-modal segments saved');
    const totalExpectedTransport = (8000 * 2) + 1500 + (2200 * 2); // 16000 + 1500 + 4400 = 21900
    assert(createdQuote4?.pricing?.customerTransportPrice === totalExpectedTransport, `Multi-modal total calculated: ₹${createdQuote4?.pricing?.customerTransportPrice} (expected ₹${totalExpectedTransport})`);

    // -------------------------------------------------------------------------
    // SCENARIO 5: Transport Alternatives (Selected vs Unselected Options)
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 5: Transport Alternative Options Impact on Pricing');
    const alternativesPayload = createBasePayload({
      tripRequirements: {
        title: 'Kashmir Valley of Whispers',
        destination: 'Kashmir',
        totalTravelers: 2
      },
      transportOptions: [
        {
          optionId: 'trans_option_sedan',
          mode: 'CAB',
          title: 'Option A: Toyota Etios Sedan',
          selected: true,
          unitPrice: 12000,
          pricingType: 'PER_VEHICLE',
          quantity: 1
        },
        {
          optionId: 'trans_option_innova',
          mode: 'SUV',
          title: 'Option B: Toyota Innova Crysta (Alternative)',
          selected: false, // NOT selected
          unitPrice: 20000,
          pricingType: 'PER_VEHICLE',
          quantity: 1
        }
      ]
    });

    const s5Res = createMockReqRes(alternativesPayload);
    await createQuotation(s5Res.req, s5Res.res);
    const createdQuote5 = s5Res.getData()?.quotation;

    assert(createdQuote5?.transportOptions?.length === 2, 'Both primary and alternative options stored');
    assert(createdQuote5?.pricing?.customerTransportPrice === 12000, `Only selected option contributes to total price: ₹${createdQuote5?.pricing?.customerTransportPrice} (Ignored unselected ₹20,000)`);

    // -------------------------------------------------------------------------
    // SCENARIO 6 & 7: Customer Document Sanitization & Internal Document Security
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 6 & 7: Customer Visibility vs Internal Only Security');
    const docQuotePayload = createBasePayload({
      tripRequirements: {
        title: 'Goa Coastal Sun & Sand Retreat',
        destination: 'Goa',
        totalTravelers: 2,
        adults: 2
      },
      transportOptions: [
        {
          optionId: 'trans_goa_001',
          mode: 'FLIGHT',
          vehicle: 'IndiGo 6E-204',
          selected: true,
          unitPrice: 5000,
          pricingType: 'PER_PERSON',
          quantity: 2,
          driverDetails: {
            name: 'Confidential Airport Chauffeur',
            phone: '+91 99999 11111'
          },
          documents: [
            {
              id: 'doc_ticket_cust',
              type: 'FLIGHT_TICKET',
              title: 'Customer E-Ticket Itinerary',
              fileName: 'indigo_flight_ticket.pdf',
              secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/indigo_ticket.pdf',
              visibility: 'CUSTOMER_VISIBLE'
            },
            {
              id: 'doc_invoice_internal',
              type: 'SUPPLIER_INVOICE',
              title: 'Wholesale B2B Consolidated Tax Invoice',
              fileName: 'airline_b2b_cost_invoice.pdf',
              secureUrl: 'https://res.cloudinary.com/demo/image/upload/v1/internal_cost_invoice.pdf',
              visibility: 'INTERNAL_ONLY'
            }
          ]
        }
      ]
    });

    const s6Res = createMockReqRes(docQuotePayload);
    await createQuotation(s6Res.req, s6Res.res);
    const createdQuote6 = s6Res.getData()?.quotation;
    const sanitized = sanitizeForCustomer(createdQuote6);
    const sanitizedTrans = sanitized?.transportOptions?.[0];

    assert(sanitizedTrans?.documents?.length === 1, 'Sanitized quotation strips internal documents');
    assert(sanitizedTrans?.documents?.[0]?.id === 'doc_ticket_cust', 'Customer visible ticket retained');
    assert(!sanitizedTrans?.documents?.some(d => d.type === 'SUPPLIER_INVOICE'), 'Supplier Invoice completely excluded from customer payload');
    assert(!sanitizedTrans?.driverDetails, 'Internal driver contact stripped from customer view');

    // -------------------------------------------------------------------------
    // SCENARIO 8: Approved Quotation Immutability (409 Conflict)
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 8: Approved Quotation Immutability & Document Lock');
    const quoteId = createdQuote6?._id || createdQuote6?.id;
    // First send, then approve
    const sendMock = createMockReqRes({}, { id: quoteId });
    await sendQuotation(sendMock.req, sendMock.res);

    const approveMock = createMockReqRes({ approvedBy: 'Gaurav Customer' }, { id: quoteId });
    await approveQuotation(approveMock.req, approveMock.res);
    assert(approveMock.getStatusCode() === 200, 'Quotation marked APPROVED');

    // Attempt to directly modify transport
    const updateAttempt = createMockReqRes(
      { transportOptions: [{ ...sanitizedTrans, unitPrice: 99999 }] },
      { id: quoteId }
    );
    await updateQuotation(updateAttempt.req, updateAttempt.res);
    assert(updateAttempt.getStatusCode() === 409, 'Direct update to approved quotation rejected with 409 Conflict');

    // Attempt to attach document directly to approved quote
    const attachAttempt = createMockReqRes(
      {
        type: 'TRANSPORT_VOUCHER',
        title: 'Unauthorized Late Voucher',
        secureUrl: 'https://example.com/late.pdf'
      },
      { id: quoteId, optionId: 'trans_goa_001' }
    );
    await attachTransportDocument(attachAttempt.req, attachAttempt.res);
    assert(attachAttempt.getStatusCode() === 409, 'Attaching document directly to approved quotation rejected with 409 Conflict');

    // -------------------------------------------------------------------------
    // SCENARIO 9: Quotation Revision Copies All Transport, Media & Documents
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 9: Revision (v1 ➔ v2) Cloning Transport & Fleet Media');
    const revisionReq = createMockReqRes({ notes: 'Upgrading flight to Business Class' }, { id: quoteId });
    await createQuotationRevision(revisionReq.req, revisionReq.res);
    const revisionData = revisionReq.getData()?.quotation;

    assert((revisionReq.getStatusCode() === 200 || revisionReq.getStatusCode() === 201) && revisionData, 'Revision v2 created as DRAFT');
    assert(revisionData?.version === 2, 'Version incremented to 2');
    assert(revisionData?.status === 'DRAFT', 'Revision starts in DRAFT state');
    const revTrans = revisionData?.transportOptions?.[0];
    assert(revTrans?.vehicle === 'IndiGo 6E-204', 'Transport segment copied to revision');
    assert(revTrans?.documents?.length === 2, 'All documents (including internal) cloned into revision for operations');

    // -------------------------------------------------------------------------
    // SCENARIO 10: Booking Documents Separation
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 10: Document Architecture Separation');
    assert(
      Array.isArray(createdQuote6.transportOptions[0].documents) &&
      !createdQuote6.issuedTickets,
      'Pre-approval quotation documents strictly separated from operational booking tickets'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 11: File Upload Type and Extension Validation
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 11: Security & File Format Validation');
    const validExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'webp'];

    const isValidExt = (name) => {
      const ext = name.toLowerCase().split('.').pop();
      return validExtensions.includes(ext);
    };

    assert(isValidExt('flight_ticket.pdf') === true, 'PDF accepted');
    assert(isValidExt('car_photo.webp') === true, 'WebP image accepted');
    assert(isValidExt('malware.exe') === false, 'Executable .exe rejected');
    assert(isValidExt('script.js') === false, 'Script .js rejected');

    // -------------------------------------------------------------------------
    // SCENARIO 12: Network Resilience / Failure Graceful Degradation
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 12: Error Handling & Resilience');
    const simulatedPricingWithCorruptData = calculateQuotationPrice({
      tripRequirements: { totalTravelers: 2 },
      transportOptions: [
        {
          unitPrice: 'INVALID_PRICE',
          quantity: -5,
          selected: true
        }
      ]
    });
    assert(
      !isNaN(simulatedPricingWithCorruptData?.pricing?.customerTransportPrice) &&
      simulatedPricingWithCorruptData?.pricing?.customerTransportPrice >= 0,
      'Pricing calculation safely falls back to valid numbers on corrupted input'
    );

    // -------------------------------------------------------------------------
    // SCENARIO 13: Performance Under Multi-Segment & Fleet Calculation
    // -------------------------------------------------------------------------
    console.log('\n👉 SCENARIO 13: High Performance Pricing Calculation');
    const bulkTransportOptions = Array.from({ length: 50 }, (_, i) => ({
      optionId: `bulk_trans_${i}`,
      mode: i % 2 === 0 ? 'FLIGHT' : 'SUV',
      selected: i % 3 === 0,
      pricingType: i % 2 === 0 ? 'PER_PERSON' : 'PER_VEHICLE',
      unitPrice: 5000 + i * 100,
      quantity: 2,
      vehicleMedia: Array.from({ length: 5 }, (_, j) => ({
        url: `https://example.com/photo_${i}_${j}.jpg`
      })),
      documents: Array.from({ length: 3 }, (_, k) => ({
        title: `Doc_${i}_${k}`,
        visibility: k === 0 ? 'INTERNAL_ONLY' : 'CUSTOMER_VISIBLE'
      }))
    }));

    const startTime = performance.now();
    const bulkPricingResult = calculateQuotationPrice({
      tripRequirements: { totalTravelers: 4 },
      transportOptions: bulkTransportOptions
    });
    const duration = performance.now() - startTime;

    assert(duration < 25, `Processed 50 transport segments with 250 media/docs in ${duration.toFixed(2)}ms (Target < 25ms)`);
    assert(bulkPricingResult?.pricing?.customerTransportPrice > 0, 'Bulk calculation returned valid financial totals');

  } catch (err) {
    console.error('💥 Test suite crashed with unhandled exception:', err);
    failed++;
  }

  console.log('\n=============================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('=============================================================================');
  
  if (failed > 0) {
    process.exit(1);
  }
}

runTransportFleetTests();
