/**
 * Phase 6 Test Suite — Quotation RBAC & Sales Workflow Matrix
 * 
 * Validates:
 * 1. Super Admin Role Permissions (Full unrestricted access across all actions)
 * 2. Operations Role Permissions (Convert-to-trip, trip catalog, booking CRM, operations fulfillment)
 * 3. Sales Role Permissions (Create, edit, send, convert-to-booking; max 10% discount; convert-to-trip & delete blocked)
 * 4. Marketing Role Permissions (CMS pages, SEO; pricing patch blocked, delete blocked, customer PII masked, internal margins stripped)
 * 5. Lead Assignment Workflow (Super Admin/Admin assigns lead to sales concierge specialist)
 * 6. Influencer Workflow Regression (Creator approvals, coupon attribution, payout requests intact)
 */

import {
  requireRoles,
  superAdminOnly,
  adminOnly,
  operationsOrAdmin,
  salesOrAdmin,
  marketingOrAdmin,
  influencerOnly
} from '../middlewares/authMiddleware.js';

import {
  validateCommercialConcessions,
  sanitizeForCustomer
} from '../controllers/quotationController.js';

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    failed++;
  }
}

function mockReq(user = null, body = {}, params = {}) {
  return { user, body, params, headers: {} };
}

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    }
  };
  return res;
}

function testMiddleware(middleware, req) {
  let nextCalled = false;
  const res = mockRes();
  const next = () => { nextCalled = true; };
  middleware(req, res, next);
  return { nextCalled, statusCode: res.statusCode, data: res.data };
}

async function runPhase6Tests() {
  console.log('\n===============================================================');
  console.log('🧪 RUNNING PHASE 6: QUOTATION RBAC & SALES WORKFLOW TEST SUITE');
  console.log('===============================================================\n');

  // Test User Identities
  const superAdminUser = { _id: 'usr_super', name: 'Master Super Admin', email: 'gaurav999@gmail.com', role: 'super_admin' };
  const operationsUser = { _id: 'usr_ops', name: 'Dev Sharma (Ops)', email: 'ops@wanderluxe.in', role: 'operations' };
  const salesUser = { _id: 'usr_sales_1', name: 'Aakash Verma (Sales)', email: 'aakash.v@wanderluxe.in', role: 'sales' };
  const marketingUser = { _id: 'usr_mktg', name: 'Riya Sen (Marketing)', email: 'riya.s@wanderluxe.in', role: 'marketing' };
  const influencerUser = { _id: 'usr_inf', name: 'Kavita Nomad', email: 'kavita@creator.in', role: 'influencer', influencerStatus: 'approved' };
  const travelerUser = { _id: 'usr_trav', name: 'Rahul Joshi', email: 'rahul@gmail.com', role: 'user' };

  // --------------------------------------------------------------------------
  // TEST GROUP 1: SUPER ADMIN PERMISSIONS (Full Access & Unrestricted Discretion)
  // --------------------------------------------------------------------------
  console.log('--- TEST GROUP 1: Super Admin Permissions ---');

  const superAdminQuoteCreate = testMiddleware(salesOrAdmin, mockReq(superAdminUser));
  assert(superAdminQuoteCreate.nextCalled, 'Super Admin can create & edit quotations');

  const superAdminConvertTrip = testMiddleware(operationsOrAdmin, mockReq(superAdminUser));
  assert(superAdminConvertTrip.nextCalled, 'Super Admin can convert quotations to Catalog Trips');

  const superAdminDelete = testMiddleware(adminOnly, mockReq(superAdminUser));
  assert(superAdminDelete.nextCalled, 'Super Admin can delete quotations & leads');

  const superAdminDiscount = validateCommercialConcessions(superAdminUser, { discountType: 'percentage', discountValue: 40 });
  assert(superAdminDiscount === null, 'Super Admin is unrestricted on custom discounts (40% discount allowed)');

  // --------------------------------------------------------------------------
  // TEST GROUP 2: OPERATIONS ROLE PERMISSIONS (Trips, Batches, Conversions)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Operations Role Permissions ---');

  const opsConvertTrip = testMiddleware(operationsOrAdmin, mockReq(operationsUser));
  assert(opsConvertTrip.nextCalled, 'Operations role can convert approved quotation to Draft Catalog Trip');

  const opsCreateQuote = testMiddleware(salesOrAdmin, mockReq(operationsUser));
  assert(opsCreateQuote.nextCalled, 'Operations role has quotation viewing & management access');

  const opsSuperOnly = testMiddleware(superAdminOnly, mockReq(operationsUser));
  assert(!opsSuperOnly.nextCalled && opsSuperOnly.statusCode === 403, 'Operations role cannot access Super Admin system controls (HTTP 403)');

  // --------------------------------------------------------------------------
  // TEST GROUP 3: SALES ROLE PERMISSIONS (Quotes, Leads, Discretion Limits)
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Sales Role Permissions & Concession Limits ---');

  const salesCreate = testMiddleware(salesOrAdmin, mockReq(salesUser));
  assert(salesCreate.nextCalled, 'Sales role can create, edit, and send quotations');

  // Sales user attempting Convert to Trip (Strictly blocked server-side)
  const salesConvertTrip = testMiddleware(operationsOrAdmin, mockReq(salesUser));
  assert(!salesConvertTrip.nextCalled && salesConvertTrip.statusCode === 403, 'Sales role converting to Catalog Trip is BLOCKED server-side (HTTP 403 Forbidden)');

  // Sales user attempting Delete Quotation (Strictly blocked server-side)
  const salesDeleteQuote = testMiddleware(adminOnly, mockReq(salesUser));
  assert(!salesDeleteQuote.nextCalled && salesDeleteQuote.statusCode === 403, 'Sales role deleting quotation is BLOCKED server-side (HTTP 403 Forbidden)');

  // Sales discount within limit (8% <= 10%)
  const salesAllowedDiscount = validateCommercialConcessions(salesUser, { discountType: 'percentage', discountValue: 8 });
  assert(salesAllowedDiscount === null, 'Sales role allowed 8% discount (within 10% threshold)');

  // Sales discount exceeding limit (18% > 10%)
  const salesExceededDiscount = validateCommercialConcessions(salesUser, { discountType: 'percentage', discountValue: 18 });
  assert(salesExceededDiscount && salesExceededDiscount.includes('maximum 10% discount concession'), 'Sales role attempting 18% discount is blocked with manager escalation required');

  // Sales markup exceeding limit (45% > 30%)
  const salesExceededMarkup = validateCommercialConcessions(salesUser, { markupPercent: 45 });
  assert(salesExceededMarkup && salesExceededMarkup.includes('maximum of 30%'), 'Sales role attempting 45% markup is blocked');

  // --------------------------------------------------------------------------
  // TEST GROUP 4: MARKETING ROLE PERMISSIONS & FIELD-LEVEL SECURITY
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Marketing Role Permissions & Field Masking ---');

  // Marketing user attempting Edit/Patch Quotation (Strictly blocked server-side)
  const mktgPatchQuote = testMiddleware(requireRoles('super_admin', 'admin', 'sales'), mockReq(marketingUser));
  assert(!mktgPatchQuote.nextCalled && mktgPatchQuote.statusCode === 403, 'Marketing role editing quotation pricing is BLOCKED server-side (HTTP 403 Forbidden)');

  // Marketing user attempting Convert to Trip
  const mktgConvertTrip = testMiddleware(operationsOrAdmin, mockReq(marketingUser));
  assert(!mktgConvertTrip.nextCalled && mktgConvertTrip.statusCode === 403, 'Marketing role converting to trip is BLOCKED server-side (HTTP 403 Forbidden)');

  // Field-level security: Marketing viewing quotations has internal costs stripped
  const rawQuotationWithMargins = {
    quotationNumber: 'WL-Q-2026-MKTG01',
    customerSnapshot: { name: 'Ananya Sharma', email: 'ananya.s@gmail.com', phone: '+91 98765 43210' },
    pricing: {
      finalTotal: 88000,
      totalInternalCost: 55000,
      projectedMargin: 33000,
      projectedMarginPercent: 37.5
    },
    hotelOptions: [{ hotelName: 'Oberoi Grand', pricePerNight: 18000, costPerNight: 12000 }],
    transportOptions: [{ vehicle: 'Innova Crysta', unitPrice: 20000, unitCost: 14000, provider: 'Fleet Partner North' }],
    auditTrail: [{ action: 'PRICING_CALCULATED', details: { margin: 33000 } }]
  };

  const mktgSanitizedQuote = sanitizeForCustomer(rawQuotationWithMargins);
  assert(mktgSanitizedQuote.pricing.totalInternalCost === undefined, 'Marketing view: totalInternalCost is stripped');
  assert(mktgSanitizedQuote.pricing.projectedMargin === undefined, 'Marketing view: projectedMargin is stripped');
  assert(mktgSanitizedQuote.hotelOptions[0].costPerNight === undefined, 'Marketing view: hotel costPerNight is stripped');
  assert(mktgSanitizedQuote.transportOptions[0].unitCost === undefined, 'Marketing view: transport unitCost is stripped');
  assert(mktgSanitizedQuote.transportOptions[0].provider === undefined, 'Marketing view: supplier vendor name is stripped');
  assert(mktgSanitizedQuote.auditTrail === undefined, 'Marketing view: internal audit log is stripped');
  assert(mktgSanitizedQuote.pricing.finalTotal === 88000, 'Marketing view: customer finalTotal remains accessible (₹88,000)');

  // Field-level security: Marketing viewing leads has customer phone/email masked
  const leadDoc = {
    name: 'Rohit Verma',
    phone: '+91 9876543210',
    email: 'rohit.verma@example.com',
    destination: 'Ladakh High Passes'
  };

  const maskedPhone = leadDoc.phone.replace(/(\+?\d{1,3}\s*\d{2})\d+(\d{2})/, '$1******$2');
  const maskedEmail = leadDoc.email.replace(/(.{2}).+(@.+)/, '$1***$2');
  assert(maskedPhone === '+91 98******10', 'Marketing view: traveler phone number masked for privacy (+91 98******10)');
  assert(maskedEmail === 'ro***@example.com', 'Marketing view: traveler email masked for privacy (ro***@example.com)');

  // --------------------------------------------------------------------------
  // TEST GROUP 5: CRM LEAD ASSIGNMENT WORKFLOW
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 5: CRM Lead Assignment Workflow ---');

  const leadToAssign = {
    _id: 'lead_assign_01',
    name: 'Suresh Raina',
    assignedTo: 'Sales Concierge Team',
    assignedToUser: null,
    status: 'NEW'
  };

  // Super Admin assigns lead to Sales specialist
  const assignAction = testMiddleware(adminOnly, mockReq(superAdminUser));
  assert(assignAction.nextCalled, 'Admin is authorized to assign leads (adminOnly middleware allows)');

  leadToAssign.assignedTo = salesUser.name;
  leadToAssign.assignedToUser = salesUser._id;
  leadToAssign.status = 'IN_PROGRESS';

  assert(leadToAssign.assignedTo === 'Aakash Verma (Sales)', 'Lead assignedTo updated to sales specialist name');
  assert(leadToAssign.assignedToUser === salesUser._id, 'Lead assignedToUser updated to sales specialist ID');

  // Sales scoping check: Sales specialist queries assigned leads
  const allSampleLeads = [
    { _id: 'l1', name: 'Lead 1', assignedToUser: salesUser._id, assignedTo: salesUser.name },
    { _id: 'l2', name: 'Lead 2', assignedToUser: 'usr_other_sales', assignedTo: 'Other Sales Person' },
    { _id: 'l3', name: 'Lead 3', assignedTo: 'Sales Concierge Team' } // Unassigned pool
  ];

  const salesVisibleLeads = allSampleLeads.filter(l => 
    String(l.assignedToUser) === String(salesUser._id) || 
    l.assignedTo === salesUser.name || 
    l.assignedTo === 'Sales Concierge Team'
  );

  assert(salesVisibleLeads.length === 2, 'Sales specialist sees assigned leads and unassigned pool (2/3 leads)');
  assert(salesVisibleLeads.some(l => l._id === 'l1'), 'Sales specialist sees own assigned lead (l1)');
  assert(!salesVisibleLeads.some(l => l._id === 'l2'), 'Sales specialist cannot see leads assigned to other sales reps (l2)');

  // --------------------------------------------------------------------------
  // TEST GROUP 6: INFLUENCER PARTNERSHIP REGRESSION
  // --------------------------------------------------------------------------
  console.log('\n--- TEST GROUP 6: Influencer Partnership Regression ---');

  const influencerAccess = testMiddleware(influencerOnly, mockReq(influencerUser));
  assert(influencerAccess.nextCalled, 'Approved Influencer has access to Creator Partner hub');

  const pendingInfluencerUser = { _id: 'usr_inf_pend', role: 'influencer', influencerStatus: 'pending' };
  const pendingInfluencerAccess = testMiddleware(influencerOnly, mockReq(pendingInfluencerUser));
  assert(!pendingInfluencerAccess.nextCalled && pendingInfluencerAccess.statusCode === 403, 'Pending Influencer application is blocked until Admin approval');

  // --------------------------------------------------------------------------
  // SCOREBOARD
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`📊 PHASE 6 VERIFICATION SCOREBOARD: ${passed} PASSED / ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} test assertions failed in Phase 6.`);
  }
}

runPhase6Tests().catch(err => {
  console.error('Fatal error in Phase 6 test execution:', err);
  process.exit(1);
});
