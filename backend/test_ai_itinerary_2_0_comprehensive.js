import dns from 'dns';
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

import { auditAndSanitizeItinerary } from './services/itineraryFeasibilityEngine.js';
import { generateCopilotProposal } from './services/itineraryCopilotService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✕ FAIL: ${message}`);
    failed++;
  }
}

async function runComprehensiveTests() {
  console.log('\n=============================================================');
  console.log('  WANDERLUXE AI PLANNER 2.0 COMPREHENSIVE TEST SUITE');
  console.log('=============================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Canonical Base Itinerary Structure
  // -------------------------------------------------------------------------
  console.log('--- TEST 1: Base Itinerary & Feasibility Engine Audit ---');
  const baseItinerary = {
    destination: 'Meghalaya',
    title: '5-Day Meghalaya Expedition',
    totalEstimatedCost: 48000,
    pace: 'Balanced',
    days: [
      {
        day: 1,
        title: 'Day 1: Double Decker Living Root Bridge & Nohkalikai',
        morning: [
          { activity: 'Double Decker Living Root Bridge Trek', description: 'Trek down 3,500 stairs into Nongriat canyon' }
        ],
        afternoon: [
          { activity: 'Nohkalikai Falls Excursion', description: 'Waterfall plunge view' },
          { activity: 'Secondary Cave Crawl', description: 'Tight limestone squeeze' }
        ],
        evening: [
          { activity: 'Sunset Walk', description: 'Cafe stop' }
        ]
      },
      {
        day: 2,
        title: 'Day 2: Dawki & Krang Suri',
        morning: [
          { activity: 'Umngot Crystal River Boating', description: 'Transparent river boating in Dawki' }
        ],
        afternoon: [
          { activity: 'Krang Suri Waterfalls', description: 'Natural turquoise pool' }
        ],
        evening: [
          { activity: 'Double Decker Living Root Bridge Trek', description: 'Duplicate root bridge visit' }
        ]
      }
    ]
  };

  // Test with senior / mobility constraints
  const seniorPreferences = {
    destination: 'Meghalaya',
    origin: 'Lucknow',
    pace: 'Relaxed',
    travelers: { adults: 2, children: 0, infants: 0, seniors: 1 },
    mobilityConstraints: ['Avoid steep stairs', 'Senior-friendly pace'],
    mustInclude: ['Dawki'],
    avoid: ['Secondary Cave Crawl'],
    budgetAmount: 45000
  };

  const { sanitizedItinerary, healthReport } = auditAndSanitizeItinerary(baseItinerary, seniorPreferences);

  assert(healthReport.isFeasible === true, 'Feasibility report returns isFeasible = true');
  assert(sanitizedItinerary.pace === 'Relaxed', 'Itinerary pace calibrated to Relaxed');
  
  // Verify strenuous 3,500-step trek was replaced for senior
  const day1MorningAct = sanitizedItinerary.days[0].morning[0].activity;
  assert(!day1MorningAct.toLowerCase().includes('double decker'), `Strenuous 3,500-step trek replaced with: "${day1MorningAct}"`);

  // Verify Day 1 morning incorporates arrival buffer from Lucknow
  const day1MorningDesc = sanitizedItinerary.days[0].morning[0].description;
  assert(day1MorningDesc.includes('Lucknow'), 'Day 1 morning calibrated with origin arrival buffer from Lucknow');

  // Verify avoid list dropped "Secondary Cave Crawl"
  const day1AfternoonActs = sanitizedItinerary.days[0].afternoon.map(a => a.activity);
  assert(!day1AfternoonActs.includes('Secondary Cave Crawl'), 'Avoid list constraint ("Secondary Cave Crawl") strictly dropped');

  // Verify duplicate visit on Day 2 was resolved
  const day2EveningAct = sanitizedItinerary.days[1].evening[0].activity;
  assert(!day2EveningAct.toLowerCase().includes('double decker living root bridge trek'), `Duplicate visit on Day 2 evening resolved: "${day2EveningAct}"`);

  // Verify must-include check passed
  const dawkiCheck = healthReport.checks.find(c => c.id === 'must_include_dawki');
  assert(dawkiCheck && dawkiCheck.status === 'pass', 'Must-include check for "Dawki" verified and passed');

  // -------------------------------------------------------------------------
  // TEST 2: AI Copilot Conversational Diff Engine
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: AI Copilot Conversational Diff Engine ---');
  
  // Prompt A: "Make Day 2 less tiring"
  const proposalA = generateCopilotProposal(baseItinerary, 'Make Day 2 less tiring');
  assert(proposalA.success === true, 'Copilot successfully parsed "Make Day 2 less tiring"');
  assert(proposalA.targetDay === 2, `Target day correctly identified as Day ${proposalA.targetDay}`);
  assert(proposalA.changes.some(c => c.type === 'remove'), 'Generated removal diff for tiring activity');
  assert(proposalA.estimatedEffect.includes('less driving') || proposalA.estimatedEffect.includes('driving'), `Calculated estimated effect: "${proposalA.estimatedEffect}"`);

  // Prompt B: "Add more waterfalls"
  const proposalB = generateCopilotProposal(baseItinerary, 'Add more waterfalls and nature views');
  assert(proposalB.changes.some(c => c.type === 'add' && c.text.toLowerCase().includes('cascade')), 'Generated addition diff for natural waterfall viewpoint');

  // Prompt C: "Keep trip below 40k"
  const proposalC = generateCopilotProposal(baseItinerary, 'Keep the trip below ₹40,000');
  assert(proposalC.patch.totalEstimatedCost < 48000, `Recalibrated budget from ₹48,000 to ₹${proposalC.patch.totalEstimatedCost.toLocaleString()}`);

  // -------------------------------------------------------------------------
  // TEST 3: Live API Endpoints (POST /api/ai/generate & POST /api/ai/edit-plan)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Live Backend HTTP Endpoints (Port 5000) ---');
  try {
    const genRes = await fetch('http://localhost:5000/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        destination: 'Meghalaya',
        days: 5,
        travelers: 2,
        pace: 'Balanced',
        mood: 'Adventure',
        origin: 'Delhi NCR',
        customPreferences: 'Vegetarian meals, avoid long strenuous climbs'
      })
    });

    const genData = await genRes.json();
    assert(genRes.status === 200 && genData.success === true, 'POST /api/ai/generate returned 200 OK with success = true');
    assert(genData.data.days.length === 5, 'Generated itinerary contains exactly 5 days');
    assert(genData.data.healthReport && genData.data.healthReport.isFeasible, 'Generated itinerary includes verified healthReport');
    
    // Check Day 1 has 3-image nature gallery
    const day1 = genData.data.days[0];
    assert(day1.coverMedia && typeof day1.coverMedia.url === 'string' && day1.coverMedia.url.startsWith('http'), 'Day 1 coverMedia has valid URL');
    assert(Array.isArray(day1.galleryMedia) && day1.galleryMedia.length === 2, `Day 1 galleryMedia contains exactly 2 supporting images (found ${day1.galleryMedia?.length})`);

    // Test Copilot API endpoint
    const editRes = await fetch('http://localhost:5000/api/ai/edit-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itinerary: genData.data,
        refinement: 'Make Day 2 less tiring'
      })
    });

    const editData = await editRes.json();
    assert(editRes.status === 200 && editData.success === true, 'POST /api/ai/edit-plan returned 200 OK with structured diff');
    assert(editData.data.summary.includes('Day 2') || editData.data.targetDay === 2, 'Copilot diff targeted Day 2');

    // Test Save API endpoint
    const saveRes = await fetch('http://localhost:5000/api/ai/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Meghalaya 2.0 Comprehensive Test Plan',
        destination: 'Meghalaya',
        duration: 5,
        travelers: 2,
        days: genData.data.days
      })
    });

    const saveData = await saveRes.json();
    assert(saveRes.status === 201 && saveData.success === true, `POST /api/ai/save returned 201 Created (ID: ${saveData.data?._id})`);
    assert(saveData.data?.days[0]?.galleryMedia?.length === 2, 'Saved document in MongoDB preserved 2 supporting gallery images on Day 1');

  } catch (netErr) {
    console.error('HTTP Endpoint test error:', netErr.message);
    assert(false, `Live backend test threw error: ${netErr.message}`);
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n=============================================================');
  console.log(`  COMPREHENSIVE TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runComprehensiveTests();
