import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');

async function auditFilterValues() {
  const fileUrl = 'file:///' + mockDataPath.replace(/\\/g, '/');
  const mockModule = await import(fileUrl);
  const trips = mockModule.UPCOMING_TRIPS || [];

  console.log(`Auditing 50 trips for real filter values...\n`);

  const startingPoints = {};
  const nextBatches = {};
  const batchMonths = {};
  const grades = {};
  const destinations = {};
  const priceMinMax = { min: Infinity, max: -Infinity };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  trips.forEach((t) => {
    // Starting Point
    const sp = t.startingPoint || 'Not Specified';
    startingPoints[sp] = (startingPoints[sp] || 0) + 1;

    // Next batch
    if (t.nextBatch) {
      nextBatches[t.nextBatch] = (nextBatches[t.nextBatch] || 0) + 1;
      monthNames.forEach(m => {
        if (t.nextBatch.includes(m)) {
          batchMonths[m] = (batchMonths[m] || 0) + 1;
        }
      });
    }

    // Available batches months
    if (Array.isArray(t.availableBatches)) {
      t.availableBatches.forEach(b => {
        monthNames.forEach(m => {
          if (b.dates && b.dates.includes(m)) {
            batchMonths[m] = (batchMonths[m] || 0) + 1;
          }
        });
      });
    }

    // Grade / Difficulty
    if (t.grade) {
      grades[t.grade] = (grades[t.grade] || 0) + 1;
    }

    // Destination
    if (t.destination) {
      destinations[t.destination] = (destinations[t.destination] || 0) + 1;
    }

    // Price
    if (t.price) {
      if (t.price < priceMinMax.min) priceMinMax.min = t.price;
      if (t.price > priceMinMax.max) priceMinMax.max = t.price;
    }
  });

  console.log('📌 STARTING POINTS / DEPARTURE CITIES:');
  console.table(startingPoints);

  console.log('\n📌 BATCH DEPARTURE MONTHS:');
  console.table(batchMonths);

  console.log('\n📌 DESTINATIONS:');
  console.table(destinations);

  console.log('\n📌 PRICE RANGE:');
  console.log(`Min: ₹${priceMinMax.min.toLocaleString()} - Max: ₹${priceMinMax.max.toLocaleString()}`);

  console.log('\n📌 DIFFICULTY / GRADES:');
  console.table(grades);
}

auditFilterValues().catch(console.error);
