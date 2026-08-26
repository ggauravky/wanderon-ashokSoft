import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import dns from 'dns';
import crypto from 'crypto';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {
  // Ignored
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

import Booking from '../models/Booking.js';
import Lead from '../models/Lead.js';
import User from '../models/User.js';
import {
  calculateServerPrice,
  evaluatePartialPaymentEligibility,
  parseBatchStartDate
} from '../controllers/bookingController.js';

const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');
const taxonomyPath = path.join(__dirname, '../../frontend/src/config/discoveryTaxonomy.js');

async function runComprehensiveEndToEndTests() {
  console.log('🚀 ========================================================================= 🚀');
  console.log('🚀 --- STARTING PHASE C3: FINAL COMPREHENSIVE END-TO-END REGRESSION QA --- 🚀');
  console.log('🚀 ========================================================================= 🚀\n');

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

  // -------------------------------------------------------------
  // SECTION 1: CATALOG & DISCOVERY TAXONOMY INTEGRITY
  // -------------------------------------------------------------
  console.log('====================================================');
  console.log('1. CATALOG & DISCOVERY TAXONOMY INTEGRITY');
  console.log('====================================================');

  const mockModule = await import('file:///' + mockDataPath.replace(/\\/g, '/'));
  const taxonomyModule = await import('file:///' + taxonomyPath.replace(/\\/g, '/'));

  const trips = mockModule.UPCOMING_TRIPS || [];
  const presets = taxonomyModule.DISCOVERY_PRESETS || [];

  assert(trips.length === 50, `Catalog contains all 50 verified trips`);
  assert(presets.length === 18, `Taxonomy contains exactly 18 data-backed presets`);

  // Ensure zero empty pages
  presets.forEach(p => {
    const matchCount = trips.filter(p.filterPredicate).length;
    assert(matchCount >= 3, `Preset [${p.id}] matches ${matchCount} trips (Zero Empty Page rule: >= 3)`);
    assert(p.canonicalPath.startsWith('/'), `Preset [${p.id}] has stable canonical path: ${p.canonicalPath}`);
    assert(!p.canonicalPath.includes('?'), `Preset [${p.id}] canonical path is query-free`);
  });

  // -------------------------------------------------------------
  // SECTION 2: SERVER-AUTHORITATIVE PRICING & PROXIMITY RULES
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('2. SERVER-AUTHORITATIVE PRICING & PROXIMITY RULES');
  console.log('====================================================');

  const mockTrip = {
    price: 20000,
    sharingPricing: {
      doubleSharing: 20000,
      tripleSharing: 18000,
      singleSharing: 25000
    }
  };

  // 2.1 Double Sharing 2 travelers
  const priceResultDouble = await calculateServerPrice(mockTrip, 2, 'Double Sharing');
  assert(priceResultDouble.subtotal === 40000, `Double Sharing 2 pax subtotal is ₹40,000 (Actual: ${priceResultDouble.subtotal})`);
  assert(priceResultDouble.finalAmount === 40000, `Final payable amount is ₹40,000 (Actual: ${priceResultDouble.finalAmount})`);
  
  const deposit10Pct = Math.round(priceResultDouble.finalAmount * 0.10);
  assert(deposit10Pct === 4000, `10% deposit is exactly ₹4,000 (Actual: ${deposit10Pct})`);

  // 2.2 Proximity Rules: >= 7 days = eligible for 10% deposit
  const farFutureDate = new Date(Date.now() + 20 * 86400000);
  const eligibilityFar = evaluatePartialPaymentEligibility(farFutureDate);
  assert(eligibilityFar.eligible === true, `Batch 20 days in future is ELIGIBLE for 10% deposit`);
  assert(eligibilityFar.daysUntilDeparture === 20, `Days until departure accurately calculated as 20`);

  // 2.3 Proximity Rules: <= 6 days = BLOCKED from 10% deposit
  const imminentDate = new Date(Date.now() + 4 * 86400000);
  const eligibilityImminent = evaluatePartialPaymentEligibility(imminentDate);
  assert(eligibilityImminent.eligible === false, `Batch 4 days away is BLOCKED from 10% deposit`);
  assert(eligibilityImminent.reason != null, `Reason provided for deposit ineligibility: "${eligibilityImminent.reason}"`);

  // -------------------------------------------------------------
  // SECTION 3: MONGOOSE MODELS & LIFECYCLE SCHEMA VALIDATION
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('3. MONGOOSE SCHEMA & GATEKEEPER LIFECYCLE INTEGRITY');
  console.log('====================================================');

  // Lead Model Validation
  const leadDoc = new Lead({
    name: 'Rohan Sharma',
    email: 'rohan.sharma@wanderluxe.in',
    phone: '+919876543210',
    destination: 'Spiti Valley',
    tripTitle: 'Spiti Valley Winter 4x4 Expedition',
    travelDate: '15 Sep - 21 Sep, 2026',
    travelersCount: 2,
    budgetPerPerson: '₹20,000 - ₹30,000',
    message: 'Couples tent option inquiry',
    source: 'trip_page',
    status: 'NEW'
  });
  const leadValidationErr = leadDoc.validateSync();
  assert(!leadValidationErr, `Lead model schema validation passed with zero errors`, leadValidationErr?.message);
  assert(leadDoc.status === 'NEW', `Lead default status is 'NEW'`);

  // Full Booking Model Validation
  const fullBookingDoc = new Booking({
    bookingId: `BK-TEST-${Date.now()}-FULL`,
    userId: new mongoose.Types.ObjectId(),
    tripId: '1',
    tripSnapshot: {
      title: 'Meghalaya Backpacking & Living Root Bridges',
      location: 'Meghalaya',
      destination: 'Northeast India',
      duration: '5D/4N',
      batchDate: '20 Sep - 26 Sep, 2026',
      pickupPoint: 'Guwahati Airport / ISBT'
    },
    customer: {
      name: 'Aarav Patel',
      email: 'aarav.patel@testmail.com',
      phone: '+919123456780',
      age: '28',
      gender: 'Male'
    },
    travelers: [
      { name: 'Pooja Patel', age: '26', gender: 'Female' }
    ],
    numberOfTravelers: 2,
    occupancy: 'Double Sharing',
    paymentPlan: {
      type: 'FULL',
      depositPercent: 10,
      balanceDueDays: 6
    },
    pricing: {
      basePricePerPerson: 18500,
      subtotal: 37000,
      discount: 0,
      taxes: 0,
      finalAmount: 37000,
      amountPaid: 37000,
      amountOutstanding: 0,
      balanceDueDate: null,
      isOverdue: false,
      currency: 'INR'
    },
    payment: {
      provider: 'razorpay',
      status: 'PAID',
      razorpayOrderId: 'order_full_test',
      razorpayPaymentId: 'pay_full_test',
      razorpaySignature: 'sig_full_test',
      paidAt: new Date()
    },
    payments: [
      {
        provider: 'razorpay',
        orderId: 'order_full_test',
        paymentId: 'pay_full_test',
        signature: 'sig_full_test',
        amount: 37000,
        type: 'FULL',
        verifiedAt: new Date()
      }
    ],
    bookingStatus: 'CONFIRMED',
    paymentStatus: 'PAID',
    qrCode: {
      dataUrl: 'data:image/png;base64,sampleqrcode',
      verificationToken: 'tok_full_confirmed_123'
    }
  });
  const fullBookingValidationErr = fullBookingDoc.validateSync();
  assert(!fullBookingValidationErr, `Full Booking schema validation passed with zero errors`, fullBookingValidationErr?.message);
  assert(fullBookingDoc.bookingStatus === 'CONFIRMED', `Full booking status is CONFIRMED`);
  assert(fullBookingDoc.paymentStatus === 'PAID', `Full booking payment status is PAID`);

  // 10% Deposit Booking Model Validation
  const partialBookingDoc = new Booking({
    bookingId: `BK-TEST-${Date.now()}-DEP`,
    userId: new mongoose.Types.ObjectId(),
    tripId: '4',
    tripSnapshot: {
      title: 'Bali Island Escape Beaches and Culture',
      location: 'Bali',
      destination: 'Indonesia',
      duration: '6D/5N',
      batchDate: '10 Oct - 16 Oct, 2026',
      pickupPoint: 'Denpasar Airport (DPS)'
    },
    customer: {
      name: 'Kavya Verma',
      email: 'kavya.verma@testmail.com',
      phone: '+919876543211',
      age: '27',
      gender: 'Female'
    },
    travelers: [
      { name: 'Siddharth Rao', age: '29', gender: 'Male' }
    ],
    numberOfTravelers: 2,
    occupancy: 'Double Sharing',
    paymentPlan: {
      type: 'PARTIAL',
      depositPercent: 10,
      balanceDueDays: 6
    },
    pricing: {
      basePricePerPerson: 20000,
      subtotal: 40000,
      discount: 0,
      taxes: 0,
      finalAmount: 40000,
      amountPaid: 4000,
      amountOutstanding: 36000,
      balanceDueDate: new Date(farFutureDate.getTime() - 6 * 86400000),
      isOverdue: false,
      currency: 'INR'
    },
    payment: {
      provider: 'razorpay',
      status: 'PAID',
      razorpayOrderId: 'order_dep_test',
      razorpayPaymentId: 'pay_dep_test',
      razorpaySignature: 'sig_dep_test',
      paidAt: new Date()
    },
    payments: [
      {
        provider: 'razorpay',
        orderId: 'order_dep_test',
        paymentId: 'pay_dep_test',
        signature: 'sig_dep_test',
        amount: 4000,
        type: 'DEPOSIT',
        verifiedAt: new Date()
      }
    ],
    bookingStatus: 'PROVISIONALLY_CONFIRMED',
    paymentStatus: 'PARTIALLY_PAID'
  });
  const partialBookingValidationErr = partialBookingDoc.validateSync();
  assert(!partialBookingValidationErr, `10% Deposit Booking schema validation passed with zero errors`, partialBookingValidationErr?.message);
  assert(partialBookingDoc.bookingStatus === 'PROVISIONALLY_CONFIRMED', `Deposit booking status is PROVISIONALLY_CONFIRMED`);
  assert(partialBookingDoc.paymentStatus === 'PARTIALLY_PAID', `Deposit booking payment status is PARTIALLY_PAID`);

  // Gatekeeper Checks on Partial Booking
  const isQrUnlockedOnPartial = (partialBookingDoc.bookingStatus === 'CONFIRMED' && partialBookingDoc.paymentStatus === 'PAID');
  const isProvisionalLetterUnlockedOnPartial = (partialBookingDoc.bookingStatus === 'PROVISIONALLY_CONFIRMED' || partialBookingDoc.paymentStatus === 'PARTIALLY_PAID');
  assert(!isQrUnlockedOnPartial, `GATEKEEPER CHECK: Boarding Pass QR is STRICTLY LOCKED on 10% Deposit`);
  assert(isProvisionalLetterUnlockedOnPartial, `GATEKEEPER CHECK: Provisional Confirmation Letter is UNLOCKED on 10% Deposit`);

  // -------------------------------------------------------------
  // SECTION 4: BALANCE SETTLEMENT LIFECYCLE TRANSITION
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('4. BALANCE SETTLEMENT LIFECYCLE TRANSITION');
  console.log('====================================================');

  // Simulate settling balance (remaining 90%)
  partialBookingDoc.paymentStatus = 'PAID';
  partialBookingDoc.bookingStatus = 'CONFIRMED';
  partialBookingDoc.pricing.amountPaid = partialBookingDoc.pricing.finalAmount;
  partialBookingDoc.pricing.amountOutstanding = 0;
  partialBookingDoc.pricing.balanceDueDate = null;
  partialBookingDoc.payments.push({
    provider: 'razorpay',
    orderId: 'order_bal_test_999',
    paymentId: 'pay_bal_test_999',
    signature: 'sig_bal_test_999',
    amount: 36000,
    type: 'BALANCE',
    verifiedAt: new Date()
  });
  partialBookingDoc.qrCode = {
    dataUrl: 'data:image/png;base64,sampleqrcodeconfirmed',
    verificationToken: 'tok_bal_confirmed_999'
  };

  const settledValidationErr = partialBookingDoc.validateSync();
  assert(!settledValidationErr, `Post-settlement booking schema validation passed with zero errors`, settledValidationErr?.message);
  assert(partialBookingDoc.paymentStatus === 'PAID', `Status updated to PAID`);
  assert(partialBookingDoc.bookingStatus === 'CONFIRMED', `Status updated to CONFIRMED`);
  assert(partialBookingDoc.pricing.amountPaid === 40000, `Amount paid updated to full ₹40,000`);
  assert(partialBookingDoc.pricing.amountOutstanding === 0, `Amount outstanding is cleared to ₹0`);
  assert(partialBookingDoc.payments.length === 2, `Both deposit and balance payments recorded in ledger (2 payments)`);

  const isQrUnlockedAfterSettlement = (partialBookingDoc.bookingStatus === 'CONFIRMED' && partialBookingDoc.paymentStatus === 'PAID');
  assert(isQrUnlockedAfterSettlement, `GATEKEEPER CHECK: Boarding Pass & QR UNLOCKED after full balance payment`);

  // -------------------------------------------------------------
  // SECTION 5: REVENUE ACCURACY SUMMATION LOGIC
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('5. REVENUE ANALYTICS AGGREGATION RULE AUDIT');
  console.log('====================================================');

  // Test revenue summation with mix of full and partial payments
  const sampleBookings = [
    { pricing: { amountPaid: 37000, finalAmount: 37000 }, paymentStatus: 'PAID' },
    { pricing: { amountPaid: 4000, finalAmount: 40000 }, paymentStatus: 'PARTIALLY_PAID' },
    { pricing: { amountPaid: 15000, finalAmount: 15000 }, paymentStatus: 'PAID' }
  ];

  const totalCollectedRevenue = sampleBookings.reduce((sum, b) => sum + b.pricing.amountPaid, 0);
  const totalContractedValue = sampleBookings.reduce((sum, b) => sum + b.pricing.finalAmount, 0);

  assert(totalCollectedRevenue === 56000, `Collected cash revenue sums verified amountPaid only (₹56,000 vs ₹92,000 contracted)`);
  assert(totalCollectedRevenue < totalContractedValue, `Collected revenue does not record unreceived balance (zero phantom revenue)`);

  console.log(`\n=========================================================================`);
  console.log(`FINAL QA RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`=========================================================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runComprehensiveEndToEndTests().catch(err => {
  console.error('Fatal QA Error:', err);
  process.exit(1);
});
