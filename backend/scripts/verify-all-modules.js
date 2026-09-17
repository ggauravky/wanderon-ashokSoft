import express from 'express';
import jwt from 'jsonwebtoken';

// Import all routes
import authRoutes from '../routes/authRoutes.js';
import adminRoutes from '../routes/adminRoutes.js';
import tripRoutes from '../routes/tripRoutes.js';
import leadRoutes from '../routes/leadRoutes.js';
import quotationRoutes from '../routes/quotationRoutes.js';
import pricingRuleRoutes from '../routes/pricingRuleRoutes.js';
import followUpRoutes from '../routes/followUpRoutes.js';
import marketingRoutes from '../routes/marketingRoutes.js';
import salesRoutes from '../routes/salesRoutes.js';
import bookingRoutes from '../routes/bookingRoutes.js';

// Setup isolated express app for testing
const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/trips', tripRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/quotations', quotationRoutes);
app.use('/api/pricing-rules', pricingRuleRoutes);
app.use('/api/follow-ups', followUpRoutes);
app.use('/api/marketing', marketingRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/bookings', bookingRoutes);

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) throw new Error('JWT_SECRET is required.');

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

const requiredUserId = (name) => {
  const value = process.env[name];
  if (!value || !/^[a-f\d]{24}$/i.test(value)) throw new Error(`${name} must be a real MongoDB User ObjectId.`);
  return value;
};

// Authorization still resolves each current database user; role claims are intentionally absent.
const superAdminToken = generateToken({ userId: requiredUserId('TEST_SUPER_ADMIN_USER_ID') });
const operationsToken = generateToken({ userId: requiredUserId('TEST_OPERATIONS_USER_ID') });
const salesToken = generateToken({ userId: requiredUserId('TEST_SALES_USER_ID') });
const marketingToken = generateToken({ userId: requiredUserId('TEST_MARKETING_USER_ID') });
const userToken = generateToken({ userId: requiredUserId('TEST_CUSTOMER_USER_ID') });

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

async function runTests() {
  const testServer = await new Promise((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  const port = testServer.address().port;
  const BASE_URL = `http://127.0.0.1:${port}`;

  const makeReq = async (endpoint, options = {}) => {
    const url = `${BASE_URL}${endpoint}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    return { status: res.status, data };
  };

  console.log('\n======================================================');
  console.log(`🚀 RUNNING COMPREHENSIVE TRAVEL TECH BACKEND TEST SUITE on port ${port}`);
  console.log('======================================================\n');

  try {
    // ----------------------------------------------------
    // TEST SUITE 1: RBAC & ACTION-BASED PERMISSIONS
    // ----------------------------------------------------
    console.log('--- 1. Testing RBAC & Action Permissions ---');
    
    // Marketing cannot manage pricing rules (should be 403)
    const mktPricingRule = await makeReq('/api/pricing-rules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${marketingToken}` },
      body: JSON.stringify({ name: 'Test Rule', code: 'TEST_RULE_1', ruleType: 'markup', value: 10 })
    });
    assert(mktPricingRule.status === 403, 'Marketing role blocked from creating pricing rules (403)');

    // Sales cannot manage marketing campaigns (should be 403)
    const salesCampaign = await makeReq('/api/marketing/campaigns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({ name: 'Test Campaign', code: 'TEST_CAMP_1' })
    });
    assert(salesCampaign.status === 403, 'Sales role blocked from creating marketing campaigns (403)');

    // Super Admin can create pricing rules (should be 201)
    const adminPricingRule = await makeReq('/api/pricing-rules', {
      method: 'POST',
      headers: { Authorization: `Bearer ${superAdminToken}` },
      body: JSON.stringify({
        name: 'Monsoon Green Discount',
        code: 'MONSOON_GREEN_10',
        ruleType: 'discount',
        destination: 'Meghalaya',
        calculationType: 'percentage',
        value: 10
      })
    });
    assert(adminPricingRule.status === 201 && adminPricingRule.data.success, 'Super Admin can create pricing rules');

    // ----------------------------------------------------
    // TEST SUITE 2: DYNAMIC PRICING RULES ENGINE
    // ----------------------------------------------------
    console.log('\n--- 2. Testing Dynamic Pricing Rules Engine ---');

    // List pricing rules
    const listRules = await makeReq('/api/pricing-rules', {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    assert(listRules.status === 200 && Array.isArray(listRules.data.rules), 'Sales can view pricing rules');

    // Evaluate dynamic pricing rules
    const evalRule = await makeReq('/api/pricing-rules/evaluate', {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        destination: 'Spiti Valley',
        baseAmount: 20000,
        travelersCount: 2
      })
    });
    assert(evalRule.status === 200 && evalRule.data.success && evalRule.data.adjustedTotal >= 20000, 'Dynamic pricing rules evaluated successfully');

    // ----------------------------------------------------
    // TEST SUITE 3: CRM SALES FOLLOW-UPS MODULE
    // ----------------------------------------------------
    console.log('\n--- 3. Testing CRM Sales Follow-ups Module ---');

    // Schedule a follow-up
    const createFU = await makeReq('/api/follow-ups', {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        leadId: 'lead_1',
        title: 'Discuss custom 4x4 vehicle upgrade for Spiti',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        callWindow: 'Morning',
        priority: 'high'
      })
    });
    assert(createFU.status === 201 && createFU.data.success, 'Sales rep scheduled a CRM follow-up');
    const createdFuId = createFU.data.followUp?._id;

    // Mark follow-up completed
    if (createdFuId) {
      const completeFU = await makeReq(`/api/follow-ups/${createdFuId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${salesToken}` },
        body: JSON.stringify({
          outcomeNotes: 'Client confirmed 4 travelers, requested revised proposal.'
        })
      });
      assert(completeFU.status === 200 && completeFU.data.followUp?.status === 'completed', 'Marked follow-up completed with outcome notes');
    }

    // ----------------------------------------------------
    // TEST SUITE 4: MARKETING MODULE (CAMPAIGNS & BANNERS)
    // ----------------------------------------------------
    console.log('\n--- 4. Testing Marketing Module ---');

    // Marketing Dashboard
    const mktDash = await makeReq('/api/marketing/dashboard', {
      headers: { Authorization: `Bearer ${marketingToken}` }
    });
    assert(mktDash.status === 200 && mktDash.data.success && mktDash.data.dashboard.totalCampaigns >= 2, 'Marketing dashboard generated metrics');

    // Create Campaign
    const createCamp = await makeReq('/api/marketing/campaigns', {
      method: 'POST',
      headers: { Authorization: `Bearer ${marketingToken}` },
      body: JSON.stringify({
        name: 'Winter Spiti White Odyssey',
        code: 'WINTER_SPITI_26',
        type: 'meta_ads',
        status: 'active',
        budget: 60000
      })
    });
    assert(createCamp.status === 201 && createCamp.data.success, 'Marketing created a new campaign');

    // Public active banners
    const publicBanners = await makeReq('/api/marketing/banners/active');
    assert(publicBanners.status === 200 && Array.isArray(publicBanners.data.banners), 'Public website can retrieve active banners');

    // ----------------------------------------------------
    // TEST SUITE 5: SALES DASHBOARD & ADMIN REPORTS
    // ----------------------------------------------------
    console.log('\n--- 5. Testing Sales Dashboard & Admin Reports ---');

    // Sales Dashboard
    const salesDash = await makeReq('/api/sales/dashboard', {
      headers: { Authorization: `Bearer ${salesToken}` }
    });
    assert(salesDash.status === 200 && salesDash.data.success && salesDash.data.metrics.totalQuotations >= 0, 'Sales Rep Dashboard metrics computed');

    // Admin Revenue Report
    const revReport = await makeReq('/api/admin/reports/revenue', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(revReport.status === 200 && revReport.data.report.totalRevenue > 0, 'Admin Revenue Report generated');

    // Admin Departure Occupancy Report
    const occReport = await makeReq('/api/admin/reports/departures', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(occReport.status === 200 && occReport.data.report.totalCapacity > 0, 'Admin Fixed Departure Occupancy Report generated');

    // Admin Lead Funnel Report
    const funnelReport = await makeReq('/api/admin/reports/lead-funnel', {
      headers: { Authorization: `Bearer ${superAdminToken}` }
    });
    assert(funnelReport.status === 200 && funnelReport.data.funnel.stages.length === 6, 'Admin 6-Stage Lead Funnel Report generated');

    // ----------------------------------------------------
    // TEST SUITE 6: QUOTATION WORKFLOW & CONVERSIONS
    // ----------------------------------------------------
    console.log('\n--- 6. Testing Quotation Builder Workflow ---');

    // Preview Pricing
    const quotePreview = await makeReq('/api/quotations/calculate-preview', {
      method: 'POST',
      headers: { Authorization: `Bearer ${salesToken}` },
      body: JSON.stringify({
        tripRequirements: {
          title: 'Custom Spiti 6D Roadtrip',
          destination: 'Spiti Valley',
          adults: 2,
          nights: 5
        },
        pricing: {
          customerBasePrice: 15000,
          markupPercent: 10
        }
      })
    });
    assert(quotePreview.status === 200 && quotePreview.data.pricing.finalTotal > 0, 'Quotation pricing preview calculated with GST and markup');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  } finally {
    testServer.close();
    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('======================================================\n');
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
