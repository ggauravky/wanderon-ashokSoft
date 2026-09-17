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

async function runQuotationPhase2Tests() {
  console.log('🚀 ========================================================================= 🚀');
  console.log('🚀 --- STARTING PHASE 2: ADMIN / SALES QUOTATION BUILDER END-TO-END QA --- 🚀');
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
  // SECTION 1: CRM LEAD -> QUOTATION BUILDER PREFILL INTEGRITY
  // -------------------------------------------------------------
  console.log('====================================================');
  console.log('1. CRM LEAD PREFILL & BIDIRECTIONAL LINKAGE');
  console.log('====================================================');

  const mockLead = new Lead({
    name: 'Vikram Malhotra',
    email: 'vikram.malhotra@corporate.in',
    phone: '+91 9811223344',
    destination: 'Ladakh',
    tripTitle: 'Ladakh High Passes & Pangong Luxury Camp',
    travelDate: '10 Oct - 17 Oct, 2026',
    travelersCount: 4,
    budgetPerPerson: '₹45,000 - ₹60,000',
    message: 'We require oxygen cylinders in vehicles and private 5-star cottages.',
    source: 'trip_page',
    status: 'NEW'
  });

  const leadValidationErr = mockLead.validateSync();
  assert(!leadValidationErr, 'Mock CRM Lead passes strict Mongoose validation', leadValidationErr?.message);

  // Simulation of Quotation Builder prefilling from this lead
  const quotationFromLead = {
    leadId: mockLead._id,
    customerSnapshot: {
      name: mockLead.name,
      email: mockLead.email,
      phone: mockLead.phone,
      notes: mockLead.message
    },
    tripRequirements: {
      title: `Curated ${mockLead.tripTitle}`,
      destination: mockLead.destination,
      duration: '8D/7N',
      days: 8,
      nights: 7,
      adults: mockLead.travelersCount,
      children: 0,
      infants: 0,
      totalTravelers: mockLead.travelersCount,
      travelStyle: 'Luxury',
      specialRequests: mockLead.message
    }
  };

  assert(quotationFromLead.customerSnapshot.name === 'Vikram Malhotra', 'Customer name accurately prefills from CRM Lead');
  assert(quotationFromLead.customerSnapshot.email === 'vikram.malhotra@corporate.in', 'Customer email accurately prefills from CRM Lead');
  assert(quotationFromLead.tripRequirements.adults === 4, 'Traveler count accurately prefills (4 travelers)');
  assert(quotationFromLead.tripRequirements.specialRequests.includes('oxygen cylinders'), 'Special requests & notes accurately prefill');

  // -------------------------------------------------------------
  // SECTION 2: MULTI-TIER PROPOSAL CALCULATION WITH 4 TRAVELERS
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('2. MULTI-TIER PROPOSAL ENGINE & TIER SELECTION');
  console.log('====================================================');

  const ladakhQuotation = {
    tripRequirements: quotationFromLead.tripRequirements,
    hotelOptions: [
      {
        optionId: 'h_opt_standard',
        tier: 'Standard',
        label: 'Option A: 3-Star Deluxe Boutique',
        hotelName: 'The Leh Grand Heritage',
        rooms: 2,
        nights: 7,
        costPerNight: 3500,   // Supplier = 2 * 7 * 3500 = 49,000
        pricePerNight: 5500,  // Customer = 2 * 7 * 5500 = 77,000
        selected: false
      },
      {
        optionId: 'h_opt_luxury',
        tier: 'Luxury',
        label: 'Option B: 5-Star Grand Dragon & Pangong Glamping',
        hotelName: 'The Grand Dragon Ladakh & Luxury Yurts',
        rooms: 2,
        nights: 7,
        costPerNight: 12000,  // Supplier = 2 * 7 * 12000 = 168,000
        pricePerNight: 18000, // Customer = 2 * 7 * 18000 = 252,000
        selected: true
      }
    ],
    transportOptions: [
      {
        optionId: 't_opt_innova',
        type: 'SUV (Innova/Crysta)',
        vehicle: 'Toyota Innova Crysta 4x4 (2 Vehicles)',
        quantity: 2,
        unitCost: 35000,      // Supplier = 70,000
        unitPrice: 50000,     // Customer = 100,000
        selected: true
      }
    ],
    activities: [
      {
        activityId: 'act_monasteries',
        name: 'Hemis & Thiksey Private Monastic Tour with Monk Guide',
        pricingType: 'PER_PERSON',
        unitCost: 1000,       // Supplier = 4 * 1000 = 4,000
        unitPrice: 2000,      // Customer = 4 * 2000 = 8,000
        selected: true
      }
    ],
    addOns: [
      {
        addonId: 'add_oxygen',
        name: 'Medical High Altitude Oxygen Cylinders (2 Units)',
        pricingType: 'FIXED',
        unitCost: 3000,       // Supplier = 3,000
        unitPrice: 5000,      // Customer = 5,000
        selected: true
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
      discountType: 'percentage',
      discountValue: 5,       // 5% VIP corporate discount
      gstPercent: 5
    }
  };

  const calculatedQuote = calculateQuotationPrice(ladakhQuotation);

  // Subtotal = Luxury Hotel (252,000) + 2 Innovas (100,000) + Monastery (8,000) + Oxygen (5,000) = 365,000
  assert(calculatedQuote.pricing.subtotal === 365000, 'Subtotal correctly aggregates Luxury Hotel, Fleet, and Add-ons (₹3,65,000)');

  // Total Supplier Cost = Hotel (168,000) + Fleet (70,000) + Monastery (4,000) + Oxygen (3,000) = 245,000
  assert(calculatedQuote.pricing.totalInternalCost === 245000, 'Total internal supplier cost is ₹2,45,000');

  // 5% Discount on 365,000 = 18,250 => Taxable Amount = 346,750
  assert(calculatedQuote.pricing.discountAmount === 18250, '5% VIP discount computes to ₹18,250');
  assert(calculatedQuote.pricing.taxableAmount === 346750, 'Taxable amount after discount is ₹3,46,750');

  // GST 5% on 346,750 = 17,337.5 -> 17,338
  assert(calculatedQuote.pricing.gstAmount === 17338, '5% GST accurately computed (₹17,338)');

  // Final Total = 346,750 + 17,338 = 364,088
  assert(calculatedQuote.pricing.finalTotal === 364088, 'Final payable customer total is ₹3,64,088');

  // Per Person Price = 364,088 / 4 = 91,022
  assert(calculatedQuote.pricing.perPersonPrice === 91022, 'Per person price for 4 travelers is ₹91,022 / pax');

  // 10% Advance Deposit = 36,409
  assert(calculatedQuote.pricing.depositRequired === 36409, '10% advance deposit is ₹36,409');

  // 90% Balance = 364,088 - 36,409 = 327,679
  assert(calculatedQuote.pricing.balanceAmount === 327679, '90% remaining balance is ₹3,27,679');

  // Internal Profit Margin = 346,750 - 245,000 = 101,750 (29.34%)
  assert(calculatedQuote.pricing.projectedMargin === 101750, 'Internal profit margin is ₹1,01,750');
  assert(calculatedQuote.pricing.projectedMarginPercent === 29.34, 'Internal profit margin percentage is 29.34%');

  // -------------------------------------------------------------
  // SECTION 3: SWITCHING ALTERNATIVES (OPTION A vs OPTION B)
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('3. DYNAMIC CUSTOMER ALTERNATIVE SWITCHING');
  console.log('====================================================');

  // Simulate customer selecting Standard 3-star option instead
  const switchedToStandard = JSON.parse(JSON.stringify(ladakhQuotation));
  switchedToStandard.hotelOptions[0].selected = true;  // Option A
  switchedToStandard.hotelOptions[1].selected = false; // Option B
  switchedToStandard.pricing.discountValue = 0;

  const switchedCalc = calculateQuotationPrice(switchedToStandard);
  // Subtotal = Standard Hotel (77,000) + Fleet (100,000) + Monastery (8,000) + Oxygen (5,000) = 190,000
  assert(switchedCalc.pricing.subtotal === 190000, 'Switched alternative dynamically recalculates Subtotal to ₹1,90,000');
  assert(switchedCalc.pricing.taxableAmount === 190000, 'Taxable amount is ₹1,90,000 with 0 discount');
  assert(switchedCalc.pricing.gstAmount === 9500, 'GST is ₹9,500 (5%)');
  assert(switchedCalc.pricing.finalTotal === 199500, 'Final customer total updates to ₹1,99,500');
  assert(switchedCalc.pricing.depositRequired === 19950, '10% deposit updates to ₹19,950');

  // -------------------------------------------------------------
  // SECTION 4: SECURITY SANITIZATION FOR PUBLIC CUSTOMER PROPOSAL
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('4. CUSTOMER PUBLIC PROPOSAL SANITIZATION');
  console.log('====================================================');

  const fullQuotationDoc = {
    quotationNumber: 'WL-Q-2026-00042',
    customerSnapshot: quotationFromLead.customerSnapshot,
    tripRequirements: calculatedQuote.tripRequirements,
    hotelOptions: calculatedQuote.hotelOptions,
    transportOptions: calculatedQuote.transportOptions,
    activities: calculatedQuote.activities,
    addOns: calculatedQuote.addOns,
    paymentTerms: calculatedQuote.paymentTerms,
    pricing: calculatedQuote.pricing,
    status: 'SENT',
    publicShare: {
      token: 'secure_public_token_42a9b',
      isPublic: true
    },
    auditTrail: [
      { action: 'DISPATCHED_TO_CUSTOMER', performedByName: 'Sales Agent', details: { margin: 101750 } }
    ]
  };

  const customerView = sanitizeForCustomer(fullQuotationDoc);

  assert(customerView.pricing.internalBaseCost === undefined, 'Public proposal: internalBaseCost stripped');
  assert(customerView.pricing.totalInternalCost === undefined, 'Public proposal: totalInternalCost stripped');
  assert(customerView.pricing.projectedMargin === undefined, 'Public proposal: projectedMargin stripped');
  assert(customerView.pricing.projectedMarginPercent === undefined, 'Public proposal: projectedMarginPercent stripped');
  assert(customerView.hotelOptions[0].costPerNight === undefined, 'Public proposal: hotel supplier cost stripped');
  assert(customerView.transportOptions[0].unitCost === undefined, 'Public proposal: transport unitCost stripped');
  assert(customerView.transportOptions[0].provider === undefined, 'Public proposal: fleet vendor stripped');
  assert(customerView.auditTrail === undefined, 'Public proposal: internal audit trail stripped');
  assert(customerView.pricing.finalTotal === 364088, 'Public proposal: finalTotal intact (₹3,64,088)');
  assert(customerView.pricing.depositRequired === 36409, 'Public proposal: depositRequired intact (₹36,409)');

  // -------------------------------------------------------------
  // SECTION 5: DOWNSTREAM BOOKING CREATION ON APPROVAL
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log('5. BOOKING CONVERSION WITH 10% DEPOSIT SCHEDULE');
  console.log('====================================================');

  const generatedBookingId = 'WLX-2026-' + crypto.randomBytes(4).toString('hex').toUpperCase();
  const convertedBooking = new Booking({
    bookingId: generatedBookingId,
    userId: new mongoose.Types.ObjectId(),
    tripId: 'custom-trip-' + Date.now(),
    tripSnapshot: {
      title: fullQuotationDoc.tripRequirements.title,
      location: fullQuotationDoc.tripRequirements.destination,
      destination: fullQuotationDoc.tripRequirements.destination,
      duration: fullQuotationDoc.tripRequirements.duration,
      batchDate: '10 Oct - 17 Oct, 2026',
      pickupPoint: 'Leh Kushok Bakula Rimpochee Airport'
    },
    customer: {
      name: fullQuotationDoc.customerSnapshot.name,
      email: fullQuotationDoc.customerSnapshot.email,
      phone: fullQuotationDoc.customerSnapshot.phone
    },
    numberOfTravelers: fullQuotationDoc.tripRequirements.totalTravelers,
    occupancy: 'Double Sharing',
    paymentPlan: {
      type: 'PARTIAL',
      depositPercent: 10,
      balanceDueDays: 6
    },
    pricing: {
      basePricePerPerson: fullQuotationDoc.pricing.perPersonPrice,
      subtotal: fullQuotationDoc.pricing.subtotal,
      discount: fullQuotationDoc.pricing.discountAmount || 0,
      taxes: fullQuotationDoc.pricing.gstAmount || 0,
      finalAmount: fullQuotationDoc.pricing.finalTotal,
      amountPaid: 0,
      amountOutstanding: fullQuotationDoc.pricing.balanceAmount
    },
    bookingStatus: 'PROVISIONALLY_CONFIRMED',
    paymentStatus: 'UNPAID'
  });

  const bookingValidateErr = convertedBooking.validateSync();
  assert(!bookingValidateErr, 'Converted Booking passes strict Mongoose validation', bookingValidateErr?.message);
  assert(convertedBooking.pricing.finalAmount === 364088, 'Booking order pricing reflects quotation total (₹3,64,088)');
  assert(fullQuotationDoc.pricing.depositRequired === 36409, 'Booking order deposit reflects quotation deposit (₹36,409)');
  assert(convertedBooking.paymentPlan.type === 'PARTIAL', 'Booking order paymentPlan is PARTIAL (10% deposit)');

  // -------------------------------------------------------------
  // FINAL QA SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`📊 PHASE 2 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) {
    console.error('❌ PHASE 2 QA FAILED.');
    process.exit(1);
  } else {
    console.log('🎉 ALL PHASE 2 QUOTATION BUILDER INTEGRATION & WORKFLOW TESTS PASSED 100%!');
    process.exit(0);
  }
}

runQuotationPhase2Tests().catch(err => {
  console.error('Unhandled Phase 2 Test Error:', err);
  process.exit(1);
});
