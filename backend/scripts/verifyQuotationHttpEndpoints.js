import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import quotationRoutes from '../routes/quotationRoutes.js';
import { calculateQuotationPrice } from '../services/quotationPricingService.js';

// Setup isolated test server on port 5099
const testApp = express();
testApp.use(cors());
testApp.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'wanderluxe_secure_jwt_secret_key_2026';
const adminToken = jwt.sign(
  { id: 'usr_admin', email: 'gaurav999@gmail.com', role: 'admin' },
  JWT_SECRET,
  { expiresIn: '1h' }
);

testApp.use('/api/quotations', quotationRoutes);

async function runHttpEndpointTests() {
  console.log('🚀 ========================================================================= 🚀');
  console.log('🚀 --- HTTP API ENDPOINTS TEST RUNNER FOR QUOTATION SYSTEM (PHASE 2) --- 🚀');
  console.log('🚀 ========================================================================= 🚀\n');

  const server = http.createServer(testApp);
  const PORT = 5099;

  await new Promise(resolve => server.listen(PORT, resolve));
  console.log(`📡 Isolated test server listening on http://localhost:${PORT}`);

  let passed = 0;
  let failed = 0;

  const assert = (condition, testName, errMsg = null) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}${errMsg ? ` -> ${errMsg}` : ''}`);
      failed++;
    }
  };

  const BASE_URL = `http://localhost:${PORT}/api/quotations`;

  const request = async (url, options = {}) => {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
        ...(options.headers || {})
      }
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  };

  try {
    // -----------------------------------------------------------------
    // TEST 1: POST /api/quotations/calculate-preview
    // -----------------------------------------------------------------
    console.log('\n1. Testing POST /api/quotations/calculate-preview...');
    const previewPayload = {
      tripRequirements: {
        title: 'Spiti Valley Winter Safari',
        destination: 'Spiti Valley',
        adults: 2,
        duration: '6D/5N',
        days: 6,
        nights: 5
      },
      hotelOptions: [
        {
          optionId: 'h1',
          tier: 'Deluxe',
          label: 'Option A: Mudh Homestay',
          rooms: 1,
          nights: 5,
          pricePerNight: 4000,
          selected: true
        }
      ],
      transportOptions: [
        {
          optionId: 't1',
          type: 'SUV (Innova/Crysta)',
          quantity: 1,
          unitPrice: 20000,
          selected: true
        }
      ],
      activities: [],
      addOns: [],
      paymentTerms: { depositPercent: 10, balanceDueDays: 6 },
      pricing: { discountType: 'none', discountValue: 0, gstPercent: 5 }
    };

    const previewRes = await request(`${BASE_URL}/calculate-preview`, {
      method: 'POST',
      body: JSON.stringify(previewPayload)
    });

    assert(previewRes.status === 200, 'POST /calculate-preview returns HTTP 200');
    assert(previewRes.data.pricing.subtotal === 40000, 'Calculated Subtotal is ₹40,000 (Hotel 20k + SUV 20k)');
    assert(previewRes.data.pricing.finalTotal === 42000, 'Calculated Final Total is ₹42,000 (with 5% GST)');
    assert(previewRes.data.pricing.depositRequired === 4200, 'Calculated 10% Deposit is ₹4,200');

    // -----------------------------------------------------------------
    // TEST 2: POST /api/quotations (Create Draft)
    // -----------------------------------------------------------------
    console.log('\n2. Testing POST /api/quotations (Create Draft)...');
    const createPayload = {
      customerSnapshot: {
        name: 'Ananya Roy',
        email: 'ananya.roy@test.in',
        phone: '+91 9988776655'
      },
      tripRequirements: {
        title: 'Himachal Hidden Valleys Tour',
        destination: 'Himachal Pradesh',
        startDate: '2026-11-01',
        endDate: '2026-11-06',
        duration: '6D/5N',
        days: 6,
        nights: 5,
        adults: 2,
        totalTravelers: 2,
        travelStyle: 'Adventure'
      },
      hotelOptions: [
        {
          optionId: 'h_tier_1',
          tier: 'Deluxe',
          label: 'Option A: 4-Star Jibhi Pine Resort',
          hotelName: 'The Jibhi Pine Resort',
          rooms: 1,
          nights: 5,
          costPerNight: 3000,
          pricePerNight: 5000,
          selected: true
        }
      ],
      transportOptions: [
        {
          optionId: 't_tier_1',
          type: 'SUV (Innova/Crysta)',
          vehicle: 'Toyota Innova Crysta',
          quantity: 1,
          unitCost: 14000,
          unitPrice: 20000,
          selected: true
        }
      ],
      itinerary: [
        { day: 1, title: 'Arrival in Jibhi & Forest Walk', description: 'Scenic drive to Jalori pass valley', stay: 'The Jibhi Pine Resort' }
      ],
      activities: [],
      addOns: [],
      paymentTerms: { depositPercent: 10, balanceDueDays: 6, paymentMode: 'PARTIAL' },
      pricing: { discountType: 'none', discountValue: 0, gstPercent: 5 }
    };

    const createRes = await request(`${BASE_URL}`, {
      method: 'POST',
      body: JSON.stringify(createPayload)
    });

    assert(createRes.status === 201, 'POST /api/quotations returns HTTP 201 Created');
    const createdQuote = createRes.data.quotation;
    assert(createdQuote && createdQuote.quotationNumber, `Quotation number generated: ${createdQuote?.quotationNumber}`);
    assert(createdQuote?.status === 'DRAFT', 'Quotation created with initial status DRAFT');
    assert(createdQuote?.publicShare?.token != null, 'Secure public share token generated');

    const createdId = createdQuote._id;
    const shareToken = createdQuote.publicShare.token;

    // -----------------------------------------------------------------
    // TEST 3: GET /api/quotations (List & Filter)
    // -----------------------------------------------------------------
    console.log('\n3. Testing GET /api/quotations with Search & Status filters...');
    const listRes = await request(`${BASE_URL}?status=DRAFT&search=Ananya`);
    assert(listRes.status === 200, 'GET /api/quotations returns HTTP 200');
    assert(Array.isArray(listRes.data.quotations), 'Returns array of quotations');
    assert(listRes.data.quotations.some(q => q.customerSnapshot?.name === 'Ananya Roy'), 'Filtered list contains "Ananya Roy"');

    // -----------------------------------------------------------------
    // TEST 4: GET /api/quotations/:id (Fetch Details)
    // -----------------------------------------------------------------
    console.log('\n4. Testing GET /api/quotations/:id...');
    const detailRes = await request(`${BASE_URL}/${createdId}`);
    assert(detailRes.status === 200, 'GET /api/quotations/:id returns HTTP 200');
    assert(detailRes.data.quotation.quotationNumber === createdQuote.quotationNumber, 'Quotation number matches in detail view');

    // -----------------------------------------------------------------
    // TEST 5: PATCH /api/quotations/:id (Update Draft)
    // -----------------------------------------------------------------
    console.log('\n5. Testing PATCH /api/quotations/:id...');
    const updateRes = await request(`${BASE_URL}/${createdId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        pricing: {
          ...createdQuote.pricing,
          discountType: 'flat',
          discountValue: 2000
        }
      })
    });
    assert(updateRes.status === 200, 'PATCH /api/quotations/:id returns HTTP 200');
    assert(updateRes.data.quotation.pricing.discountAmount === 2000, 'Discount updated to ₹2,000');

    // -----------------------------------------------------------------
    // TEST 6: POST /api/quotations/:id/send (Send to Customer)
    // -----------------------------------------------------------------
    console.log('\n6. Testing POST /api/quotations/:id/send...');
    const sendRes = await request(`${BASE_URL}/${createdId}/send`, {
      method: 'POST'
    });
    assert(sendRes.status === 200, 'POST /api/quotations/:id/send returns HTTP 200');
    assert(sendRes.data.quotation.status === 'SENT', 'Quotation status transitioned to SENT');

    // -----------------------------------------------------------------
    // TEST 7: GET /api/quotations/public/:token (Public Proposal View)
    // -----------------------------------------------------------------
    console.log('\n7. Testing GET /api/quotations/public/:token (Zero Leakage Check)...');
    const publicRes = await request(`${BASE_URL}/public/${shareToken}`);
    assert(publicRes.status === 200, 'GET /api/quotations/public/:token returns HTTP 200');
    const pubQuote = publicRes.data.quotation;
    assert(pubQuote.pricing.internalBaseCost === undefined, 'Sanitized: internalBaseCost is undefined');
    assert(pubQuote.pricing.totalInternalCost === undefined, 'Sanitized: totalInternalCost is undefined');
    assert(pubQuote.pricing.projectedMargin === undefined, 'Sanitized: projectedMargin is undefined');
    assert(pubQuote.hotelOptions[0].costPerNight === undefined, 'Sanitized: hotel costPerNight is undefined');
    assert(pubQuote.status === 'VIEWED', 'Viewing proposal automatically transitions status to VIEWED');

    // -----------------------------------------------------------------
    // TEST 8: POST /api/quotations/public/:token/decision (Customer Approval)
    // -----------------------------------------------------------------
    console.log('\n8. Testing POST /api/quotations/public/:token/decision...');
    const approveRes = await request(`${BASE_URL}/public/${shareToken}/decision`, {
      method: 'POST',
      body: JSON.stringify({ decision: 'APPROVE' })
    });
    assert(approveRes.status === 200, 'POST decision APPROVE returns HTTP 200');
    assert(approveRes.data.quotation.status === 'APPROVED', 'Quotation status updated to APPROVED');

    // -----------------------------------------------------------------
    // TEST 9: POST /api/quotations/:id/create-booking (Conversion)
    // -----------------------------------------------------------------
    console.log('\n9. Testing POST /api/quotations/:id/create-booking...');
    const convertRes = await request(`${BASE_URL}/${createdId}/create-booking`, {
      method: 'POST'
    });
    assert(convertRes.status === 201, 'POST /create-booking returns HTTP 201 Created');
    assert(convertRes.data.booking && convertRes.data.booking.bookingId.startsWith('WLX-2026-'), `Booking ID created: ${convertRes.data.booking?.bookingId}`);
    assert(convertRes.data.quotation.status === 'CONVERTED', 'Quotation status updated to CONVERTED');

  } catch (err) {
    console.error('Test Execution Error:', err);
    failed++;
  }

  // -----------------------------------------------------------------
  // FINAL SCORECARD
  // -----------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 HTTP API TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (server && server.closeAllConnections) {
    server.closeAllConnections();
  }
  server.close();
  setTimeout(() => {
    process.exit(failed > 0 ? 1 : 0);
  }, 100);
}

runHttpEndpointTests().catch(e => {
  console.error(e);
  process.exit(1);
});
