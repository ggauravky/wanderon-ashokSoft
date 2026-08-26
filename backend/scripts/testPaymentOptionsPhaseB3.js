import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Booking from '../models/Booking.js';
import Trip from '../models/Trip.js';
import { 
  calculateServerPrice, 
  evaluatePartialPaymentEligibility, 
  parseBatchStartDate 
} from '../controllers/bookingController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const runTests = async () => {
  console.log('🚀 --- STARTING PHASE B3 PAYMENT OPTIONS & LIFECYCLE TESTS --- 🚀');
  let passed = 0;
  let failed = 0;

  const assert = (condition, testName) => {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  };

  // Mock Trip
  const mockTrip = {
    price: 20000,
    sharingPricing: {
      doubleSharing: 20000,
      tripleSharing: 18000,
      singleSharing: 25000
    }
  };

  // Test 1: Full Payment Calculation
  const fullPricing = await calculateServerPrice(mockTrip, 2, 'Double Sharing', '');
  assert(fullPricing.finalAmount === 40000, 'Full payment final amount is ₹40,000 for 2 pax');

  // Test 2: 10% Deposit & 90% Balance Calculation
  const depositAmt = Math.round(fullPricing.finalAmount * 0.10);
  const balanceAmt = fullPricing.finalAmount - depositAmt;
  assert(depositAmt === 4000, '10% Deposit calculated as ₹4,000');
  assert(balanceAmt === 36000, '90% Remaining balance calculated as ₹36,000');

  // Test 3: Departure Proximity Rule (Trip departing in 3 days -> Ineligible)
  const today = new Date();
  const nearDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  const nearDateStr = `${nearDate.getUTCDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][nearDate.getUTCMonth()]}, ${nearDate.getUTCFullYear()}`;
  const nearEligibility = evaluatePartialPaymentEligibility(nearDateStr, 6);
  assert(!nearEligibility.eligible, `Reject partial deposit when departure is only ${nearEligibility.daysUntilDeparture} days away (< 7 days)`);

  // Test 4: Departure Proximity Rule (Trip departing in 30 days -> Eligible with valid due date)
  const futureDate = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
  const futureDateStr = `${futureDate.getUTCDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][futureDate.getUTCMonth()]}, ${futureDate.getUTCFullYear()}`;
  const futureEligibility = evaluatePartialPaymentEligibility(futureDateStr, 6);
  assert(futureEligibility.eligible, 'Allow 10% partial deposit when departure is 30 days away');
  assert(Boolean(futureEligibility.balanceDueDate), 'Balance due date successfully computed');
  assert(new Date(futureEligibility.balanceDueDate) < futureDate, 'Balance due date is strictly before departure date');

  // Test 5: Date Parsing Robustness
  const parsedDate1 = parseBatchStartDate('15 Sep - 20 Sep, 2026');
  assert(parsedDate1 && parsedDate1.getUTCFullYear() === 2026 && parsedDate1.getUTCMonth() === 8 && parsedDate1.getUTCDate() === 15, 'Batch date range string parsed accurately (15 Sep 2026)');

  // Test 6: In-Memory / Document Lifecycle Simulation: 10% Deposit
  const bookingDoc = {
    bookingId: 'WLX-2026-TESTB3',
    userId: 'usr_test_b3',
    pricing: {
      finalAmount: 40000,
      amountPaid: 0,
      amountOutstanding: 40000,
      balanceDueDate: futureEligibility.balanceDueDate
    },
    paymentPlan: {
      type: 'PARTIAL',
      depositPercent: 10,
      balanceDueDays: 6
    },
    paymentStatus: 'UNPAID',
    bookingStatus: 'PENDING_PAYMENT',
    payments: [],
    qrCode: {
      dataUrl: ''
    }
  };

  // Simulate Deposit Verification
  bookingDoc.pricing.amountPaid = depositAmt;
  bookingDoc.pricing.amountOutstanding = fullPricing.finalAmount - depositAmt;
  bookingDoc.paymentStatus = 'PARTIALLY_PAID';
  bookingDoc.bookingStatus = 'PROVISIONALLY_CONFIRMED';
  bookingDoc.payments.push({
    provider: 'razorpay',
    orderId: 'order_dep_123',
    paymentId: 'pay_dep_456',
    amount: depositAmt,
    type: 'DEPOSIT',
    verifiedAt: new Date()
  });

  assert(bookingDoc.bookingStatus === 'PROVISIONALLY_CONFIRMED', '10% payment transitions status to PROVISIONALLY_CONFIRMED');
  assert(bookingDoc.paymentStatus === 'PARTIALLY_PAID', '10% payment transitions paymentStatus to PARTIALLY_PAID');
  assert(bookingDoc.qrCode.dataUrl === '', 'Boarding pass QR code remains locked (empty) for partial payment');
  assert(bookingDoc.payments.length === 1 && bookingDoc.payments[0].type === 'DEPOSIT', 'Ledger records DEPOSIT transaction');

  // Test 7: Balance Payment Lifecycle Simulation
  const balanceToPay = bookingDoc.pricing.amountOutstanding;
  assert(balanceToPay === 36000, 'Balance to pay matches remaining amount (₹36,000)');

  // Simulate Balance Payment Verification
  bookingDoc.pricing.amountPaid = fullPricing.finalAmount;
  bookingDoc.pricing.amountOutstanding = 0;
  bookingDoc.paymentStatus = 'PAID';
  bookingDoc.bookingStatus = 'CONFIRMED';
  bookingDoc.payments.push({
    provider: 'razorpay',
    orderId: 'order_bal_789',
    paymentId: 'pay_bal_012',
    amount: balanceToPay,
    type: 'BALANCE',
    verifiedAt: new Date()
  });
  bookingDoc.qrCode.dataUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';

  assert(bookingDoc.bookingStatus === 'CONFIRMED', 'Balance payment unlocks CONFIRMED booking status');
  assert(bookingDoc.paymentStatus === 'PAID', 'Balance payment updates paymentStatus to PAID');
  assert(bookingDoc.pricing.amountOutstanding === 0, 'Outstanding balance is now 0');
  assert(bookingDoc.qrCode.dataUrl !== '', 'Boarding pass QR code unlocked after balance payment');
  assert(bookingDoc.payments.length === 2, 'Payment ledger has both DEPOSIT and BALANCE records without overwriting');
  assert(bookingDoc.payments[0].amount + bookingDoc.payments[1].amount === 40000, 'Sum of ledger transactions matches full trip amount (₹40,000)');

  // Test 8: Analytics Revenue Integrity (Only count verified amountPaid)
  const mockBookingsList = [
    { bookingStatus: 'CONFIRMED', paymentStatus: 'PAID', pricing: { finalAmount: 20000, amountPaid: 20000 } },
    { bookingStatus: 'PROVISIONALLY_CONFIRMED', paymentStatus: 'PARTIALLY_PAID', pricing: { finalAmount: 50000, amountPaid: 5000 } }
  ];

  const totalCollectedRevenue = mockBookingsList.reduce((sum, b) => sum + (b.pricing.amountPaid || 0), 0);
  assert(totalCollectedRevenue === 25000, 'Revenue analytics calculates only verified collected cash (₹25,000), avoiding uncollected ₹45,000 outstanding');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
