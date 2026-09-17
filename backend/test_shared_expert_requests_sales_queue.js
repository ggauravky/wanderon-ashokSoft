import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Lead from './models/Lead.js';
import { seedSalesUsers } from './scripts/seedSalesUsers.js';

const API_BASE = 'http://127.0.0.1:5000/api';
const SALES_1_EMAIL = process.env.SALES_1_EMAIL;
const SALES_1_PASSWORD = process.env.SALES_1_PASSWORD;
const SALES_2_EMAIL = process.env.SALES_2_EMAIL;
const SALES_2_PASSWORD = process.env.SALES_2_PASSWORD;
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (![SALES_1_EMAIL, SALES_1_PASSWORD, SALES_2_EMAIL, SALES_2_PASSWORD, ADMIN_EMAIL, ADMIN_PASSWORD].every(Boolean)) {
  throw new Error('Sales and admin test credentials must be supplied through environment variables.');
}

let passCount = 0;
let failCount = 0;
const results = [];

function assert(condition, testName, details = '') {
  if (condition) {
    passCount++;
    console.log(`  ✓ PASS: ${testName}`);
    results.push({ name: testName, status: 'PASS', details });
  } else {
    failCount++;
    console.error(`  ✗ FAIL: ${testName} ${details ? '(' + details + ')' : ''}`);
    results.push({ name: testName, status: 'FAIL', details });
  }
}

async function runTestSuite() {
  console.log('\n=============================================================================');
  console.log('🧪 WANDERLUXE — SHARED EXPERT REQUESTS SALES QUEUE AUTOMATED TEST SUITE');
  console.log('=============================================================================\n');

  await connectDB();

  // 0. Seed sales users
  console.log('--- STEP 0: ENSURE SALES USERS ARE SEEDED ---');
  await seedSalesUsers();

  const sales1User = await User.findOne({ email: SALES_1_EMAIL });
  const sales2User = await User.findOne({ email: SALES_2_EMAIL });
  let adminUser = await User.findOne({ email: ADMIN_EMAIL });
  if (!adminUser) {
    adminUser = await User.findOne({ role: { $in: ['admin', 'super_admin'] } });
  }

  assert(!!sales1User, 'Sales Specialist 1 exists in DB');
  assert(!!sales2User, 'Sales Specialist 2 exists in DB');
  assert(!!adminUser, 'Admin user exists in DB');

  // 1. Authenticate Sales 1
  console.log('\n--- STEP 1: AUTHENTICATION & ROLE-BASED REDIRECTION ---');
  const s1LoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SALES_1_EMAIL, password: SALES_1_PASSWORD })
  });
  const s1Auth = await s1LoginRes.json();
  const s1Destination = s1Auth.role === 'sales' ? '/staff/sales' : '/admin';
  assert(s1LoginRes.status === 200, 'Sales 1 login returns 200 OK');
  assert(s1Auth.role === 'sales', 'Sales 1 returned role is strictly "sales"');
  assert(s1Destination === '/staff/sales', 'Sales 1 client destination route maps to "/staff/sales"');
  assert(!!s1Auth.token, 'Sales 1 received JWT token');
  const s1Token = s1Auth.token;

  // 2. Authenticate Sales 2
  const s2LoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: SALES_2_EMAIL, password: SALES_2_PASSWORD })
  });
  const s2Auth = await s2LoginRes.json();
  const s2Destination = s2Auth.role === 'sales' ? '/staff/sales' : '/admin';
  assert(s2LoginRes.status === 200, 'Sales 2 login returns 200 OK');
  assert(s2Auth.role === 'sales', 'Sales 2 returned role is strictly "sales"');
  assert(s2Destination === '/staff/sales', 'Sales 2 client destination route maps to "/staff/sales"');
  assert(!!s2Auth.token, 'Sales 2 received JWT token');
  const s2Token = s2Auth.token;

  // 3. Authenticate Admin
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const adminAuth = await adminLoginRes.json();
  const adminDestination = adminAuth.role === 'sales' ? '/staff/sales' : '/admin';
  assert(adminLoginRes.status === 200, 'Admin login returns 200 OK');
  assert(['admin', 'super_admin'].includes(adminAuth.role), 'Admin returned role is admin/super_admin');
  assert(adminDestination === '/admin', 'Admin client destination route maps to "/admin"');
  const adminToken = adminAuth.token;

  // Setup test leads in DB
  console.log('\n--- STEP 2: FIXTURE SETUP (SHARED QUEUE LEADS) ---');
  // Clean up any previous test leads
  await Lead.deleteMany({ email: { $in: ['traveler_test_shared1@wanderluxe.test', 'traveler_test_shared2@wanderluxe.test', 'traveler_test_custom@wanderluxe.test'] } });

  // Lead 1: Unassigned callback request
  const testLead1 = await Lead.create({
    name: 'Shared Traveler Alpha',
    email: 'traveler_test_shared1@wanderluxe.test',
    phone: '+919876543210',
    leadType: 'callback_request',
    source: 'callback_request',
    destination: 'Ladakh High Passes',
    tripTitle: 'Ladakh High Passes Luxury Circuit',
    preferredCallDate: new Date().toISOString().split('T')[0],
    preferredCallWindow: 'Morning',
    status: 'NEW',
    priority: 'HIGH',
    assignedTo: 'Sales Concierge Team'
  });

  // Lead 2: Legacy assigned callback request (previously assigned to Sales 2)
  const testLead2 = await Lead.create({
    name: 'Shared Traveler Beta',
    email: 'traveler_test_shared2@wanderluxe.test',
    phone: '+919876543211',
    leadType: 'callback_request',
    source: 'callback_request',
    destination: 'Kashmir Winter Valleys',
    tripTitle: 'Kashmir Winter Valleys Luxury Chalets',
    preferredCallDate: new Date().toISOString().split('T')[0],
    preferredCallWindow: 'Evening',
    status: 'CONTACTED',
    priority: 'URGENT',
    assignedTo: sales2User.name,
    assignedToUser: sales2User._id,
    assignedToUserName: sales2User.name
  });

  // Lead 3: Non-callback lead (trip_enquiry) for scoping & CRM backward compat tests
  const testLead3 = await Lead.create({
    name: 'General Inquiry Gamma',
    email: 'traveler_test_custom@wanderluxe.test',
    phone: '+919876543212',
    leadType: 'trip_enquiry',
    source: 'trip_page',
    destination: 'Spiti Valley',
    tripTitle: 'Spiti Valley 4x4 Expedition',
    status: 'NEW',
    priority: 'MEDIUM',
    assignedTo: 'Sales Concierge Team'
  });

  assert(!!testLead1._id, 'Fixture callback lead 1 created (unassigned)');
  assert(!!testLead2._id, 'Fixture callback lead 2 created (legacy assigned to Sales 2)');
  assert(!!testLead3._id, 'Fixture non-callback lead 3 created (custom_inquiry)');

  // 4. Sales 1 queries Shared Queue: sees both testLead1 AND legacy testLead2
  console.log('\n--- STEP 3: SHARED SALES QUEUE VISIBILITY ---');
  const s1QueueRes = await fetch(`${API_BASE}/leads?leadType=callback_request`, {
    headers: { Authorization: `Bearer ${s1Token}` }
  });
  const s1Queue = await s1QueueRes.json();
  const s1Items = Array.isArray(s1Queue) ? s1Queue : (s1Queue.items || s1Queue.leads || []);

  const s1SeesLead1 = s1Items.some(l => String(l._id) === String(testLead1._id));
  const s1SeesLead2 = s1Items.some(l => String(l._id) === String(testLead2._id));
  assert(s1QueueRes.status === 200, 'Sales 1 queue query returns 200 OK');
  assert(s1SeesLead1, 'Sales 1 sees unassigned callback request (Lead 1)');
  assert(s1SeesLead2, 'Sales 1 sees legacy assigned callback request (Lead 2, assigned to Sales 2)');

  // 5. Sales 2 queries Shared Queue: sees identical items
  const s2QueueRes = await fetch(`${API_BASE}/leads?leadType=callback_request`, {
    headers: { Authorization: `Bearer ${s2Token}` }
  });
  const s2Queue = await s2QueueRes.json();
  const s2Items = Array.isArray(s2Queue) ? s2Queue : (s2Queue.items || s2Queue.leads || []);

  const s2SeesLead1 = s2Items.some(l => String(l._id) === String(testLead1._id));
  const s2SeesLead2 = s2Items.some(l => String(l._id) === String(testLead2._id));
  assert(s2QueueRes.status === 200, 'Sales 2 queue query returns 200 OK');
  assert(s2SeesLead1, 'Sales 2 sees unassigned callback request (Lead 1)');
  assert(s2SeesLead2, 'Sales 2 sees callback request (Lead 2)');
  assert(s1Items.length === s2Items.length, `Shared queue count parity (Sales 1: ${s1Items.length}, Sales 2: ${s2Items.length})`);

  // 6. Scoping: Sales role attempting to query non-callback leads is forced to callback_request
  console.log('\n--- STEP 4: SALES ROLE SERVER-SIDE SCOPING ---');
  const s1ScopedRes = await fetch(`${API_BASE}/leads?leadType=trip_enquiry`, {
    headers: { Authorization: `Bearer ${s1Token}` }
  });
  const s1ScopedData = await s1ScopedRes.json();
  const s1ScopedItems = Array.isArray(s1ScopedData) ? s1ScopedData : (s1ScopedData.items || s1ScopedData.leads || []);
  const s1SeesNonCallback = s1ScopedItems.some(l => String(l._id) === String(testLead3._id));
  assert(!s1SeesNonCallback, 'Sales role CANNOT see non-callback leads (server forces callback_request)');
  assert(s1ScopedItems.every(l => l.leadType === 'callback_request'), 'All returned leads for sales role are strictly leadType "callback_request"');

  // Scoping on getLeadById: Sales role blocked from accessing non-callback lead dossier
  const s1GetNonCallbackRes = await fetch(`${API_BASE}/leads/${testLead3._id}`, {
    headers: { Authorization: `Bearer ${s1Token}` }
  });
  assert(s1GetNonCallbackRes.status === 403, 'Sales role blocked with 403 Forbidden from accessing non-callback lead dossier');

  // 7. Contact Logging with Action Attribution
  console.log('\n--- STEP 5: CONTACT LOGGING & ACTION ATTRIBUTION ---');
  // Sales 1 logs contact outcome on Lead 1 (which was unassigned)
  const contactRes = await fetch(`${API_BASE}/leads/${testLead1._id}/log-contact`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${s1Token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      outcome: 'CONNECTED',
      channel: 'call',
      notes: 'Discussed luxury tented camp options and private chef in Ladakh.'
    })
  });
  const contactData = await contactRes.json();
  assert(contactRes.status === 200, 'Sales 1 successfully logged contact on shared Lead 1');
  assert(contactData.lead?.status === 'CONTACTED', 'Lead 1 status automatically transitioned to CONTACTED');

  const latestOutcome = contactData.lead?.callOutcomes?.[contactData.lead.callOutcomes.length - 1];
  assert(latestOutcome?.outcome === 'CONNECTED', 'Latest outcome is CONNECTED');
  assert(latestOutcome?.loggedByName === sales1User.name, `Action attribution loggedByName matches "${sales1User.name}"`);
  assert(String(latestOutcome?.loggedBy) === String(sales1User._id), 'Action attribution loggedBy matches Sales 1 user ID');

  // Sales 2 inspects Lead 1 dossier: sees Sales 1's logged activity
  const s2InspectLead1Res = await fetch(`${API_BASE}/leads/${testLead1._id}`, {
    headers: { Authorization: `Bearer ${s2Token}` }
  });
  const s2InspectLead1 = await s2InspectLead1Res.json();
  const s2SeenOutcomes = s2InspectLead1.lead?.callOutcomes || [];
  const s2SeesAttribution = s2SeenOutcomes.some(co => co.loggedByName === sales1User.name && co.outcome === 'CONNECTED');
  assert(s2InspectLead1Res.status === 200, 'Sales 2 successfully retrieved Lead 1 dossier');
  assert(s2SeesAttribution, 'Sales 2 sees Sales 1 attribution in interaction history');

  // 8. Shared Stage Update
  console.log('\n--- STEP 6: SHARED STAGE ADVANCEMENT ---');
  // Sales 2 qualifies Lead 1 without needing claiming or ownership
  const statusUpdateRes = await fetch(`${API_BASE}/leads/${testLead1._id}/status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${s2Token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status: 'QUALIFIED' })
  });
  const statusUpdateData = await statusUpdateRes.json();
  assert(statusUpdateRes.status === 200, 'Sales 2 successfully updated Lead 1 status to QUALIFIED without ownership barrier');
  assert(statusUpdateData.lead?.status === 'QUALIFIED', 'Lead 1 is now QUALIFIED');

  // 9. Rejection of Claiming on Expert Requests
  console.log('\n--- STEP 7: REJECTION OF CLAIMING ON EXPERT REQUESTS ---');
  const claimRes = await fetch(`${API_BASE}/leads/${testLead1._id}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${s1Token}` }
  });
  const claimData = await claimRes.json();
  assert(claimRes.status === 400, 'Direct claim on callback_request returns 400 Bad Request');
  assert(claimData.message?.includes('shared Sales queue and cannot be claimed'), 'Claim rejection message explains shared queue architecture');

  // 10. Rejection of Assignment on Expert Requests
  console.log('\n--- STEP 8: REJECTION OF ASSIGNMENT ON EXPERT REQUESTS ---');
  const assignRes = await fetch(`${API_BASE}/leads/${testLead1._id}/assign`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignedToUserId: sales1User._id,
      assignedToName: sales1User.name
    })
  });
  const assignData = await assignRes.json();
  assert(assignRes.status === 400, 'Direct assign on callback_request returns 400 Bad Request');
  assert(assignData.message?.includes('shared Sales queue and cannot be assigned'), 'Assign rejection message explains shared queue architecture');

  // 11. Preservation of Assignment for General CRM Leads (Option B)
  console.log('\n--- STEP 9: PRESERVATION OF GENERAL CRM ASSIGNMENT (OPTION B) ---');
  const generalAssignRes = await fetch(`${API_BASE}/leads/${testLead3._id}/assign`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      assignedToUserId: sales1User._id,
      assignedToName: sales1User.name
    })
  });
  const generalAssignData = await generalAssignRes.json();
  assert(generalAssignRes.status === 200, 'General non-callback lead can still be assigned by Admin (no regression on general CRM)');
  const assignedUserId = generalAssignData.lead?.assignedToUser?._id || generalAssignData.lead?.assignedToUser;
  assert(String(assignedUserId) === String(sales1User._id), 'General lead assignedToUser correctly updated');

  // 12. Shared Sales Dashboard KPIs
  console.log('\n--- STEP 10: UNIFIED SHARED SALES DASHBOARD KPIS ---');
  const s1DashRes = await fetch(`${API_BASE}/sales/dashboard`, {
    headers: { Authorization: `Bearer ${s1Token}` }
  });
  const s1Dash = await s1DashRes.json();

  const s2DashRes = await fetch(`${API_BASE}/sales/dashboard`, {
    headers: { Authorization: `Bearer ${s2Token}` }
  });
  const s2Dash = await s2DashRes.json();

  assert(s1DashRes.status === 200, 'Sales 1 dashboard query returns 200 OK');
  assert(s2DashRes.status === 200, 'Sales 2 dashboard query returns 200 OK');
  assert(s1Dash.totalExpertRequests === s2Dash.totalExpertRequests, 'Total expert requests metric is identical for Sales 1 & Sales 2');
  assert(s1Dash.newRequests === s2Dash.newRequests, 'New inquiries metric is identical for Sales 1 & Sales 2');
  assert(s1Dash.dueTodayCount === s2Dash.dueTodayCount, 'Due today metric is identical for Sales 1 & Sales 2');

  // Cleanup test fixtures
  await Lead.deleteMany({ email: { $in: ['traveler_test_shared1@wanderluxe.test', 'traveler_test_shared2@wanderluxe.test', 'traveler_test_custom@wanderluxe.test'] } });

  console.log('\n=============================================================================');
  console.log(`🏁 TEST RESULTS: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('=============================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
