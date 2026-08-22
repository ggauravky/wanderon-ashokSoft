import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const jsonPath = path.resolve(__dirname, '../frontend/src/data/travelKnowledge.json');
const rawData = fs.readFileSync(jsonPath, 'utf8');
const data = JSON.parse(rawData);

console.log('================================================================');
console.log('WANDERLUXE TRAVEL KNOWLEDGE BASE VALIDATION & INTEGRITY SUITE');
console.log('================================================================\n');

let errors = [];
let warnings = [];

// 1. Check Root Properties
if (!data.version) errors.push('Missing "version" field in root JSON');
if (!Array.isArray(data.destinations)) errors.push('Missing or invalid "destinations" array');
if (!Array.isArray(data.travelStyles)) errors.push('Missing or invalid "travelStyles" array');
if (!data.seasons || typeof data.seasons !== 'object') errors.push('Missing or invalid "seasons" object');
if (!Array.isArray(data.occasions)) errors.push('Missing or invalid "occasions" array');
if (!data.packingRules || typeof data.packingRules !== 'object') errors.push('Missing or invalid "packingRules" object');
if (!data.aiPlanner || typeof data.aiPlanner !== 'object') errors.push('Missing or invalid "aiPlanner" object');

// 2. Validate Destinations
const destinationSlugs = new Set();
const destinationIds = new Set();
const travelStyleIds = new Set(data.travelStyles?.map(s => s.id) || []);
const validSeasonKeys = new Set(['spring', 'summer', 'monsoon', 'autumn', 'winter']);

data.destinations?.forEach((dest, idx) => {
  const prefix = `Destination #${idx + 1} (${dest.name || 'unnamed'}):`;
  if (!dest.id) errors.push(`${prefix} Missing "id"`);
  if (!dest.slug) errors.push(`${prefix} Missing "slug"`);
  if (!dest.name) errors.push(`${prefix} Missing "name"`);
  if (!dest.region) errors.push(`${prefix} Missing "region"`);
  if (!dest.summary) errors.push(`${prefix} Missing "summary"`);
  if (!dest.heroImage) errors.push(`${prefix} Missing "heroImage"`);

  if (destinationIds.has(dest.id)) errors.push(`${prefix} Duplicate ID "${dest.id}"`);
  if (destinationSlugs.has(dest.slug)) errors.push(`${prefix} Duplicate slug "${dest.slug}"`);

  destinationIds.add(dest.id);
  destinationSlugs.add(dest.slug);

  // Validate seasons
  if (!Array.isArray(dest.seasons) || dest.seasons.length === 0) {
    errors.push(`${prefix} Must have at least one season defined`);
  } else {
    dest.seasons.forEach(s => {
      if (!validSeasonKeys.has(s)) errors.push(`${prefix} Invalid season reference "${s}"`);
    });
  }

  // Validate travel styles
  if (!Array.isArray(dest.travelStyles) || dest.travelStyles.length === 0) {
    errors.push(`${prefix} Must have at least one travelStyle defined`);
  } else {
    dest.travelStyles.forEach(ts => {
      if (!travelStyleIds.has(ts)) errors.push(`${prefix} Invalid travelStyle reference "${ts}"`);
    });
  }

  // Validate weather suitability
  if (!dest.weatherSuitability) {
    errors.push(`${prefix} Missing "weatherSuitability"`);
  } else {
    ['sunny', 'cloudy', 'rainy', 'snow'].forEach(cond => {
      if (typeof dest.weatherSuitability[cond] !== 'number') {
        errors.push(`${prefix} Missing or non-numeric weatherSuitability.${cond}`);
      }
    });
  }
});

// 3. Validate Travel Styles & Lucide Icon Names
const validIcons = new Set([
  'Mountain', 'Palmtree', 'Trees', 'Waves', 'Compass', 
  'Heart', 'Award', 'Coffee', 'Sun', 'CloudRain', 'Luggage'
]);

data.travelStyles?.forEach(style => {
  if (!style.id) errors.push(`TravelStyle missing "id"`);
  if (!style.label) errors.push(`TravelStyle (${style.id}) missing "label"`);
  if (!style.icon) errors.push(`TravelStyle (${style.id}) missing "icon"`);
  else if (!validIcons.has(style.icon)) {
    warnings.push(`TravelStyle (${style.id}) icon "${style.icon}" should be in recognized Lucide icon map`);
  }
});

// 4. Validate Seasons
for (const [seasonKey, seasonObj] of Object.entries(data.seasons || {})) {
  if (!seasonObj.months || !Array.isArray(seasonObj.months) || seasonObj.months.length === 0) {
    errors.push(`Season "${seasonKey}" missing "months" array`);
  }
  if (!seasonObj.name) errors.push(`Season "${seasonKey}" missing "name"`);
  if (!seasonObj.weatherAdvice) errors.push(`Season "${seasonKey}" missing "weatherAdvice"`);
}

// 5. Validate Occasions
data.occasions?.forEach(occ => {
  if (!occ.id) errors.push(`Occasion missing "id"`);
  if (!occ.name) errors.push(`Occasion (${occ.id}) missing "name"`);
  if (typeof occ.startMonth !== 'number' || typeof occ.endMonth !== 'number') {
    errors.push(`Occasion (${occ.id}) missing valid startMonth / endMonth`);
  }
});

// 6. 50-Trip Catalog Mapping Diagnostic
let mappedTrips = 0;
let unmappedTrips = [];

try {
  const mockDataFile = fs.readFileSync(
    path.resolve(__dirname, '../frontend/src/constants/mockData.js'),
    'utf8'
  );
  
  // Extract UPCOMING_TRIPS array items
  const matchLocations = mockDataFile.match(/location:\s*['"`]([^'"`]+)['"`]/g) || [];
  const locations = matchLocations.map(m => m.replace(/location:\s*['"`]/, '').replace(/['"`]/, '').trim());

  locations.forEach(loc => {
    const locLower = loc.toLowerCase();
    const isMapped = Array.from(destinationSlugs).some(slug => {
      const name = slug.replace(/-/g, ' ');
      return locLower.includes(name) || locLower.includes(slug) || 
        (slug === 'bali' && (locLower.includes('bali') || locLower.includes('indonesia') || locLower.includes('gili') || locLower.includes('nusa penida'))) ||
        (slug === 'himachal-pradesh' && (locLower.includes('himachal') || locLower.includes('manali') || locLower.includes('kasol') || locLower.includes('spiti') || locLower.includes('jibhi') || locLower.includes('bir billing'))) || 
        (slug === 'uttarakhand' && (locLower.includes('uttarakhand') || locLower.includes('rishikesh') || locLower.includes('kedarnath') || locLower.includes('chopta') || locLower.includes('auli'))) || 
        (slug === 'kashmir' && (locLower.includes('kashmir') || locLower.includes('srinagar') || locLower.includes('gulmarg') || locLower.includes('pahalgam'))) || 
        (slug === 'ladakh' && (locLower.includes('ladakh') || locLower.includes('leh') || locLower.includes('pangong') || locLower.includes('nubra')));
    });

    if (isMapped) {
      mappedTrips++;
    } else {
      unmappedTrips.push(loc);
    }
  });
} catch (diagErr) {
  warnings.push('Trip diagnostic parse warning: ' + diagErr.message);
}

// REPORT SUMMARY
console.log(`✓ Total Destinations Validated: ${data.destinations?.length || 0}`);
console.log(`✓ Total Travel Styles Validated: ${data.travelStyles?.length || 0}`);
console.log(`✓ Total Seasons Validated: ${Object.keys(data.seasons || {}).length}`);
console.log(`✓ Total Occasions Validated: ${data.occasions?.length || 0}`);
console.log(`✓ Catalog Trip Coverage Diagnostic: ${mappedTrips} mapped / ${unmappedTrips.length} unmapped`);

if (unmappedTrips.length > 0) {
  console.log(`⚠️ Unmapped locations:`, [...new Set(unmappedTrips)]);
}

if (warnings.length > 0) {
  console.log('\nWarnings:');
  warnings.forEach(w => console.log(' ⚠️ ' + w));
}

if (errors.length > 0) {
  console.error('\n❌ VALIDATION FAILED with errors:');
  errors.forEach(e => console.error(' ✗ ' + e));
  process.exit(1);
} else {
  console.log('\n✅ ALL TRAVEL KNOWLEDGE DATA VALIDATION CHECKS PASSED (0 Errors)\n');
  process.exit(0);
}
