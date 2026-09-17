import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');

async function runAdvancedFilterTests() {
  console.log('🚀 --- STARTING PHASE C2: ADVANCED TRAVEL FILTERS & DISCOVERY UI TESTS --- 🚀\n');

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

  const mockModule = await import('file:///' + mockDataPath.replace(/\\/g, '/'));
  const trips = mockModule.UPCOMING_TRIPS || [];

  assert(trips.length === 50, `Catalog loaded with all 50 verified trips`);

  // Mirror the core matching logic from Destinations.jsx
  const matchTrip = (trip, filters = {}, query = '') => {
    if (!trip) return false;

    const title = (trip.title || '').toLowerCase();
    const loc = (trip.location || '').toLowerCase();
    const dest = (trip.destination || '').toLowerCase();
    const overview = (trip.overview || '').toLowerCase();
    const tags = Array.isArray(trip.tags) ? trip.tags.map(t => (t || '').toLowerCase()) : [];
    const dur = (trip.duration || '').toLowerCase();
    const cat = (trip.category || '').toLowerCase();
    const grade = (trip.grade || '').toLowerCase();
    const sp = (trip.startingPoint || '').toLowerCase();
    const price = Number(trip.price) || 0;

    // Search
    if (query && query.trim()) {
      const q = query.toLowerCase().trim();
      const matchQ = title.includes(q) || loc.includes(q) || dest.includes(q) || overview.includes(q) || tags.some(t => t.includes(q));
      if (!matchQ) return false;
    }

    // Destination
    if (filters.destination && filters.destination !== 'all') {
      const d = filters.destination.toLowerCase();
      if (d === 'india' || d === 'domestic') {
        if (dest.includes('bali') || dest.includes('indonesia')) return false;
      } else if (d === 'international') {
        if (!dest.includes('bali') && !dest.includes('indonesia') && !cat.includes('international')) return false;
      } else {
        if (!dest.includes(d) && !loc.includes(d)) return false;
      }
    }

    // Month
    if (filters.month && filters.month !== 'all') {
      const m = filters.month.toLowerCase();
      const nextB = (trip.nextBatch || '').toLowerCase();
      const batches = Array.isArray(trip.availableBatches) 
        ? trip.availableBatches.map(b => (b.dates || '').toLowerCase()).join(' ')
        : '';
      const bestM = Array.isArray(trip.bestMonths) 
        ? trip.bestMonths.map(bm => (bm || '').toLowerCase()).join(' ')
        : '';
      const matchM = nextB.includes(m) || batches.includes(m) || bestM.includes(m);
      if (!matchM) return false;
    }

    // Duration
    if (filters.duration && filters.duration !== 'all') {
      if (filters.duration === 'weekend') {
        if (!dur.includes('2n') && !dur.includes('3d') && !dur.includes('3n/4d') && !cat.includes('weekend')) return false;
      } else if (filters.duration === 'short') {
        if (!dur.includes('4n') && !dur.includes('5d') && !dur.includes('3n/4d') && !dur.includes('5n/6d')) return false;
      } else if (filters.duration === 'expedition') {
        if (!dur.includes('6n') && !dur.includes('7d') && !dur.includes('8d') && !dur.includes('5n/6d')) return false;
      }
    }

    // Budget
    if (filters.budget && filters.budget !== 'all') {
      if (filters.budget === 'under15k' && price > 15000) return false;
      if (filters.budget === '15k_25k' && (price < 15000 || price > 25000)) return false;
      if (filters.budget === '25k_35k' && (price < 25000 || price > 35000)) return false;
      if (filters.budget === 'above35k' && price < 35000) return false;
    }

    // Trip Type
    if (filters.tripType && filters.tripType !== 'all') {
      const type = filters.tripType.toLowerCase();
      if (type === 'backpacking') {
        if (!cat.includes('backpacking') && !tags.includes('backpacking') && !tags.includes('high altitude') && !tags.includes('offbeat')) return false;
      } else if (type === 'weekend') {
        if (!cat.includes('weekend') && !tags.includes('weekend trips') && !dur.includes('2n') && !dur.includes('3d')) return false;
      } else if (type === 'adventure') {
        if (!cat.includes('adventure') && !tags.includes('adventure') && !tags.includes('treks') && !['challenging', 'difficult'].includes(grade)) return false;
      } else if (type === 'romantic') {
        if (!['goa', 'kerala', 'bali', 'kashmir'].some(r => dest.includes(r)) && !tags.includes('beach') && !tags.includes('lakes')) return false;
      } else if (type === 'culture') {
        if (!cat.includes('culture') && !dest.includes('rajasthan') && !tags.includes('culture') && !tags.includes('heritage')) return false;
      }
    }

    // Mood
    if (filters.mood && filters.mood !== 'all') {
      const md = filters.mood.toLowerCase();
      if (md === 'cold') {
        if (!['spiti', 'ladakh', 'kashmir', 'auli', 'himachal', 'uttarakhand'].some(r => loc.includes(r) || dest.includes(r))) return false;
      } else if (md === 'tropical') {
        if (!['goa', 'bali', 'kerala'].some(r => loc.includes(r) || dest.includes(r))) return false;
      } else if (md === 'rainforest') {
        if (!['meghalaya', 'wayanad'].some(r => loc.includes(r) || dest.includes(r))) return false;
      } else if (md === 'heritage') {
        if (!dest.includes('rajasthan') && !tags.includes('heritage') && !tags.includes('culture')) return false;
      }
    }

    // City
    if (filters.city && filters.city !== 'all') {
      const c = filters.city.toLowerCase();
      if (c === 'delhi') {
        if (!sp.includes('delhi') && !sp.includes('chandigarh')) return false;
      } else if (c === 'rishikesh') {
        if (!sp.includes('rishikesh') && !sp.includes('haridwar') && !sp.includes('dehradun')) return false;
      } else if (c === 'shimla') {
        if (!sp.includes('shimla') && !sp.includes('manali') && !sp.includes('kasol')) return false;
      } else if (c === 'goa') {
        if (!sp.includes('goa') && !sp.includes('thivim') && !sp.includes('mopa')) return false;
      } else if (c === 'cochin') {
        if (!sp.includes('cochin') && !sp.includes('kochi') && !sp.includes('calicut') && !sp.includes('trivandrum')) return false;
      } else if (c === 'jaipur') {
        if (!sp.includes('jaipur') && !sp.includes('udaipur') && !sp.includes('jaisalmer')) return false;
      } else if (c === 'bali') {
        if (!sp.includes('bali') && !sp.includes('denpasar')) return false;
      } else {
        if (!sp.includes(c)) return false;
      }
    }

    return true;
  };

  // Test 1: Destination Filtering
  console.log('\n--- 1. Destination Filter Tests ---');
  const indiaTrips = trips.filter(t => matchTrip(t, { destination: 'india' }));
  assert(indiaTrips.length === 46, `India filter matches 46 trips (Actual: ${indiaTrips.length})`);

  const intlTrips = trips.filter(t => matchTrip(t, { destination: 'international' }));
  assert(intlTrips.length === 4, `International filter matches 4 Bali trips (Actual: ${intlTrips.length})`);

  const himachalTrips = trips.filter(t => matchTrip(t, { destination: 'himachal' }));
  assert(himachalTrips.length === 12, `Himachal filter matches 12 trips (Actual: ${himachalTrips.length})`);

  const meghalayaTrips = trips.filter(t => matchTrip(t, { destination: 'meghalaya' }));
  assert(meghalayaTrips.length === 6, `Meghalaya filter matches 6 trips (Actual: ${meghalayaTrips.length})`);

  // Test 2: Month / Departure Filtering
  console.log('\n--- 2. Month Filter Tests ---');
  const augTrips = trips.filter(t => matchTrip(t, { month: 'aug' }));
  assert(augTrips.length === 13, `August filter matches 13 active packages with August departures (Actual: ${augTrips.length})`);

  const sepTrips = trips.filter(t => matchTrip(t, { month: 'sep' }));
  assert(sepTrips.length === 36, `September filter matches 36 active packages with September departures (Actual: ${sepTrips.length})`);

  // Test 3: Duration Filtering
  console.log('\n--- 3. Duration Filter Tests ---');
  const weekendTrips = trips.filter(t => matchTrip(t, { duration: 'weekend' }));
  assert(weekendTrips.length === 19, `Weekend filter matches 19 short getaways (Actual: ${weekendTrips.length})`);

  const shortTrips = trips.filter(t => matchTrip(t, { duration: 'short' }));
  assert(shortTrips.length === 40, `Short 4-5D filter matches 40 trips (Actual: ${shortTrips.length})`);

  const expeditionTrips = trips.filter(t => matchTrip(t, { duration: 'expedition' }));
  assert(expeditionTrips.length === 17, `Expedition 6-8D filter matches 17 trips (Actual: ${expeditionTrips.length})`);

  // Test 4: Budget Filtering
  console.log('\n--- 4. Budget Filter Tests ---');
  const budgetUnder15k = trips.filter(t => matchTrip(t, { budget: 'under15k' }));
  assert(budgetUnder15k.length === 23, `Under ₹15k matches 23 budget-friendly trips (Actual: ${budgetUnder15k.length})`);

  const budget15k_25k = trips.filter(t => matchTrip(t, { budget: '15k_25k' }));
  assert(budget15k_25k.length === 19, `₹15k-₹25k matches 19 mid-range trips (Actual: ${budget15k_25k.length})`);

  const budgetAbove35k = trips.filter(t => matchTrip(t, { budget: 'above35k' }));
  assert(budgetAbove35k.length === 3, `Above ₹35k matches 3 premium/luxury packages (Actual: ${budgetAbove35k.length})`);

  // Test 5: Starting City Hub Filtering
  console.log('\n--- 5. Starting City Filter Tests ---');
  const delhiTrips = trips.filter(t => matchTrip(t, { city: 'delhi' }));
  assert(delhiTrips.length === 10, `Delhi/Chandigarh departure hub matches 10 trips (Actual: ${delhiTrips.length})`);

  const guwahatiTrips = trips.filter(t => matchTrip(t, { city: 'guwahati' }));
  assert(guwahatiTrips.length === 6, `Guwahati departure hub matches 6 Northeast trips (Actual: ${guwahatiTrips.length})`);

  const baliTrips = trips.filter(t => matchTrip(t, { city: 'bali' }));
  assert(baliTrips.length === 4, `Bali/Denpasar departure hub matches 4 Bali trips (Actual: ${baliTrips.length})`);

  const rishikeshTrips = trips.filter(t => matchTrip(t, { city: 'rishikesh' }));
  assert(rishikeshTrips.length === 7, `Rishikesh/Haridwar/Dehradun departure hub matches 7 trips (Actual: ${rishikeshTrips.length})`);

  // Test 6: Multi-Criteria Filter Intersection
  console.log('\n--- 6. Multi-Criteria Intersection Tests ---');
  const himachalWeekend = trips.filter(t => matchTrip(t, { destination: 'himachal', duration: 'weekend' }));
  assert(himachalWeekend.length === 6, `Himachal + Weekend matches exactly 6 packages (Actual: ${himachalWeekend.length})`);

  const meghalayaRainforest = trips.filter(t => matchTrip(t, { destination: 'meghalaya', mood: 'rainforest' }));
  assert(meghalayaRainforest.length === 6, `Meghalaya + Rainforest matches 6 packages (Actual: ${meghalayaRainforest.length})`);

  // Test 7: Empty State Non-Zero Fake Trips Verification
  console.log('\n--- 7. Empty State Verification ---');
  const impossibleTrip = trips.filter(t => matchTrip(t, { destination: 'bali', mood: 'cold' }));
  assert(impossibleTrip.length === 0, `Impossible filter combination returns exactly 0 trips (No fake fallbacks)`);

  // Test 8: Sorting Accuracy
  console.log('\n--- 8. Sorting Logic Tests ---');
  const sortedPriceAsc = [...trips].sort((a, b) => (a.price || 0) - (b.price || 0));
  assert(sortedPriceAsc[0].price === 6500, `Lowest price is ₹6,500 (${sortedPriceAsc[0].title})`);

  const sortedPriceDesc = [...trips].sort((a, b) => (b.price || 0) - (a.price || 0));
  assert(sortedPriceDesc[0].price === 45000, `Highest price is ₹45,000 (${sortedPriceDesc[0].title})`);

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAdvancedFilterTests().catch(err => {
  console.error('Fatal Filter Test Error:', err);
  process.exit(1);
});
