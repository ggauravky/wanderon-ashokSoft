import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read mockData.js file to extract UPCOMING_TRIPS
const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');
const mockDataContent = fs.readFileSync(mockDataPath, 'utf8');

// Parse UPCOMING_TRIPS using dynamic evaluation or regex extraction
// Let's import directly via esm or use a small regex/eval sandbox
async function auditTrips() {
  console.log('🔍 --- AUDITING 50 TRIPS TAXONOMY & ACTUAL DATA --- 🔍\n');

  // Load trips from frontend mockData
  const fileUrl = 'file:///' + mockDataPath.replace(/\\/g, '/');
  const mockModule = await import(fileUrl);
  const trips = mockModule.UPCOMING_TRIPS || [];

  console.log(`Total Trips Found: ${trips.length}\n`);

  const destinations = {};
  const categories = {};
  const tagsMap = {};
  const durations = {};
  const priceRanges = { 'Under ₹15k': 0, '₹15k - ₹25k': 0, '₹25k - ₹40k': 0, 'Above ₹40k (Luxury/Intl)': 0 };
  const countries = { India: 0, International: 0 };
  const internationalDestinations = {};
  const indiaDestinations = {};

  trips.forEach((t, index) => {
    // 1. Destination & Country classification
    const dest = t.destination || t.location || 'Unknown';
    destinations[dest] = (destinations[dest] || 0) + 1;

    const isIntl = ['Bali', 'Vietnam', 'Dubai', 'Thailand', 'Sri Lanka', 'Bhutan', 'Europe', 'Georgia', 'Indonesia', 'UAE'].some(
      c => (t.location && t.location.includes(c)) || (t.destination && t.destination.includes(c)) || (t.country && t.country.includes(c))
    );

    if (isIntl) {
      countries.International++;
      internationalDestinations[dest] = (internationalDestinations[dest] || 0) + 1;
    } else {
      countries.India++;
      indiaDestinations[dest] = (indiaDestinations[dest] || 0) + 1;
    }

    // 2. Category
    const cat = t.category || 'Uncategorized';
    categories[cat] = (categories[cat] || 0) + 1;

    // 3. Tags
    (t.tags || []).forEach(tag => {
      tagsMap[tag] = (tagsMap[tag] || 0) + 1;
    });

    // 4. Duration
    const dur = t.duration || 'Unknown';
    durations[dur] = (durations[dur] || 0) + 1;

    // 5. Price range
    const p = t.price || 0;
    if (p < 15000) priceRanges['Under ₹15k']++;
    else if (p <= 25000) priceRanges['₹15k - ₹25k']++;
    else if (p <= 40000) priceRanges['₹25k - ₹40k']++;
    else priceRanges['Above ₹40k (Luxury/Intl)']++;
  });

  console.log('📌 COUNTRIES BREAKDOWN:');
  console.table(countries);

  console.log('\n📌 TOP INDIA DESTINATIONS:');
  console.table(indiaDestinations);

  console.log('\n📌 INTERNATIONAL DESTINATIONS:');
  console.table(internationalDestinations);

  console.log('\n📌 RECORDED CATEGORIES IN DATA:');
  console.table(categories);

  console.log('\n📌 TOP 20 TAGS FREQUENCIES:');
  const sortedTags = Object.entries(tagsMap).sort((a, b) => b[1] - a[1]);
  console.table(Object.fromEntries(sortedTags.slice(0, 20)));

  console.log('\n📌 PRICE RANGES:');
  console.table(priceRanges);

  console.log('\n📌 DURATIONS SPREAD:');
  console.table(durations);
}

auditTrips().catch(console.error);
