import assert from 'assert';
import { 
  resolveItineraryMedia, 
  batchResolveItineraryMedia, 
  isTropicalWarmDestination 
} from './services/mediaResolverService.js';
import { CANONICAL_MEDIA_ASSETS } from './data/canonicalMediaAssets.js';

console.log('=============================================================================');
console.log('WANDERLUXE — ITINERARY DAY GALLERY UPGRADE TEST SUITE');
console.log('=============================================================================');

let passedTests = 0;
let failedTests = 0;

const runTest = async (title, fn) => {
  try {
    await fn();
    console.log(`  ✅ PASS: ${title}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ FAIL: ${title}`);
    console.error('    Error:', err.message);
    failedTests++;
  }
};

async function runSuite() {
  console.log('\n👉 SUITE 1: Tropical Destination Climate Guardrails (Zero Snow Guarantee)');

  await runTest('Meghalaya must NEVER return snowy mountain or winter imagery', async () => {
    const res = await resolveItineraryMedia({
      destination: 'Meghalaya',
      locationName: 'Meghalaya High Peak Viewpoint',
      tags: ['mountains', 'adventure']
    });

    assert(res.recommended, 'Resolver returned an asset');
    const allImages = [res.coverMedia, ...(res.galleryMedia || [])].filter(Boolean);
    assert(allImages.length > 0, 'Returned images');

    const snowRegex = /\b(snow|ski|skiing|glacier|snowfall|winter)\b/i;
    for (const img of allImages) {
      const text = `${img.caption || ''} ${img.altText || ''}`;
      assert(!snowRegex.test(text), `Meghalaya image must not have snow: ${text}`);
    }
  });

  await runTest('Goa must NEVER return snow or winter imagery', async () => {
    const res = await resolveItineraryMedia({
      destination: 'Goa',
      locationName: 'Scenic Coastal Trail'
    });
    const allImages = [res.coverMedia, ...(res.galleryMedia || [])].filter(Boolean);
    const snowRegex = /\b(snow|ski|skiing|glacier|winter)\b/i;
    for (const img of allImages) {
      const text = `${img.caption || ''} ${img.altText || ''}`;
      assert(!snowRegex.test(text), `Goa image must not have snow: ${text}`);
    }
  });

  await runTest('Bali must NEVER return snow or winter imagery', async () => {
    const res = await resolveItineraryMedia({
      destination: 'Bali',
      locationName: 'Ubud Rice Valleys'
    });
    const allImages = [res.coverMedia, ...(res.galleryMedia || [])].filter(Boolean);
    const snowRegex = /\b(snow|ski|skiing|glacier|winter)\b/i;
    for (const img of allImages) {
      const text = `${img.caption || ''} ${img.altText || ''}`;
      assert(!snowRegex.test(text), `Bali image must not have snow: ${text}`);
    }
  });

  await runTest('isTropicalWarmDestination correctly identifies tropical locations', () => {
    assert(isTropicalWarmDestination('Meghalaya', 'meghalaya'), 'Meghalaya is tropical/warm');
    assert(isTropicalWarmDestination('Goa Beach Holiday', 'goa'), 'Goa is tropical/warm');
    assert(isTropicalWarmDestination('Bali Island Tour', 'bali'), 'Bali is tropical/warm');
    assert(isTropicalWarmDestination('Kerala Backwaters', 'kerala'), 'Kerala is tropical/warm');
    assert(!isTropicalWarmDestination('Manali Snow Trek', 'himachal-pradesh'), 'Manali is NOT tropical');
    assert(!isTropicalWarmDestination('Spiti Valley Expedition', 'spiti-valley'), 'Spiti is NOT tropical');
  });

  console.log('\n👉 SUITE 2: Dynamic Gallery Count & Visual Hierarchy (1 Cover + Up to 2 Gallery)');

  await runTest('Meghalaya day resolves 3 distinct, verified nature images (1 cover + 2 gallery)', async () => {
    const res = await resolveItineraryMedia({
      destination: 'Meghalaya',
      locationName: 'Cherrapunji',
      excludeAssetIds: []
    });

    assert(res.coverMedia, 'Cover media present');
    assert(res.coverMedia.url, 'Cover media has URL');
    assert(Array.isArray(res.galleryMedia), 'galleryMedia is an array');
    assert(res.galleryMedia.length === 2, `Expected 2 gallery images, got ${res.galleryMedia.length}`);
    assert(res.gallery.length === 3, `Expected gallery of 3, got ${res.gallery.length}`);

    // Check unique URLs
    const urls = res.gallery.map(g => g.url);
    const uniqueUrls = new Set(urls);
    assert.strictEqual(uniqueUrls.size, 3, 'All 3 gallery images must have unique URLs');

    // Check unique IDs
    const ids = [res.coverMedia.id, ...res.galleryMediaAssetIds];
    const uniqueIds = new Set(ids);
    assert.strictEqual(uniqueIds.size, 3, 'All 3 gallery image IDs must be unique');
  });

  await runTest('Bali day resolves 3 distinct, verified Bali nature images', async () => {
    const res = await resolveItineraryMedia({
      destination: 'Bali',
      locationName: 'Ubud',
      excludeAssetIds: []
    });

    assert(res.coverMedia, 'Cover media present');
    assert(res.galleryMedia.length === 2, `Expected 2 gallery images, got ${res.galleryMedia.length}`);
    assert(res.gallery.length === 3, `Expected total gallery of 3, got ${res.gallery.length}`);

    const urls = res.gallery.map(g => g.url);
    assert.strictEqual(new Set(urls).size, 3, 'All 3 Bali image URLs must be unique');
  });

  await runTest('Unmapped fantasy destination resolves gracefully with 0 gallery images', async () => {
    const res = await resolveItineraryMedia({
      destination: 'AtlantisFantasyRealm99',
      locationName: 'Underwater Palace',
      excludeAssetIds: []
    });

    assert(res.coverMedia, 'Neutral fallback cover present');
    assert.strictEqual(res.matchLevel, 'FALLBACK_UNMAPPED', 'Flagged as FALLBACK_UNMAPPED');
    assert.strictEqual(res.galleryMedia.length, 0, 'Unmapped location must have 0 gallery images to prevent fake stock fabrication');
    assert.strictEqual(res.gallery.length, 1, 'Gallery has only the 1 neutral cover');
  });

  console.log('\n👉 SUITE 3: Multi-Day Batch Resolution & Repetition Avoidance');

  await runTest('Multi-day batch resolution eliminates cross-day image repetition', async () => {
    const days = [
      { day: 1, title: 'Arrival & Shillong Walk', locationName: 'Shillong' },
      { day: 2, title: 'Cherrapunji Waterfalls Trek', locationName: 'Nohkalikai Falls' },
      { day: 3, title: 'Dawki Crystal Clear River', locationName: 'Dawki' }
    ];

    const resolved = await batchResolveItineraryMedia(days, 'Meghalaya');
    assert.strictEqual(resolved.length, 3, 'Resolved 3 days');

    // Collect all URLs across all 3 days
    const allCoverUrls = resolved.map(d => d.coverMedia.url);
    const uniqueCoverUrls = new Set(allCoverUrls);
    assert.strictEqual(uniqueCoverUrls.size, 3, 'All 3 day cover URLs must be distinct');

    // All days have valid galleries
    for (const d of resolved) {
      assert(d.galleryMedia, `Day ${d.day} has galleryMedia`);
      assert(d.gallery, `Day ${d.day} has gallery`);
      assert(d.gallery.length >= 1, `Day ${d.day} has at least 1 image`);
    }
  });

  await runTest('Batch resolver respects manual selection mode and preserves manual cover & gallery', async () => {
    const manualDay = {
      day: 1,
      title: 'VIP Private Helicopter Transfer',
      locationName: 'Private Helipad',
      mediaSelectionMode: 'MANUAL',
      coverMedia: {
        id: 'manual_heli_001',
        url: 'https://images.unsplash.com/manual-helicopter-view',
        altText: 'Custom Staff Helicopter Asset',
        caption: 'VIP Scenic Flight'
      },
      galleryMedia: [
        {
          id: 'manual_heli_002',
          url: 'https://images.unsplash.com/manual-heli-landing',
          altText: 'Custom Landing',
          caption: 'Landing Pad'
        }
      ]
    };

    const autoDay = {
      day: 2,
      title: 'Palolem Beach Sunset',
      locationName: 'Palolem'
    };

    const resolved = await batchResolveItineraryMedia([manualDay, autoDay], 'Goa');
    assert.strictEqual(resolved[0].mediaSelectionMode, 'MANUAL');
    assert.strictEqual(resolved[0].coverMedia.id, 'manual_heli_001');
    assert.strictEqual(resolved[0].galleryMedia[0].id, 'manual_heli_002');
    assert.strictEqual(resolved[1].mediaSelectionMode, 'AUTO');
    assert(resolved[1].coverMedia.url.includes('unsplash.com'));
  });

  console.log('\n👉 SUITE 4: Nature-First Asset Audit Across Expanded Canonical Pool');

  await runTest('Canonical media pool contains >= 40 verified nature photography assets', () => {
    assert(CANONICAL_MEDIA_ASSETS.length >= 40, `Canonical pool has ${CANONICAL_MEDIA_ASSETS.length} assets (>= 40 required)`);
  });

  await runTest('All canonical assets have valid dimensions, secure URLs, and geographic tags', () => {
    for (const asset of CANONICAL_MEDIA_ASSETS) {
      assert(asset._id, 'Asset has _id');
      assert(asset.storage?.secureUrl?.startsWith('https://'), `Asset ${asset._id} has valid HTTPS secureUrl`);
      assert(asset.storage?.width >= 1200, `Asset ${asset._id} has >= 1200px width`);
      assert(asset.geography?.destination, `Asset ${asset._id} has geography.destination`);
      assert(asset.orientation === 'LANDSCAPE', `Asset ${asset._id} is LANDSCAPE orientation`);
    }
  });

  console.log('\n=============================================================================');
  console.log(`TEST SUMMARY: ${passedTests} PASSED | ${failedTests} FAILED (TOTAL: ${passedTests + failedTests})`);
  console.log('=============================================================================');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runSuite();
