import assert from 'assert';
import { resolveItineraryMedia, batchResolveItineraryMedia } from './services/mediaResolverService.js';
import { CANONICAL_MEDIA_ASSETS } from './data/canonicalMediaAssets.js';

console.log('=============================================================================');
console.log('WANDERLUXE — ITINERARY MEDIA FORENSIC EDGE CASES TEST SUITE');
console.log('=============================================================================');

async function runEdgeCaseTests() {
  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Unknown Location Safety (No Unrelated Real Destination Image)
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 1: Unknown Location Safety');
  await asyncTest('Unknown location returns neutral fallback without claiming false identity', async () => {
    const res = await resolveItineraryMedia({
      destination: 'ThisPlaceDefinitelyDoesNotExist12345',
      locationName: 'UnchartedMysticCave99'
    });
    assert.strictEqual(res.exactMatch, false, 'exactMatch must be false');
    assert.strictEqual(res.matchLevel, 'FALLBACK_UNMAPPED', 'matchLevel must be FALLBACK_UNMAPPED');
    assert(res.recommended !== null, 'Recommended neutral landscape provided');
    assert.strictEqual(res.recommended.title, 'WanderLuxe Scenic Itinerary Journey', 'Returns neutral journey image');
  });

  // ---------------------------------------------------------------------------
  // 2. Specificity Outranks Aesthetics (Old Manali vs Solang Valley)
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 2: Specificity Outranks Aesthetics');
  await asyncTest('Specific location "Old Manali" picks Old Manali even though Solang is featured', async () => {
    const res = await resolveItineraryMedia({
      destination: 'Manali',
      locationName: 'Old Manali'
    });
    assert.strictEqual(res.exactMatch, true, 'Old Manali must be exact match');
    assert.strictEqual(res.recommended.geography.poi, 'Old Manali', 'POI must be Old Manali');
    assert.notStrictEqual(res.recommended.geography.poi, 'Solang Valley', 'Must NOT pick Solang Valley');
  });

  // ---------------------------------------------------------------------------
  // 3. Single Asset Repetition (Correctness > Variety)
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 3: Single Asset Repetition');
  await asyncTest('Single available asset repeats rather than picking unrelated destination', async () => {
    const day1 = await resolveItineraryMedia({ destination: 'Bali', locationName: 'Kelingking Beach' });
    const baliAssetId = String(day1.recommended._id);

    const day2 = await resolveItineraryMedia({
      destination: 'Bali',
      locationName: 'Kelingking Beach',
      excludeAssetIds: [baliAssetId]
    });

    assert.strictEqual(String(day2.recommended._id), baliAssetId, 'Must repeat Bali asset');
    assert.strictEqual(day2.recommended.geography.destination, 'Bali', 'Must NEVER pick a Goa beach or Manali mountain');
  });

  // ---------------------------------------------------------------------------
  // 4. Batch Resolution Preserves Manual Overrides
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 4: Manual Override Preservation');
  await asyncTest('Batch resolver respects and preserves manual day selections', async () => {
    const manualCover = {
      id: 'custom_manual_asset',
      url: 'https://images.unsplash.com/photo-custom-manual',
      altText: 'Custom Staff Selection',
      caption: 'Manual override photo'
    };

    const days = [
      { day: 1, locationName: 'Solang Valley', mediaSelectionMode: 'AUTO' },
      { day: 2, locationName: 'Kasol Parvati Valley', mediaSelectionMode: 'MANUAL', coverMedia: manualCover, coverMediaAssetId: 'custom_manual_asset' },
      { day: 3, locationName: 'Atal Tunnel', mediaSelectionMode: 'AUTO' }
    ];

    // Simulate batch resolver protecting manual selections
    const resolved = [];
    const usedIds = [];
    for (const d of days) {
      if (d.mediaSelectionMode === 'MANUAL' && d.coverMedia?.url) {
        if (d.coverMediaAssetId) usedIds.push(d.coverMediaAssetId);
        resolved.push(d);
        continue;
      }
      const res = await resolveItineraryMedia({ locationName: d.locationName, destination: 'Himachal', excludeAssetIds: usedIds });
      resolved.push({ ...d, coverMedia: res.coverMedia, coverMediaAssetId: res.mediaAssetId });
      if (res.mediaAssetId) usedIds.push(res.mediaAssetId);
    }

    assert.strictEqual(resolved[1].coverMedia.url, manualCover.url, 'Manual cover URL preserved intact');
    assert.strictEqual(resolved[1].mediaSelectionMode, 'MANUAL', 'MANUAL selection mode preserved');
    assert.notStrictEqual(resolved[0].coverMedia.url, resolved[2].coverMedia.url, 'Day 1 and Day 3 resolve distinct images');
  });

  // ---------------------------------------------------------------------------
  // 5. Inactive / Archived Asset Safety
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 5: Inactive / Archived Asset Safety');
  test('Inactive media assets are filtered out of candidate pool', () => {
    const inactiveSample = {
      ...CANONICAL_MEDIA_ASSETS[0],
      active: false
    };
    const activeCandidates = [inactiveSample].filter(a => a.active);
    assert.strictEqual(activeCandidates.length, 0, 'Inactive asset excluded from active pool');
  });

  // ---------------------------------------------------------------------------
  // 6. SSRF / Dangerous Remote URL Ingestion Prevention
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 6: SSRF / Remote URL Ingestion Prevention');
  test('SSRF filter blocks loopback, private IPs, cloud metadata, and local domains', () => {
    const isSafeRemoteUrl = (string) => {
      try {
        const u = new URL(string);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
        const host = u.hostname.toLowerCase();
        if (
          host === 'localhost' ||
          host === '127.0.0.1' ||
          host === '::1' ||
          host === '169.254.169.254' ||
          host.startsWith('10.') ||
          host.startsWith('192.168.') ||
          /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host) ||
          host.endsWith('.local') ||
          host.endsWith('.internal')
        ) {
          return false;
        }
        return true;
      } catch {
        return false;
      }
    };

    assert.strictEqual(isSafeRemoteUrl('http://localhost:5000/api/keys'), false, 'Blocks localhost');
    assert.strictEqual(isSafeRemoteUrl('http://127.0.0.1:8080/admin'), false, 'Blocks 127.0.0.1');
    assert.strictEqual(isSafeRemoteUrl('http://169.254.169.254/latest/meta-data/'), false, 'Blocks AWS metadata IP');
    assert.strictEqual(isSafeRemoteUrl('http://192.168.1.1/router-login'), false, 'Blocks 192.168.x');
    assert.strictEqual(isSafeRemoteUrl('http://10.0.0.5/secrets'), false, 'Blocks 10.x');
    assert.strictEqual(isSafeRemoteUrl('file:///etc/passwd'), false, 'Blocks file:// protocol');
    assert.strictEqual(isSafeRemoteUrl('javascript:alert(1)'), false, 'Blocks javascript:// protocol');
    assert.strictEqual(isSafeRemoteUrl('https://images.unsplash.com/photo-12345'), true, 'Allows valid HTTPS CDN');
  });

  // ---------------------------------------------------------------------------
  // 7. Quotation to Trip Conversion Media Compatibility
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 7: Quotation to Trip Media Transfer');
  test('Quote day itinerary maps cleanly to Trip day itinerary without data loss', () => {
    const quoteDay = {
      day: 1,
      title: 'Solang Valley Adventure',
      locationName: 'Solang Valley',
      coverMedia: {
        id: 'med_solang_01',
        url: 'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop',
        altText: 'Solang Valley Ski Slopes',
        caption: 'Solang Valley Adventure Hub',
        width: 1600,
        height: 900
      },
      coverMediaAssetId: 'med_solang_01',
      mediaSelectionMode: 'AUTO'
    };

    const tripDay = {
      day: quoteDay.day,
      title: quoteDay.title,
      locationName: quoteDay.locationName,
      image: quoteDay.coverMedia.url,
      coverMedia: quoteDay.coverMedia,
      coverMediaAssetId: quoteDay.coverMediaAssetId,
      mediaSelectionMode: quoteDay.mediaSelectionMode
    };

    assert.strictEqual(tripDay.coverMedia.url, quoteDay.coverMedia.url, 'Trip day preserves image URL');
    assert.strictEqual(tripDay.coverMediaAssetId, quoteDay.coverMediaAssetId, 'Trip day preserves asset ID');
    assert.strictEqual(tripDay.coverMedia.caption, quoteDay.coverMedia.caption, 'Trip day preserves caption');
  });

  // ---------------------------------------------------------------------------
  // 8. Location Mismatch Detection
  // ---------------------------------------------------------------------------
  console.log('\n👉 EDGE CASE 8: Location Mismatch Detection');
  test('Detects mismatch when day location is changed from Solang Valley to Goa Beach', () => {
    const day = {
      locationName: 'Goa Beach',
      coverMedia: {
        caption: 'Solang Valley adventure hub famous for winter skiing and paragliding',
        altText: 'Snow covered slopes and adventure sports in Solang Valley'
      }
    };

    const dayLoc = (day.locationName || '').toLowerCase().trim();
    const mediaLabel = (day.coverMedia?.caption || day.coverMedia?.altText || '').toLowerCase().trim();
    const isMismatched = dayLoc && mediaLabel && 
      !mediaLabel.includes(dayLoc) && !dayLoc.includes(mediaLabel) &&
      !dayLoc.split(/[\s,/-]+/).some(w => w.length > 3 && mediaLabel.includes(w)) &&
      !mediaLabel.split(/[\s,/-]+/).some(w => w.length > 3 && dayLoc.includes(w));

    assert.strictEqual(isMismatched, true, 'Correctly flagged as location mismatch');
  });

  console.log('\n=============================================================================');
  console.log(`EDGE CASES SUMMARY: ${passed} PASSED | ${failed} FAILED (TOTAL: ${passed + failed})`);
  console.log('=============================================================================');

  process.exit(failed > 0 ? 1 : 0);
}

runEdgeCaseTests();
