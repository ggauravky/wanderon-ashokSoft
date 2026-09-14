import 'dotenv/config';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';
import Lead from './models/Lead.js';
import { seedSalesUsers } from './scripts/seedSalesUsers.js';

const API_BASE = 'http://localhost:5000/api';

// Test runner helper
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
  console.log('\n===============================================================');
  console.log('🧪 WANDERLUXE — DEDICATED SALES PORTAL & AUTH TEST SUITE');
  console.log('===============================================================\n');

  await connectDB();

  // ---------------------------------------------------------------------------
  // 1. SEED & ACCOUNT VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('--- SECTION 1: ACCOUNT SEEDING & PASSWORD HASHING ---');
  
  const seedResult = await seedSalesUsers();
  assert(seedResult.success === true, 'Seed script executes successfully');

  // Second run for idempotency
  const idempotentResult = await seedSalesUsers();
  assert(
    idempotentResult.results.every(r => r.status === 'already_exists'),
    'Seed script is idempotent (reports already_exists on re-run without duplication)'
  );

  const sales1Doc = await User.findOne({ email: 'ashoksoftsales1@gmail.com' });
  const sales2Doc = await User.findOne({ email: 'ashoksoftsales2@gmail.com' });

  assert(!!sales1Doc, 'Sales 1 Mongo user exists');
  assert(!!sales2Doc, 'Sales 2 Mongo user exists');

  assert(sales1Doc?.role === 'sales', 'Sales 1 role is strictly "sales"');
  assert(sales2Doc?.role === 'sales', 'Sales 2 role is strictly "sales"');

  assert(sales1Doc?.isActive === true, 'Sales 1 account isActive is true');
  assert(sales2Doc?.isActive === true, 'Sales 2 account isActive is true');

  assert(sales1Doc?.password?.startsWith('$2'), 'Sales 1 password is saved as bcrypt hash');
  assert(sales2Doc?.password?.startsWith('$2'), 'Sales 2 password is saved as bcrypt hash');

  const s1PwMatch = await sales1Doc?.matchPassword('AshokSoftSales1@123');
  const s2PwMatch = await sales2Doc?.matchPassword('AshokSoftSales2@123');
  assert(s1PwMatch === true, 'Sales 1 password matches AshokSoftSales1@123');
  assert(s2PwMatch === true, 'Sales 2 password matches AshokSoftSales2@123');

  // ---------------------------------------------------------------------------
  // 2. AUTHENTICATION & LOGIN WORKFLOW
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 2: AUTHENTICATION & JWT TOKENS ---');

  // 2.1 Sales 1 Login
  const s1LoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ashoksoftsales1@gmail.com', password: 'AshokSoftSales1@123' })
  });
  const s1Data = await s1LoginRes.json();
  assert(s1LoginRes.status === 200, 'Sales 1 login returns 200 OK');
  assert(s1Data.role === 'sales', 'Sales 1 login returns role "sales"');
  assert(!!s1Data.token, 'Sales 1 login returns valid JWT token');
  const sales1Token = s1Data.token;

  // 2.2 Sales 2 Login
  const s2LoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ashoksoftsales2@gmail.com', password: 'AshokSoftSales2@123' })
  });
  const s2Data = await s2LoginRes.json();
  assert(s2LoginRes.status === 200, 'Sales 2 login returns 200 OK');
  assert(s2Data.role === 'sales', 'Sales 2 login returns role "sales"');
  assert(!!s2Data.token, 'Sales 2 login returns valid JWT token');
  const sales2Token = s2Data.token;

  // 2.3 Wrong Password Blocked
  const wrongPwRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ashoksoftsales1@gmail.com', password: 'WrongPassword@999' })
  });
  assert(wrongPwRes.status === 401, 'Wrong password blocked with 401 Unauthorized');

  // 2.4 Disabled Account Blocked
  const testDisabledUser = await User.findOneAndUpdate(
    { email: 'test.disabled.staff@wanderluxe.in' },
    {
      name: 'Disabled Staff Member',
      email: 'test.disabled.staff@wanderluxe.in',
      password: 'TestPassword@123',
      role: 'sales',
      isActive: false
    },
    { upsert: true, new: true }
  );
  const disabledLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test.disabled.staff@wanderluxe.in', password: 'TestPassword@123' })
  });
  assert(disabledLoginRes.status === 403, 'Disabled account (isActive: false) login blocked with 403 Forbidden');
  await User.deleteOne({ email: 'test.disabled.staff@wanderluxe.in' });

  // 2.5 Session Restore (GET /api/auth/me)
  const meRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${sales1Token}` }
  });
  const meData = await meRes.json();
  assert(meRes.status === 200, 'Session restore (GET /api/auth/me) returns 200');
  assert(meData.role === 'sales', 'Session restore preserves role "sales"');

  // 2.6 Public Registration Cannot Create "sales" Role
  const testRegEmail = `public.attacker.${Date.now()}@example.com`;
  const regRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Public Impersonator',
      email: testRegEmail,
      password: 'Password@123',
      role: 'sales' // Attempting privilege escalation
    })
  });
  const regData = await regRes.json();
  assert(regRes.status === 201, 'Public registration returns 201 Created');
  assert(regData.role === 'user', 'Public registration ignores input role and defaults to "user" (privilege escalation blocked)');
  await User.deleteOne({ email: testRegEmail });

  // Admin Login for subsequent tests
  const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'gaurav999@gmail.com', password: 'gaurav@999' })
  });
  const adminData = await adminLoginRes.json();
  const adminToken = adminData.token;
  assert(!!adminToken, 'Admin login returns token');

  // Normal user login for authorization checks
  const normalUserEmail = `normal.traveler.${Date.now()}@example.com`;
  const normalReg = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Normal Traveler', email: normalUserEmail, password: 'Password@123' })
  });
  const normalData = await normalReg.json();
  const normalUserToken = normalData.token;

  // ---------------------------------------------------------------------------
  // 3. RBAC ROUTE PROTECTION & PRIVILEGE ISOLATION
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 3: RBAC AUTHORIZATION & PRIVILEGE ISOLATION ---');

  // 3.1 Sales token accessing Admin-only endpoint (assign lead)
  const dummyLead = await Lead.create({
    referenceId: 'WLX-TEST-' + Math.floor(1000 + Math.random() * 9000),
    name: 'Test Traveler',
    email: 'test@traveler.com',
    phone: '+919876543210',
    tripTitle: 'Meghalaya Expedition',
    status: 'NEW',
    assignedTo: 'Sales Concierge Team'
  });

  const salesAssignRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/assign`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales1Token}` 
    },
    body: JSON.stringify({ assignedToUserId: sales2Doc._id })
  });
  assert(salesAssignRes.status === 403, 'Sales employee attempting Admin lead assignment blocked with 403 Forbidden');

  // 3.2 Sales token accessing /api/sales/dashboard
  const salesDashRes = await fetch(`${API_BASE}/sales/dashboard`, {
    headers: { Authorization: `Bearer ${sales1Token}` }
  });
  assert(salesDashRes.status === 200, 'Sales employee can access /api/sales/dashboard (200 OK)');
  const salesDashData = await salesDashRes.json();
  assert(salesDashData.success === true, 'Sales dashboard metrics returned successfully');

  // 3.3 Admin accessing /api/sales/dashboard
  const adminSalesDashRes = await fetch(`${API_BASE}/sales/dashboard`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  assert(adminSalesDashRes.status === 200, 'Admin can access /api/sales/dashboard (200 OK)');

  // 3.4 Normal customer accessing /api/sales/dashboard -> 403
  const normalDashRes = await fetch(`${API_BASE}/sales/dashboard`, {
    headers: { Authorization: `Bearer ${normalUserToken}` }
  });
  assert(normalDashRes.status === 403, 'Normal user accessing /api/sales/dashboard blocked with 403 Forbidden');

  // ---------------------------------------------------------------------------
  // 4. SALES DIRECTORY & WORKLOAD INDICATOR
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 4: SALES SPECIALISTS DIRECTORY & WORKLOAD ---');

  const salesUsersRes = await fetch(`${API_BASE}/leads/sales-users`, {
    headers: { Authorization: `Bearer ${adminToken}` }
  });
  const salesUsersData = await salesUsersRes.json();
  assert(salesUsersRes.status === 200, 'GET /api/leads/sales-users returns 200 OK');
  assert(Array.isArray(salesUsersData.users), 'Returns users array');

  const s1InDir = salesUsersData.users.find(u => u.email === 'ashoksoftsales1@gmail.com');
  const s2InDir = salesUsersData.users.find(u => u.email === 'ashoksoftsales2@gmail.com');
  assert(!!s1InDir, 'AshokSoft Sales 1 present in sales directory');
  assert(!!s2InDir, 'AshokSoft Sales 2 present in sales directory');
  assert(typeof s1InDir?.activeLeadsCount === 'number', 'Workload activeLeadsCount is present for Sales 1');
  assert(typeof s2InDir?.activeLeadsCount === 'number', 'Workload activeLeadsCount is present for Sales 2');

  // ---------------------------------------------------------------------------
  // 5. ADMIN ASSIGNMENT, OWNERSHIP & IDOR PROTECTION
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 5: ASSIGNMENT, REASSIGNMENT & IDOR PROTECTION ---');

  // 5.1 Admin assigns lead to Sales 1
  const assignRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/assign`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}` 
    },
    body: JSON.stringify({
      assignedToUserId: sales1Doc._id,
      assignedToName: sales1Doc.name
    })
  });
  const assignData = await assignRes.json();
  assert(assignRes.status === 200, 'Admin assigns lead to Sales 1 returns 200 OK');
  assert(String(assignData.lead?.assignedToUser?._id || assignData.lead?.assignedToUser) === String(sales1Doc._id), 'Lead assignedToUser persists Sales 1 ObjectId in MongoDB');
  assert(assignData.lead?.assignedToUserName === 'AshokSoft Sales 1', 'Lead assignedToUserName persists "AshokSoft Sales 1"');

  // 5.2 Sales 1 (Owner) can view lead
  const s1ViewRes = await fetch(`${API_BASE}/leads/${dummyLead._id}`, {
    headers: { Authorization: `Bearer ${sales1Token}` }
  });
  assert(s1ViewRes.status === 200, 'Sales 1 (Owner) can view assigned lead dossier (200 OK)');

  // 5.3 Sales 1 (Owner) logs contact outcome
  const logContactRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/log-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales1Token}`
    },
    body: JSON.stringify({
      outcome: 'CONNECTED',
      channel: 'call',
      notes: 'Traveler confirmed interest in dates.'
    })
  });
  const logData = await logContactRes.json();
  assert(logContactRes.status === 200, 'Sales 1 (Owner) logs contact outcome successfully');
  assert(logData.lead?.status === 'CONTACTED', 'Lead status transitioned to CONTACTED');

  // 5.4 Sales 1 (Owner) updates status to QUALIFIED
  const updateStatusRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales1Token}`
    },
    body: JSON.stringify({ status: 'QUALIFIED' })
  });
  assert(updateStatusRes.status === 200, 'Sales 1 (Owner) updates lead status to QUALIFIED');

  // 5.5 IDOR PROTECTION: Sales 2 attempts to log contact on Sales 1's lead -> 403
  const s2IdorLogRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/log-contact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales2Token}`
    },
    body: JSON.stringify({
      outcome: 'CONNECTED',
      notes: 'Intruder sales rep attempting contact.'
    })
  });
  assert(s2IdorLogRes.status === 403, 'IDOR BLOCKED: Sales 2 cannot log contact on Sales 1 lead (403 Forbidden)');

  // 5.6 IDOR PROTECTION: Sales 2 attempts to update status on Sales 1's lead -> 403
  const s2IdorStatusRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales2Token}`
    },
    body: JSON.stringify({ status: 'LOST', lostReason: 'Budget Mismatch' })
  });
  assert(s2IdorStatusRes.status === 403, 'IDOR BLOCKED: Sales 2 cannot update status on Sales 1 lead (403 Forbidden)');

  // 5.7 REASSIGNMENT: Admin reassigns lead from Sales 1 to Sales 2
  const reassignRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/assign`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      assignedToUserId: sales2Doc._id,
      assignedToName: sales2Doc.name
    })
  });
  assert(reassignRes.status === 200, 'Admin can reassign lead from Sales 1 to Sales 2 (200 OK)');

  // 5.8 Ownership Transfer: Sales 2 now can update status; Sales 1 now blocked
  const s2NewOwnerRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales2Token}`
    },
    body: JSON.stringify({ status: 'IN_PROGRESS' })
  });
  assert(s2NewOwnerRes.status === 200, 'Sales 2 (New Owner) can now update status (200 OK)');

  const s1OldOwnerRes = await fetch(`${API_BASE}/leads/${dummyLead._id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${sales1Token}`
    },
    body: JSON.stringify({ status: 'LOST', lostReason: 'Other' })
  });
  assert(s1OldOwnerRes.status === 403, 'Sales 1 (Former Owner) is now blocked after reassignment (403 Forbidden)');

  // ---------------------------------------------------------------------------
  // 6. ATOMIC CLAIM & CONCURRENT RACE CONDITION
  // ---------------------------------------------------------------------------
  console.log('\n--- SECTION 6: ATOMIC CLAIM & RACE CONDITION ---');

  const openLead = await Lead.create({
    referenceId: 'WLX-CLAIM-' + Math.floor(1000 + Math.random() * 9000),
    name: 'Open Pool Traveler',
    email: 'open.pool@traveler.com',
    phone: '+919876543219',
    tripTitle: 'Spiti Valley Roadtrip',
    status: 'NEW',
    assignedTo: 'Sales Concierge Team',
    assignedToUser: null
  });

  // Sales 1 claims the unassigned lead
  const claimRes = await fetch(`${API_BASE}/leads/${openLead._id}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sales1Token}` }
  });
  const claimData = await claimRes.json();
  assert(claimRes.status === 200, 'Sales 1 claims open request successfully (200 OK)');
  assert(String(claimData.lead?.assignedToUser?._id || claimData.lead?.assignedToUser) === String(sales1Doc._id), 'Claim assigns lead to Sales 1');

  // Sales 2 attempts to claim already claimed lead -> 409 Conflict
  const secondClaimRes = await fetch(`${API_BASE}/leads/${openLead._id}/claim`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${sales2Token}` }
  });
  assert(secondClaimRes.status === 409, 'Sales 2 claim on already-claimed request yields 409 Conflict (atomic race protection)');

  // Cleanup test documents
  await Lead.deleteMany({ _id: { $in: [dummyLead._id, openLead._id] } });
  await User.deleteOne({ email: normalUserEmail });

  // ---------------------------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`🏁 TEST SUITE COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('===============================================================\n');

  if (failCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite uncaught error:', err);
  process.exit(1);
});
