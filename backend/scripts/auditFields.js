import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');

async function auditFields() {
  const fileUrl = 'file:///' + mockDataPath.replace(/\\/g, '/');
  const mockModule = await import(fileUrl);
  const trips = mockModule.UPCOMING_TRIPS || [];

  const sample = trips[0];
  console.log('Sample Keys in Trip Object:', Object.keys(sample));

  // Check how many have specific fields
  const fieldCounts = {};
  const sampleValues = {};

  ['category', 'mood', 'tripType', 'travelMood', 'groupType', 'difficulty', 'grade', 'ageGroup', 'startingPoint', 'destination', 'tags'].forEach(k => {
    fieldCounts[k] = trips.filter(t => t[k] !== undefined && t[k] !== null).length;
    const vals = new Set(trips.map(t => Array.isArray(t[k]) ? t[k].join(', ') : t[k]).filter(Boolean));
    sampleValues[k] = Array.from(vals).slice(0, 10);
  });

  console.log('\nField Presence (out of 50):');
  console.table(fieldCounts);

  console.log('\nSample Values per Field:');
  console.log(sampleValues);
}

auditFields().catch(console.error);
