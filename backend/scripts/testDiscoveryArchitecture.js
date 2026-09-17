import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');
const taxonomyPath = path.join(__dirname, '../../frontend/src/config/discoveryTaxonomy.js');

async function runDiscoveryTests() {
  console.log('🚀 --- STARTING PHASE C1: TRAVEL DISCOVERY ARCHITECTURE TESTS --- 🚀\n');

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

  // Load modules dynamically
  const mockModule = await import('file:///' + mockDataPath.replace(/\\/g, '/'));
  const taxonomyModule = await import('file:///' + taxonomyPath.replace(/\\/g, '/'));

  const trips = mockModule.UPCOMING_TRIPS || [];
  const presets = taxonomyModule.DISCOVERY_PRESETS || [];
  const getPresetByPath = taxonomyModule.getPresetByPath;

  assert(trips.length === 50, `Catalog contains exact authoritative total of 50 trips (Found: ${trips.length})`);
  assert(presets.length >= 17, `Taxonomy defines all necessary discovery presets & hubs (Found: ${presets.length})`);

  // Test 1: Preset Metadata & SEO Completeness
  console.log('\n--- 1. Testing SEO Metadata & Canonical Stability ---');
  const seenTitles = new Set();
  const seenCanonicals = new Set();

  presets.forEach((p) => {
    assert(Boolean(p.id), `[${p.id}] Preset has valid ID`);
    assert(Boolean(p.canonicalPath && p.canonicalPath.startsWith('/')), `[${p.id}] Canonical path starts with '/' (${p.canonicalPath})`);
    assert(!p.canonicalPath.includes('?') && !p.canonicalPath.includes('&'), `[${p.id}] Canonical URL is stable and query-free`);
    assert(Boolean(p.seoTitle && p.seoTitle.length > 15), `[${p.id}] SEO Title is non-empty (${p.seoTitle})`);
    assert(Boolean(p.metaDescription && p.metaDescription.length >= 40), `[${p.id}] Meta description is detailed (${p.metaDescription.length} chars)`);
    assert(Boolean(p.heading && p.heading.length > 5), `[${p.id}] H1 heading is defined ("${p.heading}")`);
    assert(Boolean(p.badge), `[${p.id}] Hero badge is defined ("${p.badge}")`);
    assert(typeof p.filterPredicate === 'function', `[${p.id}] Filter predicate is a function`);

    // Title and canonical uniqueness
    assert(!seenTitles.has(p.seoTitle), `[${p.id}] SEO Title is globally unique`);
    seenTitles.add(p.seoTitle);

    assert(!seenCanonicals.has(p.canonicalPath), `[${p.id}] Canonical path is unique`);
    seenCanonicals.add(p.canonicalPath);
  });

  // Test 2: Filter Predicate & Data Backing (Zero Empty SEO Pages Rule)
  console.log('\n--- 2. Testing Data-Backing (Zero Empty Pages) ---');
  presets.forEach((p) => {
    const matchedTrips = trips.filter(p.filterPredicate);
    assert(
      matchedTrips.length >= 3,
      `[${p.id}] MUST match >= 3 trips to prevent empty SEO pages (Matches: ${matchedTrips.length})`
    );
  });

  // Test 3: Specific Core Presets Exact Counts
  console.log('\n--- 3. Testing Exact Taxonomy Counts ---');
  const allTrips = trips.filter(presets.find(p => p.id === 'all-trips').filterPredicate);
  assert(allTrips.length === 50, `all-trips matches 50 items (Actual: ${allTrips.length})`);

  const indiaTrips = trips.filter(presets.find(p => p.id === 'india-trips').filterPredicate);
  assert(indiaTrips.length === 46, `india-trips matches 46 items (Actual: ${indiaTrips.length})`);

  const intlTrips = trips.filter(presets.find(p => p.id === 'international-trips').filterPredicate);
  assert(intlTrips.length === 4, `international-trips matches 4 Bali items (Actual: ${intlTrips.length})`);

  const weekendTrips = trips.filter(presets.find(p => p.id === 'weekend-trips').filterPredicate);
  assert(weekendTrips.length === 19, `weekend-trips matches 19 short getaways (Actual: ${weekendTrips.length})`);

  const backpackingTrips = trips.filter(presets.find(p => p.id === 'backpacking-trips').filterPredicate);
  assert(backpackingTrips.length === 15, `backpacking-trips matches 15 offbeat trails (Actual: ${backpackingTrips.length})`);

  const adventureTreks = trips.filter(presets.find(p => p.id === 'adventure-treks').filterPredicate);
  assert(adventureTreks.length === 19, `adventure-treks matches 19 treks (Actual: ${adventureTreks.length})`);

  const romanticEscapes = trips.filter(presets.find(p => p.id === 'romantic-escapes').filterPredicate);
  assert(romanticEscapes.length === 20, `romantic-escapes matches 20 getaways (Actual: ${romanticEscapes.length})`);

  const cultureHeritage = trips.filter(presets.find(p => p.id === 'culture-heritage').filterPredicate);
  assert(cultureHeritage.length === 12, `culture-heritage matches 12 heritage trails (Actual: ${cultureHeritage.length})`);

  // Test 4: Destination Hubs Counts
  console.log('\n--- 4. Testing Destination Hubs ---');
  const hubTests = [
    { id: 'hub-himachal', expected: 12 },
    { id: 'hub-uttarakhand', expected: 8 },
    { id: 'hub-meghalaya', expected: 6 },
    { id: 'hub-kashmir', expected: 5 },
    { id: 'hub-ladakh', expected: 4 },
    { id: 'hub-goa', expected: 4 },
    { id: 'hub-kerala', expected: 4 },
    { id: 'hub-rajasthan', expected: 3 },
    { id: 'hub-bali', expected: 4 }
  ];

  hubTests.forEach(({ id, expected }) => {
    const hubPreset = presets.find(p => p.id === id);
    const count = trips.filter(hubPreset.filterPredicate).length;
    assert(count === expected, `[${id}] matches expected ${expected} trips (Actual: ${count})`);
  });

  // Test 5: Route Matching Resolution
  console.log('\n--- 5. Testing Route Matching & Fallbacks ---');
  assert(getPresetByPath('/trips').id === 'all-trips', 'Resolved /trips -> all-trips');
  assert(getPresetByPath('/destinations').id === 'all-trips', 'Resolved /destinations -> all-trips');
  assert(getPresetByPath('/trips/india').id === 'india-trips', 'Resolved /trips/india -> india-trips');
  assert(getPresetByPath('/domestic').id === 'india-trips', 'Resolved /domestic -> india-trips');
  assert(getPresetByPath('/trips/international').id === 'international-trips', 'Resolved /trips/international -> international-trips');
  assert(getPresetByPath('/weekend-trips').id === 'weekend-trips', 'Resolved /weekend-trips -> weekend-trips');
  assert(getPresetByPath('/backpacking-trips').id === 'backpacking-trips', 'Resolved /backpacking-trips -> backpacking-trips');
  assert(getPresetByPath('/adventure-treks').id === 'adventure-treks', 'Resolved /adventure-treks -> adventure-treks');
  assert(getPresetByPath('/romantic-escapes').id === 'romantic-escapes', 'Resolved /romantic-escapes -> romantic-escapes');
  assert(getPresetByPath('/culture-heritage').id === 'culture-heritage', 'Resolved /culture-heritage -> culture-heritage');
  assert(getPresetByPath('/trips/himachal-pradesh').id === 'hub-himachal', 'Resolved /trips/himachal-pradesh -> hub-himachal');
  assert(getPresetByPath('/trips/meghalaya').id === 'hub-meghalaya', 'Resolved /trips/meghalaya -> hub-meghalaya');
  assert(getPresetByPath('/destinations/kashmir').id === 'hub-kashmir', 'Resolved /destinations/kashmir -> hub-kashmir');
  assert(getPresetByPath('/some/unknown/path').id === 'all-trips', 'Unknown route safely falls back to all-trips');

  console.log(`\n========================================`);
  console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log(`========================================`);

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runDiscoveryTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
