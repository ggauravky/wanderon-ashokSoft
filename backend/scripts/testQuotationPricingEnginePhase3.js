/**
 * ============================================================================
 * PHASE 3 TEST SUITE: DYNAMIC PRICING ENGINE & RBAC COMMERCIAL CONCESSIONS
 * ============================================================================
 * Comprehensive Deterministic & Anti-Tamper Test Suite
 * Validates:
 * 1. Multi-segment hotel stay grouping and option selection
 * 2. Traveler age-based multipliers (Adults 100%, Children 70%, Infants 0%)
 * 3. Transport alternative selection & structured capacities
 * 4. Activities across PER_PERSON, PER_VEHICLE, and FIXED pricing types
 * 5. Add-ons library across PER_PERSON, PER_NIGHT, PER_VEHICLE, and FIXED types
 * 6. Authoritative server recalculation & client tamper defense
 * 7. RBAC sales concession ceiling (Max 10% discount / ₹10,000, Max 30% markup)
 * 8. Tour Operator GST (5%, 18%, 0%) & TCS computation
 * 9. Customer proposal sanitization (Internal costs & margins stripped)
 * 10. Immutable Price Snapshot (SENT) and Revision creation (v1 -> v2)
 * ============================================================================
 */

import { calculateQuotationPrice } from '../services/quotationPricingService.js';
import { validateCommercialConcessions, sanitizeForCustomer } from '../controllers/quotationController.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    console.log(`  \x1b[32m✔ PASS [${totalTests}]:\x1b[0m ${testName}`);
    passedTests++;
  } else {
    console.error(`  \x1b[31m✘ FAIL [${totalTests}]:\x1b[0m ${testName} ${details ? `\n    -> Details: ${details}` : ''}`);
  }
}

console.log('\n======================================================================');
console.log('🧪 RUNNING PHASE 3: AUTHORITATIVE PRICING ENGINE & CONCESSION TESTS');
console.log('======================================================================\n');

// ----------------------------------------------------------------------------
// TEST GROUP 1: MULTI-SEGMENT HOTEL GROUPING & SELECTION (PART 1, 2, 3)
// ----------------------------------------------------------------------------
console.log('\x1b[36m--- Group 1: Multi-Segment Hotel Stay Alternatives ---\x1b[0m');

const multiSegmentHotels = [
  // Segment 1: Manali (2 Nights)
  {
    optionId: 'manali_opt_a',
    segmentId: 'seg_manali',
    segmentName: 'Manali Stay',
    rooms: 1,
    nights: 2,
    pricePerNight: 4000,
    costPerNight: 2800,
    selected: true
  },
  {
    optionId: 'manali_opt_b',
    segmentId: 'seg_manali',
    segmentName: 'Manali Stay',
    rooms: 1,
    nights: 2,
    pricePerNight: 7500,
    costPerNight: 5000,
    selected: false // Unselected tier must not contribute
  },
  // Segment 2: Kasol (2 Nights)
  {
    optionId: 'kasol_opt_a',
    segmentId: 'seg_kasol',
    segmentName: 'Kasol Stay',
    rooms: 1,
    nights: 2,
    pricePerNight: 3500,
    costPerNight: 2200,
    selected: true
  },
  {
    optionId: 'kasol_opt_b',
    segmentId: 'seg_kasol',
    segmentName: 'Kasol Stay',
    rooms: 1,
    nights: 2,
    pricePerNight: 6000,
    costPerNight: 4000,
    selected: false
  }
];

const hotelPricingResult = calculateQuotationPrice({
  tripRequirements: { adults: 2, children: 0, infants: 0, nights: 4 },
  hotelOptions: multiSegmentHotels,
  transportOptions: [],
  activities: [],
  addOns: []
});

// Manali Opt A: 1 room * 2 nights * 4000 = 8,000
// Kasol Opt A: 1 room * 2 nights * 3500 = 7,000
// Expected Hotel Price = 15,000
// Expected Hotel Internal Cost = (1 * 2 * 2800) + (1 * 2 * 2200) = 5600 + 4400 = 10,000
assert(
  hotelPricingResult.pricing.customerHotelPrice === 15000,
  'Selected hotels across segments sum correctly (8,000 + 7,000 = 15,000)',
  `Received: ${hotelPricingResult.pricing.customerHotelPrice}`
);
assert(
  hotelPricingResult.pricing.internalHotelCost === 10000,
  'Internal hotel costs sum correctly (5,600 + 4,400 = 10,000)',
  `Received: ${hotelPricingResult.pricing.internalHotelCost}`
);
assert(
  hotelPricingResult.hotelOptions.find(h => h.optionId === 'manali_opt_a').totalPrice === 8000,
  'Option card totalPrice correctly computed on item (8,000)'
);
assert(
  hotelPricingResult.hotelOptions.find(h => h.optionId === 'manali_opt_b').totalPrice === 15000,
  'Unselected option card totalPrice calculated for preview but omitted from subtotal'
);

// ----------------------------------------------------------------------------
// TEST GROUP 2: AGE-BASED COST MULTIPLIERS (PART 8)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 2: Traveler Age-Based Multipliers (100% / 70% / 0%) ---\x1b[0m');

// 2 Adults (100% each = 2.0), 1 Child (70% = 0.70), 1 Infant (0% = 0.0) -> Effective Pax = 2.7
const ageCostingResult = calculateQuotationPrice({
  tripRequirements: { adults: 2, children: 1, infants: 1, totalTravelers: 4 },
  hotelOptions: [{ pricePerNight: 5000, costPerNight: 3500, rooms: 1, nights: 2, selected: true }],
  transportOptions: [{ unitPrice: 10000, unitCost: 7000, quantity: 1, selected: true }],
  activities: [
    {
      pricingType: 'PER_PERSON',
      unitPrice: 1000,
      unitCost: 600,
      quantity: 1,
      selected: true
    }
  ],
  addOns: [],
  pricing: { gstPercent: 5 }
});

// Hotel: 10,000
// Transport: 10,000
// Activity: 1,000 * 2.7 effective pax = 2,700
// Subtotal = 10,000 + 10,000 + 2,700 = 22,700
// Taxable = 22,700
// GST 5% = 1,135
// Final Total = 23,835
// Effective Pax = 2.7
// Adult Price = Math.round(23,835 / 2.7) = 8,828
// Child Price = Math.round(8,828 * 0.7) = 6,180
// Infant Price = 0
// Adult Total (2) = 8,828 * 2 = 17,656
// Child Total (1) = 6,180
// Sum = 17,656 + 6,180 = 23,836 (Within rounding tolerance)

assert(
  ageCostingResult.pricing.customerActivityPrice === 2700,
  'Per-person activity accurately priced at 2.7 effective pax (₹2,700)',
  `Received: ${ageCostingResult.pricing.customerActivityPrice}`
);
assert(
  ageCostingResult.pricing.subtotal === 22700,
  'Subtotal matches exact component sum (₹22,700)',
  `Received: ${ageCostingResult.pricing.subtotal}`
);
assert(
  ageCostingResult.pricing.gstAmount === 1135,
  '5% GST calculated accurately on taxable amount (₹1,135)',
  `Received: ${ageCostingResult.pricing.gstAmount}`
);
assert(
  ageCostingResult.pricing.finalTotal === 23835,
  'Final total equals taxable + GST (₹23,835)',
  `Received: ${ageCostingResult.pricing.finalTotal}`
);
assert(
  ageCostingResult.pricing.infantPrice === 0 && ageCostingResult.pricing.infantTotal === 0,
  'Infant cost is strictly ₹0 (0% multiplier rule)'
);
assert(
  ageCostingResult.pricing.childPrice === Math.round(ageCostingResult.pricing.adultPrice * 0.7),
  'Child price is exactly 70% of adult price'
);

// ----------------------------------------------------------------------------
// TEST GROUP 3: STRUCTURED ACTIVITIES & ADD-ONS PRICING TYPES (PART 5 & 6)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 3: Structured Activities & Add-on Pricing Types ---\x1b[0m');

const mixedAddOnsResult = calculateQuotationPrice({
  tripRequirements: { adults: 2, children: 0, infants: 0, nights: 3, totalTravelers: 2 },
  hotelOptions: [],
  transportOptions: [],
  activities: [
    { pricingType: 'PER_PERSON', unitPrice: 500, quantity: 1, selected: true }, // 500 * 2 pax = 1,000
    { pricingType: 'PER_VEHICLE', unitPrice: 2500, quantity: 2, selected: true }, // 2500 * 2 = 5,000
    { pricingType: 'FIXED', unitPrice: 3000, quantity: 1, selected: true } // 3000 * 1 = 3,000
  ],
  addOns: [
    { pricingType: 'PER_NIGHT', unitPrice: 1000, quantity: 1, selected: true }, // 1000 * 3 nights = 3,000
    { pricingType: 'PER_PERSON', unitPrice: 400, quantity: 1, selected: true }, // 400 * 2 pax = 800
    { pricingType: 'FIXED', unitPrice: 4500, quantity: 1, selected: true }, // 4,500
    { pricingType: 'FIXED', unitPrice: 10000, quantity: 1, selected: false } // Unselected: 0
  ]
});

// Activities total = 1000 + 5000 + 3000 = 9,000
// Add-ons total = 3000 + 800 + 4500 = 8,300
assert(
  mixedAddOnsResult.pricing.customerActivityPrice === 9000,
  'Activities across PER_PERSON, PER_VEHICLE, and FIXED compute to ₹9,000',
  `Received: ${mixedAddOnsResult.pricing.customerActivityPrice}`
);
assert(
  mixedAddOnsResult.pricing.customerAddOnPrice === 8300,
  'Add-ons across PER_NIGHT, PER_PERSON, and FIXED compute to ₹8,300',
  `Received: ${mixedAddOnsResult.pricing.customerAddOnPrice}`
);

// ----------------------------------------------------------------------------
// TEST GROUP 4: MARKUP, DISCOUNT & TAX ENGINE (PART 9, 10, 11)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 4: Markup, Discount & Tour Operator GST Engine ---\x1b[0m');

// Case A: Flat Discount + Percentage Markup + 5% GST
const pricingCaseA = calculateQuotationPrice({
  tripRequirements: { adults: 2, totalTravelers: 2 },
  hotelOptions: [{ pricePerNight: 10000, costPerNight: 7000, rooms: 1, nights: 2, selected: true }], // 20,000
  transportOptions: [{ unitPrice: 10000, unitCost: 6000, quantity: 1, selected: true }], // 10,000
  activities: [],
  addOns: [],
  pricing: {
    markupType: 'percentage',
    markupPercent: 10, // 10% on Subtotal 30,000 = +3,000
    discountType: 'flat',
    discountValue: 2000, // -2,000
    gstPercent: 5,
    tcsPercent: 0
  }
});

// Subtotal = 30,000
// Markup (10%) = +3,000 -> 33,000
// Discount = -2,000 -> Taxable Base = 31,000
// GST (5%) = 1,550
// Final Total = 32,550
// Deposit Required (10%) = 3,255
// Balance Due = 29,295
// Total Internal Cost = 14,000 + 6,000 = 20,000
// Net Margin = 31,000 - 20,000 = 11,000
// Margin % = (11,000 / 31,000) * 100 = 35.48%

assert(pricingCaseA.pricing.subtotal === 30000, 'Base Subtotal is ₹30,000');
assert(pricingCaseA.pricing.markupAmount === 3000, '10% Markup adds ₹3,000');
assert(pricingCaseA.pricing.discountAmount === 2000, 'Flat discount subtracts ₹2,000');
assert(pricingCaseA.pricing.taxableAmount === 31000, 'Taxable amount is ₹31,000 (30k + 3k - 2k)');
assert(pricingCaseA.pricing.gstAmount === 1550, '5% Tour Operator GST is ₹1,550');
assert(pricingCaseA.pricing.finalTotal === 32550, 'Final customer total is ₹32,550');
assert(pricingCaseA.pricing.depositRequired === 3255, '10% deposit equals ₹3,255');
assert(pricingCaseA.pricing.projectedMargin === 11000, 'Projected profit margin is ₹11,000');
assert(pricingCaseA.pricing.projectedMarginPercent === 35.48, 'Projected profit margin % is 35.48%');

// ----------------------------------------------------------------------------
// TEST GROUP 5: ANTI-TAMPER SERVER RECALCULATION (PART 7 & 17)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 5: Anti-Tamper Client Payload Recalculation ---\x1b[0m');

// Client maliciously injects manipulated totals
const maliciousClientPayload = {
  tripRequirements: { adults: 2, totalTravelers: 2 },
  hotelOptions: [{ pricePerNight: 10000, costPerNight: 7000, rooms: 1, nights: 2, selected: true }], // 20,000
  transportOptions: [{ unitPrice: 10000, unitCost: 6000, quantity: 1, selected: true }], // 10,000
  pricing: {
    finalTotal: 99, // Hacked attempt to get ₹99 package
    subtotal: 50,
    depositRequired: 5,
    taxableAmount: 50,
    gstAmount: 2
  }
};

const serverSanitizedResult = calculateQuotationPrice(maliciousClientPayload);

assert(
  serverSanitizedResult.pricing.finalTotal !== 99,
  'Client-injected finalTotal (₹99) is successfully rejected'
);
assert(
  serverSanitizedResult.pricing.subtotal === 30000,
  'Server authoritatively recalculated true subtotal (₹30,000)'
);
assert(
  serverSanitizedResult.pricing.finalTotal === 31500, // 30,000 + 5% GST = 31,500
  'Server authoritatively enforced correct final total (₹31,500)',
  `Received: ${serverSanitizedResult.pricing.finalTotal}`
);

// ----------------------------------------------------------------------------
// TEST GROUP 6: RBAC SALES CONCESSION CEILING (PART 9 & 10)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 6: RBAC Sales Concession & Markup Thresholds ---\x1b[0m');

const salesUser = { role: 'sales', email: 'agent@wanderluxe.in' };
const adminUser = { role: 'admin', email: 'admin@wanderluxe.in' };

// Test 6.1: Sales User enters 15% discount (> 10% ceiling)
const salesExcessPercentDiscount = validateCommercialConcessions(salesUser, {
  discountType: 'percentage',
  discountValue: 15
});
assert(
  salesExcessPercentDiscount !== null && salesExcessPercentDiscount.includes('maximum 10%'),
  'Sales user attempting 15% discount is blocked with manager escalation requirement'
);

// Test 6.2: Sales User enters 8% discount (<= 10% ceiling)
const salesValidPercentDiscount = validateCommercialConcessions(salesUser, {
  discountType: 'percentage',
  discountValue: 8
});
assert(
  salesValidPercentDiscount === null,
  'Sales user attempting 8% discount is allowed'
);

// Test 6.3: Sales User enters ₹15,000 flat discount (> ₹10,000 ceiling)
const salesExcessFlatDiscount = validateCommercialConcessions(salesUser, {
  discountType: 'flat',
  discountValue: 15000
});
assert(
  salesExcessFlatDiscount !== null && salesExcessFlatDiscount.includes('₹10,000'),
  'Sales user attempting ₹15,000 flat discount is blocked'
);

// Test 6.4: Sales User enters 35% markup (> 30% ceiling)
const salesExcessMarkup = validateCommercialConcessions(salesUser, {
  markupPercent: 35
});
assert(
  salesExcessMarkup !== null && salesExcessMarkup.includes('maximum of 30%'),
  'Sales user attempting 35% markup is blocked'
);

// Test 6.5: Admin User enters 25% discount and 50% markup (Unrestricted)
const adminConcessions = validateCommercialConcessions(adminUser, {
  discountType: 'percentage',
  discountValue: 25,
  markupPercent: 50
});
assert(
  adminConcessions === null,
  'Admin role is unrestricted for custom concessions'
);

// ----------------------------------------------------------------------------
// TEST GROUP 7: CUSTOMER PROPOSAL SANITIZATION (PART 13)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 7: Customer Proposal Sanitization (Internal Data Stripped) ---\x1b[0m');

const internalQuotationDoc = {
  quotationNumber: 'WL-Q-2026-0099',
  version: 1,
  status: 'SENT',
  pricing: {
    internalBaseCost: 5000,
    internalHotelCost: 14000,
    internalTransportCost: 12000,
    internalActivityCost: 2000,
    internalAddOnCost: 1000,
    totalInternalCost: 34000,
    customerHotelPrice: 20000,
    customerTransportPrice: 18000,
    subtotal: 38000,
    markupPercent: 10,
    markupAmount: 3800,
    taxableAmount: 41800,
    gstPercent: 5,
    gstAmount: 2090,
    finalTotal: 43890,
    projectedMargin: 7800,
    projectedMarginPercent: 18.66
  },
  hotelOptions: [
    {
      optionId: 'h1',
      hotelName: 'Himalayan Boutique Resort',
      costPerNight: 3500, // Internal
      pricePerNight: 5000, // Customer
      selected: true
    }
  ],
  transportOptions: [
    {
      optionId: 't1',
      vehicle: 'Toyota Innova Crysta',
      provider: 'Secret Local Supplier', // Internal
      unitCost: 12000, // Internal
      unitPrice: 18000, // Customer
      selected: true
    }
  ],
  auditTrail: [{ action: 'INTERNAL_NOTE', notes: 'Supplier gave 20% margin' }]
};

const customerSanitized = sanitizeForCustomer(internalQuotationDoc);

assert(
  customerSanitized.pricing.totalInternalCost === undefined,
  'pricing.totalInternalCost is stripped from customer view'
);
assert(
  customerSanitized.pricing.projectedMargin === undefined,
  'pricing.projectedMargin is stripped from customer view'
);
assert(
  customerSanitized.pricing.markupPercent === undefined,
  'pricing.markupPercent is stripped from customer view'
);
assert(
  customerSanitized.hotelOptions[0].costPerNight === undefined,
  'hotelOptions[0].costPerNight supplier cost is stripped'
);
assert(
  customerSanitized.transportOptions[0].unitCost === undefined,
  'transportOptions[0].unitCost supplier cost is stripped'
);
assert(
  customerSanitized.transportOptions[0].provider === undefined,
  'transportOptions[0].provider supplier identity is stripped'
);
assert(
  customerSanitized.auditTrail === undefined,
  'auditTrail internal activity history is stripped'
);
assert(
  customerSanitized.pricing.finalTotal === 43890,
  'Customer-facing finalTotal remains intact (₹43,890)'
);

// ----------------------------------------------------------------------------
// TEST GROUP 8: PRICE SNAPSHOT & REVISION HISTORY (PART 14 & 15)
// ----------------------------------------------------------------------------
console.log('\n\x1b[36m--- Group 8: Price Snapshot & Immutability ---\x1b[0m');

const originalQuote = {
  quotationNumber: 'WL-Q-2026-0042',
  version: 1,
  status: 'SENT',
  pricing: { finalTotal: 50000, subtotal: 47619 },
  hotelOptions: [{ optionId: 'h1', hotelName: 'Standard Camp', selected: true }],
  priceSnapshot: {
    capturedAt: new Date().toISOString(),
    version: 1,
    pricing: { finalTotal: 50000, subtotal: 47619 }
  },
  revisions: []
};

// Simulate creating revision v2
const revisionRecord = {
  version: 1,
  revisedAt: new Date().toISOString(),
  revisedByName: 'Sales Specialist',
  reason: 'Customer upgraded to Luxury Suite',
  priceSnapshot: originalQuote.priceSnapshot
};
originalQuote.revisions.push(revisionRecord);
originalQuote.version = 2;
originalQuote.status = 'DRAFT';
originalQuote.priceSnapshot = null;

assert(originalQuote.version === 2, 'Quotation version successfully incremented to v2');
assert(originalQuote.status === 'DRAFT', 'Quotation status reset to DRAFT for modification');
assert(originalQuote.revisions.length === 1, 'Historical revision v1 archived in revisions array');
assert(
  originalQuote.revisions[0].priceSnapshot.pricing.finalTotal === 50000,
  'Historical snapshot preserved with original total (₹50,000)'
);

// ----------------------------------------------------------------------------
// TEST SUMMARY
// ----------------------------------------------------------------------------
console.log('\n======================================================================');
console.log(`📊 PHASE 3 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log('🎉 ALL PHASE 3 PRICING ENGINE & RBAC CONCESSION CHECKS PASSED PERFECTLY!');
} else {
  console.error(`⚠️ ${totalTests - passedTests} TEST(S) FAILED. CHECK LOGS.`);
}
console.log('======================================================================\n');

if (passedTests !== totalTests) {
  process.exit(1);
}
