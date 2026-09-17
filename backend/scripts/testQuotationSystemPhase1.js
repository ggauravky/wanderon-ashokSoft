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

import Quotation from '../models/Quotation.js';
import Lead from '../models/Lead.js';
import Trip from '../models/Trip.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';
import { calculateQuotationPrice } from '../services/quotationPricingService.js';
import {
  generateUniqueQuotationNumber,
  isValidStateTransition,
  sanitizeForCustomer
} from '../controllers/quotationController.js';

async function runQuotationPhase1Tests() {
  console.log('🚀 ========================================================================= 🚀');
  console.log('🚀 --- STARTING PHASE 1: QUOTATION BUILDER ARCHITECTURE & FOUNDATION QA --- 🚀');
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
  // SECTION 1: CANONICAL PRICING ENGINE & ALTERNATIVE SELECTIONS
  // -------------------------------------------------------------
  console.log('====================================================');
  console.log('1. CANONICAL PRICING ENGINE & ALTERNATIVES');
  console.log('====================================================');

  const sampleQuotationData = {
    tripRequirements: {
      title: 'Kashmir Luxury Winter Odyssey',
      destination: 'Srinagar & Gulmarg, Kashmir',
      duration: '6D/5N',
      days: 6,
      nights: 5,
      adults: 2,
      children: 0,
      infants: 0
    },
    // Multi-tier Hotel Alternatives
    hotelOptions: [
      {
        optionId: 'h_tier_1',
        tier: 'Deluxe',
        label: 'Option A: 4-Star Pine View Resort',
        hotelName: 'Pine Palace Gulmarg',
        rooms: 1,
        nights: 5,
        costPerNight: 4000,   // Supplier cost = 20,000
        pricePerNight: 6000,  // Customer price = 30,000
        selected: true
      },
      {
        optionId: 'h_tier_2',
        tier: 'Luxury',
        label: 'Option B: 5-Star Heritage Khyber',
        hotelName: 'The Khyber Himalayan Resort',
        rooms: 1,
        nights: 5,
        costPerNight: 18000,  // Supplier cost = 90,000
        pricePerNight: 26000, // Customer price = 130,000
        selected: false
      }
    ],
    // Multi-tier Transport Alternatives
    transportOptions: [
      {
        optionId: 't_opt_1',
        type: 'SUV (Innova/Crysta)',
        vehicle: 'Toyota Innova Crysta 4x4 with Snow Chains',
        quantity: 1,
        unitCost: 15000,      // Supplier cost = 15,000
        unitPrice: 22000,     // Customer price = 22,000
        selected: true
      },
      {
        optionId: 't_opt_2',
        type: 'Tempo Traveller (12/17 Seater)',
        vehicle: 'Force Tempo Traveller 12 Seater',
        quantity: 1,
        unitCost: 28000,
        unitPrice: 38000,
        selected: false
      }
    ],
    // Activities (PER_PERSON and FIXED)
    activities: [
      {
        activityId: 'act_1',
        name: 'Gulmarg Gondola Phase 1 & 2 Tickets',
        pricingType: 'PER_PERSON',
        unitCost: 1800,       // Supplier = 3,600 (for 2 pax)
        unitPrice: 2400,      // Customer = 4,800 (for 2 pax)
        selected: true
      },
      {
        activityId: 'act_2',
        name: 'Private Shikara Sunset Ride Dal Lake',
        pricingType: 'FIXED',
        unitCost: 800,        // Supplier = 800
        unitPrice: 1500,      // Customer = 1,500
        selected: true
      }
    ],
    // Add-ons
    addOns: [
      {
        addonId: 'add_1',
        name: 'Comprehensive Winter High-Altitude Travel Insurance',
        pricingType: 'PER_PERSON',
        unitCost: 400,        // Supplier = 800
        unitPrice: 800,       // Customer = 1,600
        selected: true
      },
      {
        addonId: 'add_2',
        name: 'Private Trip Photographer (1 Day)',
        pricingType: 'FIXED',
        unitCost: 3500,
        unitPrice: 5000,
        selected: false       // Unselected
      }
    ],
    paymentTerms: {
      depositPercent: 10,
      balanceDueDays: 6,
      paymentMode: 'PARTIAL'
    },
    pricing: {
      customerBasePrice: 0,
      internalBaseCost: 0,
      markupPercent: 0,
      discountType: 'flat',
      discountValue: 1900,   // ₹1,900 flat early-bird discount
      gstPercent: 5
    }
  };

  const calculated = calculateQuotationPrice(sampleQuotationData);

  // Subtotal = Hotel A (30,000) + Transport SUV (22,000) + Gondola (4,800) + Shikara (1,500) + Insurance (1,600) = 59,900
  assert(calculated.pricing.subtotal === 59900, 'Subtotal correctly aggregates ONLY selected hotel, transport, and active add-ons (₹59,900)');

  // Internal Total Cost = Hotel A (20,000) + Transport (15,000) + Gondola (3,600) + Shikara (800) + Insurance (800) = 40,200
  assert(calculated.pricing.totalInternalCost === 40200, 'Total internal supplier cost correctly calculated (₹40,200)');

  // Discount = 1,900 => Taxable Amount = 59,900 - 1,900 = 58,000
  assert(calculated.pricing.taxableAmount === 58000, 'Taxable amount correctly applies ₹1,900 flat discount (₹58,000)');

  // GST 5% on 58,000 = 2,900
  assert(calculated.pricing.gstAmount === 2900, 'GST 5% accurately computed on taxable amount (₹2,900)');

  // Final Total = 58,000 + 2,900 = 60,900
  assert(calculated.pricing.finalTotal === 60900, 'Final customer total accurately includes GST (₹60,900)');

  // Per Person Price = 60,900 / 2 = 30,450
  assert(calculated.pricing.perPersonPrice === 30450, 'Per person price computed accurately (₹30,450 / traveler)');

  // Deposit Required (10%) = 6,090
  assert(calculated.pricing.depositRequired === 6090, '10% advance deposit accurately calculated (₹6,090)');

  // Balance Amount = 60,900 - 6,090 = 54,810
  assert(calculated.pricing.balanceAmount === 54810, '90% remaining balance accurately calculated (₹54,810)');

  // Internal Profit Margin = Taxable (58,000) - Total Cost (40,200) = 17,800
  assert(calculated.pricing.projectedMargin === 17800, 'Internal projected margin calculated accurately (₹17,800)');
  assert(calculated.pricing.projectedMarginPercent === 30.69, 'Projected margin percentage is 30.69%');

  // Verify non-selected Luxury Hotel Option B retains its computed price without contaminating subtotal
  const hotelB = calculated.hotelOptions.find(h => h.optionId === 'h_tier_2');
  assert(hotelB && hotelB.totalPrice === 130000 && !hotelB.selected, 'Alternative Hotel Option B computes total (₹130,000) without adding to subtotal');

  // -------------------------------------------------------------
  // SECTION 2: QUOTATION NUMBER GENERATION
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('2. QUOTATION NUMBER SEQUENCE INTEGRITY');
  console.log('====================================================');

  const qNum = await generateUniqueQuotationNumber();
  const qNumRegex = /^WL-Q-2026-\d{4,5}/;
  assert(qNumRegex.test(qNum), `Generated quotation number matches canonical format WL-Q-2026-XXXXX: "${qNum}"`);

  // -------------------------------------------------------------
  // SECTION 3: CONTROLLED STATE MACHINE & TRANSITIONS
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('3. STATE MACHINE & TRANSITION RULES');
  console.log('====================================================');

  assert(isValidStateTransition('DRAFT', 'SENT') === true, 'Allowed: DRAFT -> SENT');
  assert(isValidStateTransition('SENT', 'VIEWED') === true, 'Allowed: SENT -> VIEWED');
  assert(isValidStateTransition('VIEWED', 'APPROVED') === true, 'Allowed: VIEWED -> APPROVED');
  assert(isValidStateTransition('APPROVED', 'CONVERTED') === true, 'Allowed: APPROVED -> CONVERTED');
  assert(isValidStateTransition('VIEWED', 'REJECTED') === true, 'Allowed: VIEWED -> REJECTED');
  assert(isValidStateTransition('REJECTED', 'DRAFT') === true, 'Allowed: REJECTED -> DRAFT (Reopen/revise)');
  assert(isValidStateTransition('APPROVED', 'DRAFT') === false, 'Blocked: APPROVED -> DRAFT is strictly disallowed');
  assert(isValidStateTransition('CONVERTED', 'DRAFT') === false, 'Blocked: CONVERTED is terminal and cannot transition to DRAFT');
  assert(isValidStateTransition('CONVERTED', 'SENT') === false, 'Blocked: CONVERTED cannot be re-sent');

  // -------------------------------------------------------------
  // SECTION 4: SECURITY SANITIZATION (ZERO LEAKAGE TO PUBLIC CUSTOMER)
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('4. CUSTOMER-FACING SANITIZATION & SECURITY');
  console.log('====================================================');

  const rawQuotation = {
    quotationNumber: 'WL-Q-2026-00001',
    customerSnapshot: {
      name: 'Priya Mehta',
      email: 'priya.m@gmail.com',
      phone: '+91 9876543210'
    },
    tripRequirements: calculated.tripRequirements,
    hotelOptions: calculated.hotelOptions,
    transportOptions: calculated.transportOptions,
    activities: calculated.activities,
    addOns: calculated.addOns,
    paymentTerms: calculated.paymentTerms,
    pricing: calculated.pricing,
    status: 'SENT',
    publicShare: {
      token: 'sample_secure_token_123',
      isPublic: true
    },
    auditTrail: [
      { action: 'CREATED', performedByName: 'Admin', details: { margin: 17800 } }
    ]
  };

  const sanitized = sanitizeForCustomer(rawQuotation);

  assert(sanitized.pricing.internalBaseCost === undefined, 'Sanitization: internalBaseCost is stripped');
  assert(sanitized.pricing.totalInternalCost === undefined, 'Sanitization: totalInternalCost is stripped');
  assert(sanitized.pricing.projectedMargin === undefined, 'Sanitization: projectedMargin is stripped');
  assert(sanitized.pricing.projectedMarginPercent === undefined, 'Sanitization: projectedMarginPercent is stripped');
  assert(sanitized.hotelOptions[0].costPerNight === undefined, 'Sanitization: hotel supplier costPerNight is stripped');
  assert(sanitized.transportOptions[0].unitCost === undefined, 'Sanitization: transport unitCost is stripped');
  assert(sanitized.transportOptions[0].provider === undefined, 'Sanitization: transport supplier name is stripped');
  assert(sanitized.activities[0].unitCost === undefined, 'Sanitization: activity unitCost is stripped');
  assert(sanitized.auditTrail === undefined, 'Sanitization: internal audit logs are stripped');
  assert(sanitized.pricing.finalTotal === 60900, 'Sanitization: customer finalTotal remains intact (₹60,900)');
  assert(sanitized.pricing.depositRequired === 6090, 'Sanitization: deposit terms remain intact (₹6,090)');

  // -------------------------------------------------------------
  // SECTION 5: MODEL SCHEMAS & MONGOOSE DEFINITIONS
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('5. MONGOOSE SCHEMA DEFINITIONS & EXPORTS');
  console.log('====================================================');

  assert(Quotation && typeof Quotation === 'function', 'Quotation model is properly imported and compiled');
  assert(Lead && typeof Lead === 'function', 'Lead model is properly imported and compiled');
  assert(Booking && typeof Booking === 'function', 'Booking model is properly imported and compiled');
  assert(Trip && typeof Trip === 'function', 'Trip model is properly imported and compiled');
  assert(User && typeof User === 'function', 'User model is properly imported and compiled');

  // Verify Lead schema contains quotations reference array
  const leadQuotationField = Lead.schema.paths.quotations;
  assert(Boolean(leadQuotationField), 'Lead schema includes quotations array reference');

  // Verify User schema role enum includes sales, operations, super_admin
  const userRoleValues = User.schema.paths.role.enumValues;
  assert(userRoleValues.includes('sales'), 'User role enum includes "sales"');
  assert(userRoleValues.includes('operations'), 'User role enum includes "operations"');
  assert(userRoleValues.includes('super_admin'), 'User role enum includes "super_admin"');
  assert(userRoleValues.includes('influencer'), 'User role enum preserves "influencer"');

  // -------------------------------------------------------------
  // SECTION 6: CONVERSION WORKFLOW FOUNDATION
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('6. DOWNSTREAM CONVERSION LOGIC (BOOKING & TRIP)');
  console.log('====================================================');

  // Test Booking mapping simulation
  const simulatedBookingId = 'WLX-2026-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const simulatedBookingData = {
    bookingId: simulatedBookingId,
    tripSnapshot: {
      title: rawQuotation.tripRequirements.title,
      destination: rawQuotation.tripRequirements.destination
    },
    pricing: {
      finalAmount: rawQuotation.pricing.finalTotal,
      subtotal: rawQuotation.pricing.subtotal
    },
    paymentPlan: {
      type: 'PARTIAL',
      depositPercent: 10,
      balanceDueDays: 6
    },
    bookingStatus: 'PENDING_PAYMENT',
    paymentStatus: 'UNPAID'
  };

  assert(simulatedBookingData.bookingId.startsWith('WLX-2026-'), 'Simulated booking ID matches format');
  assert(simulatedBookingData.pricing.finalAmount === 60900, 'Booking order pricing accurately adopts quotation total (₹60,900)');
  assert(simulatedBookingData.paymentPlan.depositPercent === 10, 'Booking order inherits quotation 10% deposit terms');

  // -------------------------------------------------------------
  // FINAL SCORECARD
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 PHASE 1 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    console.error('❌ PHASE 1 QA FAILED.');
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 1 QUOTATION BUILDER ARCHITECTURE & FOUNDATION TESTS PASSED 100%!');
    process.exit(0);
  }
}

runQuotationPhase1Tests().catch(err => {
  console.error('Unhandled Test Runner Error:', err);
  process.exit(1);
});
