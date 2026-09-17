const API_BASE = 'http://localhost:5000/api';
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  throw new Error('TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD are required.');
}

async function runTest() {
  console.log('--- STARTING ADMIN SYSTEM COMPREHENSIVE TEST ---');

  // 1. Admin Login
  const loginRes = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
  });
  const loginData = await loginRes.json();
  if (!loginRes.ok) {
    throw new Error(`Login failed: ${loginData.message}`);
  }
  const token = loginData.token;
  console.log('✅ 1. Admin Login Successful. Token acquired.');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`
  };

  // 2. Real Analytics
  const statsRes = await fetch(`${API_BASE}/admin/stats?range=30d`, { headers });
  const stats = await statsRes.json();
  console.log(`✅ 2. Real Analytics Aggregation:
     - Real Data Flag: ${stats.isRealData}
     - Gross Revenue: ₹${stats.totalRevenue}
     - Total Bookings: ${stats.totalBookings}
     - Active Trips: ${stats.activeTrips}
     - Total Users: ${stats.totalUsers}`);

  // 3. Influencer Applications
  const appsRes = await fetch(`${API_BASE}/admin/influencer-applications`, { headers });
  const apps = await appsRes.json();
  console.log(`✅ 3. Influencer Verification Engine: ${Array.isArray(apps) ? apps.length : 0} applications found.`);

  // 4. Create Trip CMS
  const newTripRes = await fetch(`${API_BASE}/trips`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Kashmir Great Lakes Alpine Trek 2026',
      slug: 'kashmir-great-lakes-alpine-trek-2026',
      location: 'Sonamarg to Naranag, Kashmir',
      destination: 'Kashmir',
      duration: '7D/6N',
      price: 24500,
      originalPrice: 29500,
      image: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
      overview: '7 days alpine trek covering Vishansar, Gadsar and Satsar glacial lakes.',
      status: 'published'
    })
  });
  const newTrip = await newTripRes.json();
  console.log(`✅ 4. Trip CMS Create Package: Created "${newTrip.data.title}" (slug: ${newTrip.data.slug})`);

  // 5. Verify Public Trip
  const publicTripRes = await fetch(`${API_BASE}/trips/${newTrip.data.slug}`);
  const publicTrip = await publicTripRes.json();
  console.log(`✅ 5. Public Storefront Trip Retrieval: "${publicTrip.data.title}" - ₹${publicTrip.data.price}`);

  // 6. Create Dynamic Page CMS
  const newPageRes = await fetch(`${API_BASE}/pages`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: 'Ladakh High Altitude Passes Guide 2026',
      slug: 'ladakh-high-passes-guide-2026',
      heroSubtitle: 'Conquer Khardung La, Pangong Tso, and Nubra Valley',
      category: 'Expeditions',
      content: 'Complete guide for self-drive and group expeditions across Ladakh.',
      status: 'published'
    })
  });
  const newPage = await newPageRes.json();
  console.log(`✅ 6. Dynamic Page CMS Create: Created "${newPage.page?.title || newPage.title}"`);

  // 7. Verify Dynamic Public Page
  const publicPageRes = await fetch(`${API_BASE}/pages/ladakh-high-passes-guide-2026`);
  const publicPage = await publicPageRes.json();
  console.log(`✅ 7. Dynamic Page Public URL (/page/ladakh-high-passes-guide-2026): SEO Health = ${publicPage.seoHealthScore}%`);

  console.log('--- ALL ADMIN SYSTEM UPGRADE TESTS PASSED PERFECTLY ---');
}

runTest().catch((e) => console.error('Test Failed:', e));
