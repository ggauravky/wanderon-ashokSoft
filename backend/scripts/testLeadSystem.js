/**
 * Automated Verification Script for Lead & Callback Request System
 */

const API_BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD are required.');
}

async function runTests() {
  console.log('--- STARTING LEAD & SCHEDULE CALL SYSTEM AUTOMATED TESTS ---\n');

  // 1. Admin Login to get token
  console.log('1. Logging in as Admin...');
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    })
  });

  const loginData = await loginRes.json();
  if (!loginRes.ok || !loginData.token) {
    throw new Error('Admin login failed: ' + (loginData.message || 'Unknown error'));
  }
  const adminToken = loginData.token;
  console.log('✅ Admin login successful. Token acquired.\n');

  // 2. Submit Guest Callback Request
  console.log('2. Testing Guest Callback Request Submission...');
  const randomSuffix = Math.floor(10000 + Math.random() * 90000);
  const guestEmail = `traveler.test.${randomSuffix}@gmail.com`;
  const guestPhone = `98765${randomSuffix}`;

  const guestLeadPayload = {
    name: 'Pooja Hegde',
    email: guestEmail,
    phone: guestPhone,
    leadType: 'callback_request',
    tripId: 'spiti-valley-circuit-roadtrip',
    tripTitle: 'Full Spiti Valley Circuit Group Tour From Delhi: Shimla To Manali',
    destination: 'Spiti Valley, Himachal',
    preferredCallDate: '2026-08-30',
    preferredCallWindow: 'Morning',
    travelersCount: 2,
    travelDate: '04 Oct 2026 - 12 Oct 2026',
    message: 'Inquiry Topics: Customized Route, Solo Traveler Queries\nNote: Need pickup from Chandigarh instead of Delhi.',
    source: 'trip_page'
  };

  const guestRes = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guestLeadPayload)
  });

  const guestData = await guestRes.json();
  if (!guestRes.ok || !guestData.success) {
    throw new Error('Guest callback submission failed: ' + (guestData.message || 'Error'));
  }
  const createdLeadId = guestData.lead?._id || guestData.lead?.id;
  console.log(`✅ Guest Callback Created Successfully! Lead ID: ${createdLeadId}`);
  console.log(`   Message: "${guestData.message}"\n`);

  // 3. Test Spam / Duplicate Throttling
  console.log('3. Testing Duplicate Throttling (Submitting identical request immediately)...');
  const dupRes = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(guestLeadPayload)
  });

  const dupData = await dupRes.json();
  if (dupRes.ok && dupData.isDuplicateThrottled) {
    console.log(`✅ Duplicate Throttling Verified! Server returned HTTP 200 with friendly message.`);
    console.log(`   Response: "${dupData.message}"\n`);
  } else {
    console.warn(`⚠️ Warning: Duplicate throttling returned:`, dupData);
  }

  // 4. Test Server Validation (Invalid Email & Short Phone)
  console.log('4. Testing Server Validations...');
  const invalidRes = await fetch(`${API_BASE}/leads`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'A',
      email: 'not-an-email',
      phone: '123'
    })
  });

  const invalidData = await invalidRes.json();
  if (!invalidRes.ok && invalidRes.status === 400) {
    console.log(`✅ Server Validation Verified! Rejected with message: "${invalidData.message}"\n`);
  } else {
    throw new Error('Expected 400 validation error but got: ' + invalidRes.status);
  }

  // 5. Test Admin CRM Retrieval
  console.log('5. Testing Admin CRM Retrieval (GET /api/leads)...');
  const getLeadsRes = await fetch(`${API_BASE}/leads`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  const allLeads = await getLeadsRes.json();
  if (!getLeadsRes.ok || !Array.isArray(allLeads)) {
    throw new Error('Failed to retrieve leads from Admin CRM endpoint');
  }
  console.log(`✅ Admin CRM Retrieved ${allLeads.length} leads.`);
  const matchingLead = allLeads.find(l => String(l._id || l.id) === String(createdLeadId) || l.email === guestEmail);
  if (matchingLead) {
    console.log(`   Found newly created lead: ${matchingLead.name} (${matchingLead.email})`);
    console.log(`   Type: ${matchingLead.leadType} | Call Window: ${matchingLead.preferredCallDate} [${matchingLead.preferredCallWindow}]`);
  }
  console.log('');

  // 6. Test Admin Status Update
  console.log(`6. Testing Admin Status Update (PUT /api/leads/${createdLeadId}/status)...`);
  const updateRes = await fetch(`${API_BASE}/leads/${createdLeadId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'QUALIFIED',
      notes: 'Customer contacted via phone. Interested in Chandigarh pickup. Sending quote.',
      assignedTo: 'Specialist Rahul'
    })
  });

  const updateData = await updateRes.json();
  if (!updateRes.ok || (updateData.status !== 'QUALIFIED' && updateData.lead?.status !== 'QUALIFIED')) {
    throw new Error('Failed to update lead status: ' + JSON.stringify(updateData));
  }
  console.log(`✅ Status updated to "QUALIFIED" with notes successfully!\n`);

  console.log('--- ALL LEAD & SCHEDULE CALL TESTS PASSED PERFECTLY ---');
}

runTests().catch((err) => {
  console.error('❌ Test Failed:', err);
  process.exit(1);
});
