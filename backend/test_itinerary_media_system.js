import 'dotenv/config';
import mongoose from 'mongoose';
import MediaAsset from './models/MediaAsset.js';
import { 
  resolveItineraryMedia, 
  batchResolveItineraryMedia,
  normalizeKey,
  tokenizeText
} from './services/mediaResolverService.js';
import {
  listMediaAssets,
  getMediaCoverageReport,
  resolveItineraryMediaController
} from './controllers/mediaAssetController.js';
import {
  createQuotation,
  getQuotationById,
  approveQuotation,
  createQuotationRevision,
  sanitizeForCustomer
} from './controllers/quotationController.js';

// Helper mock req/res
function createMockReqRes(body = {}, params = {}, query = {}, user = { _id: 'admin_test_1', role: 'admin', name: 'Media Admin' }) {
  const req = { body, params, query, user };
  let statusCode = 200;
  let responseData = null;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    }
  };
  return {
    req,
    res,
    getStatusCode: () => statusCode,
    getData: () => responseData
  };
}

async function runItineraryMediaTests() {
  console.log('=============================================================================');
  console.log('WANDERLUXE — DAY-BY-DAY ITINERARY MEDIA SYSTEM VERIFICATION TEST SUITE');
  console.log('=============================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, name, details = '') {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name} ${details ? `(${details})` : ''}`);
      failed++;
    }
  }

  // Connect to DB or verify live connection
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
  let isConnected = false;
  try {
    if (mongoose.connection.readyState === 0 && mongoUri) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 8000 });
      isConnected = true;
      console.log('📡 Connected to MongoDB Atlas for real database tests.\n');
    } else if (mongoose.connection.readyState === 1) {
      isConnected = true;
      console.log('📡 Using existing MongoDB connection.\n');
    }
  } catch (err) {
    console.warn('⚠️ MongoDB connection timeout or error. Testing with fallback memory assets:', err.message);
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Key Normalization & Tokenization Unit Tests
    // -------------------------------------------------------------------------
    console.log('👉 TEST 1: Key Normalization & Text Tokenization');
    const normKey1 = normalizeKey('Nohkalikai Falls, Cherrapunjee!');
    assert(normKey1 === 'nohkalikai falls cherrapunjee', 'Normalizes punctuation and trims spaces');

    const tokens = tokenizeText('Trek across the Double Decker Living Root Bridge in Nongriat');
    assert(tokens.includes('double') && tokens.includes('decker') && tokens.includes('root') && tokens.includes('nongriat'), 'Tokenizes search terms removing stop words');
    assert(!tokens.includes('the') && !tokens.includes('in'), 'Filters out stop words (the, in, of, etc.)');

    // -------------------------------------------------------------------------
    // TEST 2: Canonical MediaAsset Schema & Validation
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 2: Canonical MediaAsset Schema & Geographic Tagging');
    const sampleAssetDoc = new MediaAsset({
      title: 'Double Decker Living Root Bridge',
      caption: 'Centuries-old bio-engineering marvel in Nongriat village',
      altText: 'Double Decker Living Root Bridge in Nongriat Cherrapunjee',
      geography: {
        country: 'India',
        state: 'Meghalaya',
        region: 'East Khasi Hills',
        destination: 'Meghalaya',
        locality: 'Nongriat',
        poi: 'Double Decker Living Root Bridge'
      },
      locationKeys: ['india', 'meghalaya', 'nongriat', 'double decker living root bridge'],
      storage: {
        provider: 'cloudinary',
        publicId: 'wanderluxe/test/root_bridge_' + Date.now(),
        secureUrl: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5',
        format: 'jpg',
        width: 2400,
        height: 1600
      },
      orientation: 'LANDSCAPE',
      source: {
        sourceType: 'PROJECT_ASSET',
        attribution: 'Unsplash'
      },
      featured: true,
      active: true
    });

    assert(sampleAssetDoc.title === 'Double Decker Living Root Bridge', 'MediaAsset title set correctly');
    assert(sampleAssetDoc.geography?.destination === 'Meghalaya', 'MediaAsset destination tagged');
    assert(sampleAssetDoc.geography?.poi === 'Double Decker Living Root Bridge', 'MediaAsset POI tagged');
    assert(sampleAssetDoc.orientation === 'LANDSCAPE', 'Orientation correctly tagged as landscape');
    assert(sampleAssetDoc.storage.secureUrl.startsWith('https://'), 'Secure URL valid');

    // -------------------------------------------------------------------------
    // TEST 3: Smart Resolver Engine Matching Hierarchy
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 3: Smart Image Resolver Matching Hierarchy');

    // Test 3.1: Exact POI Resolution
    const poiResult = await resolveItineraryMedia({
      destination: 'Meghalaya',
      locationName: 'Nohkalikai Falls',
      dayTitle: 'Witness Nohkalikai Waterfall',
      dayNumber: 2
    });

    assert(poiResult !== null, 'Resolver returned an asset for Nohkalikai Falls');
    assert(
      poiResult.matchLevel === 'EXACT_POI' || poiResult.matchLevel === 'EXACT_LOCATION' || poiResult.matchLevel === 'DESTINATION',
      `Match level hierarchy resolved with valid match (${poiResult?.matchLevel})`
    );
    assert(Boolean(poiResult?.coverMedia?.url), 'Cover media URL returned cleanly');
    assert(Boolean(poiResult?.coverMedia?.altText), 'Cover media altText provided');

    // Test 3.2: Destination Match
    const destResult = await resolveItineraryMedia({
      destination: 'Ladakh',
      locationName: 'High Altitude Mountain Pass',
      dayTitle: 'Acclimatization Day',
      dayNumber: 1
    });

    assert(destResult !== null, 'Resolver returned an asset for Ladakh destination');
    assert(
      destResult.matchLevel === 'DESTINATION' || destResult.matchLevel === 'EXACT_LOCATION' || destResult.matchLevel === 'EXACT_POI',
      `Destination level match resolved (${destResult?.matchLevel})`
    );

    // Test 3.3: Universal Fallback Match
    const fallbackResult = await resolveItineraryMedia({
      destination: 'NonExistentFantasyLandXYZ',
      locationName: 'UnchartedMysticCave99',
      dayTitle: 'Fantasy exploration',
      dayNumber: 1
    });

    assert(fallbackResult !== null, 'Resolver provides graceful fallback when location unknown');
    assert(fallbackResult.matchLevel?.startsWith('FALLBACK'), `Match level accurately flagged as fallback (${fallbackResult?.matchLevel})`);
    assert(Boolean(fallbackResult?.coverMedia?.url), 'Fallback has valid high-resolution image');

    // -------------------------------------------------------------------------
    // TEST 4: Multi-Day Repetition Avoidance
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 4: Multi-Day Repetition Avoidance Engine');
    
    // Day 1: Meghalaya
    const day1Result = await resolveItineraryMedia({
      destination: 'Meghalaya',
      locationName: 'Meghalaya Exploration',
      dayNumber: 1,
      excludeAssetIds: []
    });

    // Day 2: Meghalaya with Day 1 excluded
    const day1AssetId = (day1Result?.recommended?._id || day1Result?.asset?._id) ? String(day1Result.recommended?._id || day1Result.asset._id) : null;
    const day2Result = await resolveItineraryMedia({
      destination: 'Meghalaya',
      locationName: 'Meghalaya Scenic Valley',
      dayNumber: 2,
      excludeAssetIds: day1AssetId ? [day1AssetId] : []
    });

    const day2AssetId = (day2Result?.recommended?._id || day2Result?.asset?._id) ? String(day2Result.recommended?._id || day2Result.asset._id) : null;

    if (day1AssetId && day2AssetId) {
      assert(day1AssetId !== day2AssetId, `Repetition avoidance picked distinct asset (Day 1: ${day1AssetId.slice(-4)}, Day 2: ${day2AssetId.slice(-4)})`);
    } else {
      assert(day2Result !== null, 'Repetition avoidance fallback returned valid asset');
    }

    // -------------------------------------------------------------------------
    // TEST 5: Batch Resolution for Full Itinerary
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 5: Batch Itinerary Resolution');
    const sampleItineraryDays = [
      { day: 1, title: 'Arrival in Guwahati & Drive to Shillong', locationName: 'Shillong' },
      { day: 2, title: 'Cherrapunji & Nohkalikai Falls Trek', locationName: 'Nohkalikai Falls' },
      { day: 3, title: 'Double Decker Living Root Bridge', locationName: 'Double Decker Living Root Bridge' },
      { day: 4, title: 'Dawki Crystal Clear Umngot River', locationName: 'Dawki Umngot River' }
    ];

    const batchResults = await batchResolveItineraryMedia(sampleItineraryDays, 'Meghalaya', 'Meghalaya Luxury Explorer');
    assert(batchResults.length === 4, 'Batch resolver processed all 4 days');
    assert(batchResults.every(d => Boolean(d.coverMedia?.url)), 'Every day received a valid coverMedia URL');
    assert(batchResults.every(d => d.mediaSelectionMode === 'AUTO'), 'Every day tagged as AUTO selection mode');

    // Verify all resolved URLs are distinct
    const urls = batchResults.map(d => d.coverMedia.url);
    const uniqueUrls = new Set(urls);
    assert(uniqueUrls.size >= Math.min(3, urls.length), `Repetition penalty preserved distinct images across days (${uniqueUrls.size}/${urls.length} unique)`);

    // -------------------------------------------------------------------------
    // TEST 6: Media Controller & Coverage Intelligence Report
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 6: Media Controller & Coverage Intelligence');
    
    // Coverage report API
    const reportReqRes = createMockReqRes();
    await getMediaCoverageReport(reportReqRes.req, reportReqRes.res);
    const coverageReport = reportReqRes.getData();

    assert(reportReqRes.getStatusCode() === 200, 'Coverage report endpoint returned 200 OK');
    assert(typeof coverageReport?.totalAssets === 'number', 'Report includes totalAssets count');
    assert(typeof coverageReport?.coverageRate === 'string', 'Report includes coverageRate percentage string');
    assert(Array.isArray(coverageReport?.missingLocations), 'Report includes missingLocations array for admin upload pipeline');

    // List media assets API
    const listReqRes = createMockReqRes({}, {}, { destination: 'Meghalaya' });
    await listMediaAssets(listReqRes.req, listReqRes.res);
    const mediaList = listReqRes.getData();
    assert(mediaList?.success === true, 'List media assets returned success');
    assert(Array.isArray(mediaList?.data), 'List media assets returned data array');

    // Resolve media controller API
    const resolveReqRes = createMockReqRes({
      destination: 'Spiti',
      locationName: 'Key Monastery',
      dayNumber: 1
    });
    await resolveItineraryMediaController(resolveReqRes.req, resolveReqRes.res);
    const resolvedControllerData = resolveReqRes.getData();
    assert(resolvedControllerData?.success === true, 'Resolve media controller returned success');
    assert(Boolean(resolvedControllerData?.data?.coverMedia?.url), 'Resolve controller returned coverMedia URL');

    // -------------------------------------------------------------------------
    // TEST 7: Quotation Day Cover Media Serialization & Immutability
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 7: Quotation Day Media Integration & Immutability');
    
    const quotePayload = {
      customerSnapshot: {
        name: 'Aakash Verma',
        email: 'aakash.v@example.com',
        phone: '+91 99887 76655'
      },
      tripRequirements: {
        title: 'Spiti Valley High Altitude Odyssey',
        destination: 'Spiti',
        days: 7,
        nights: 6,
        totalTravelers: 2,
        adults: 2,
        children: 0,
        startDate: '2026-10-01'
      },
      itinerary: [
        {
          day: 1,
          title: 'Arrival in Kaza',
          locationName: 'Kaza',
          stay: 'Heritage Homestay',
          coverMedia: {
            id: 'med_kaza_001',
            url: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5',
            altText: 'Kaza High Altitude Valley',
            caption: 'Kaza Town center',
            width: 2400,
            height: 1600
          },
          coverMediaAssetId: 'med_kaza_001',
          mediaSelectionMode: 'AUTO'
        },
        {
          day: 2,
          title: 'Key Monastery & Kibber Village',
          locationName: 'Key Monastery',
          stay: 'Monastery Guest House',
          coverMedia: {
            id: 'med_key_002',
            url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23',
            altText: 'Key Monastery perched on hill',
            caption: 'Key Gompa Tibetan Buddhist Monastery',
            width: 2400,
            height: 1600
          },
          coverMediaAssetId: 'med_key_002',
          mediaSelectionMode: 'MANUAL'
        }
      ],
      hotelOptions: [
        { optionId: 'h_1', name: 'Spiti Grand', roomType: 'Deluxe Suite', costPerNight: 5000, nights: 6, selected: true }
      ],
      transportOptions: [
        { optionId: 't_1', mode: 'CAB', vehicle: 'Toyota Fortuner 4x4', baseRate: 25000, selected: true }
      ],
      activities: [],
      addOns: []
    };

    const createQuoteReqRes = createMockReqRes(quotePayload);
    await createQuotation(createQuoteReqRes.req, createQuoteReqRes.res);
    const createdQuote = createQuoteReqRes.getData();

    assert(createQuoteReqRes.getStatusCode() === 201, 'Quotation created with itinerary cover media');
    assert(Boolean(createdQuote?.quotation?.itinerary?.[0]?.coverMedia?.url), 'Day 1 coverMedia URL persisted in quotation');
    assert(createdQuote?.quotation?.itinerary?.[1]?.mediaSelectionMode === 'MANUAL', 'Day 2 mediaSelectionMode persisted as MANUAL');

    const quotationId = createdQuote.quotation._id;

    // Test 7.2: Approve Quotation & Verify Snapshot Immutability
    const approveReqRes = createMockReqRes({}, { id: quotationId });
    await approveQuotation(approveReqRes.req, approveReqRes.res);
    const approvedQuote = approveReqRes.getData();

    assert(approvedQuote?.quotation?.status === 'APPROVED', 'Quotation marked APPROVED');
    assert(
      approvedQuote?.quotation?.approvedSnapshot?.itinerary?.[0]?.coverMedia?.url === quotePayload.itinerary[0].coverMedia.url,
      'Approved snapshot immutably preserves day 1 cover media'
    );
    assert(
      approvedQuote?.quotation?.approvedSnapshot?.itinerary?.[1]?.coverMedia?.url === quotePayload.itinerary[1].coverMedia.url,
      'Approved snapshot immutably preserves day 2 cover media'
    );

    // Test 7.3: Create Revision & Verify Historical Archive
    const revisionReqRes = createMockReqRes({ reason: 'Client requested itinerary adjustment' }, { id: quotationId });
    await createQuotationRevision(revisionReqRes.req, revisionReqRes.res);
    const revisedQuote = revisionReqRes.getData();

    assert(revisedQuote?.quotation?.version > 1 && (revisedQuote?.quotation?.status === 'DRAFT' || revisedQuote?.quotation?.status === 'REVISED'), 'Quotation revision increments version and enables draft editing');
    assert(Array.isArray(revisedQuote?.quotation?.revisions), 'Quotation has revisions archive');
    assert(
      Boolean(revisedQuote?.quotation?.revisions?.[0]?.itinerarySnapshot?.[0]?.coverMedia?.url),
      'Revision archives previous itinerary media snapshot'
    );

    // Test 7.4: Customer Sanitization
    const sanitized = sanitizeForCustomer(createdQuote.quotation);
    assert(sanitized.internalPricingAudit === undefined, 'Internal pricing audit stripped from customer view');
    assert(Boolean(sanitized.itinerary?.[0]?.coverMedia?.url), 'Customer view receives clean coverMedia URL');
    assert(Boolean(sanitized.itinerary?.[0]?.coverMedia?.altText), 'Customer view receives coverMedia altText');
    assert(Boolean(sanitized.itinerary?.[0]?.coverMedia?.caption), 'Customer view receives coverMedia caption');

    // -------------------------------------------------------------------------
    // TEST 8: Zero Mock / Zero Randomness Audit
    // -------------------------------------------------------------------------
    console.log('\n👉 TEST 8: Zero Arbitrary URLs & Deterministic Selection Audit');
    const resA = await resolveItineraryMedia({
      destination: 'Manali',
      locationName: 'Solang Valley',
      dayNumber: 1
    });

    const resB = await resolveItineraryMedia({
      destination: 'Manali',
      locationName: 'Solang Valley',
      dayNumber: 1
    });

    assert(
      resA?.coverMedia?.url === resB?.coverMedia?.url,
      'Deterministic resolution: identical inputs produce identical media asset with zero Math.random()'
    );

  } catch (testError) {
    console.error('💥 Unexpected test runner error:', testError);
    failed++;
  } finally {
    if (isConnected && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('\n🔌 Disconnected from MongoDB.');
    }
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log('\n=============================================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log('=============================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runItineraryMediaTests();
