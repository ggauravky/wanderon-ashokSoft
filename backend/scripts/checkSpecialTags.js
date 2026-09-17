import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');

async function check() {
  const fileUrl = 'file:///' + mockDataPath.replace(/\\/g, '/');
  const mockModule = await import(fileUrl);
  const trips = mockModule.UPCOMING_TRIPS || [];

  const bikeTrips = trips.filter(t => 
    t.title.toLowerCase().includes('bike') || 
    t.title.toLowerCase().includes('roadtrip') || 
    t.overview?.toLowerCase().includes('bike') || 
    (t.tags && t.tags.some(tag => tag.toLowerCase().includes('bike') || tag.toLowerCase().includes('roadtrip')))
  );

  const festivalTrips = trips.filter(t => 
    t.title.toLowerCase().includes('festival') || 
    t.title.toLowerCase().includes('party') || 
    t.overview?.toLowerCase().includes('festival') ||
    (t.tags && t.tags.some(tag => tag.toLowerCase().includes('festival') || tag.toLowerCase().includes('party') || tag.toLowerCase().includes('event')))
  );

  console.log(`Bike / Roadtrip matches: ${bikeTrips.length}`);
  bikeTrips.forEach(t => console.log(`  - ${t.title} (${t.destination})`));

  console.log(`\nFestival / Events matches: ${festivalTrips.length}`);
  festivalTrips.forEach(t => console.log(`  - ${t.title} (${t.destination})`));
}

check().catch(console.error);
