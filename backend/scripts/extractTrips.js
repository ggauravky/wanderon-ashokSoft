import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mockDataPath = path.join(__dirname, '../../frontend/src/constants/mockData.js');
const targetPath = path.join(__dirname, '../data/trips.json');

try {
  const content = fs.readFileSync(mockDataPath, 'utf8');
  const startIndex = content.indexOf('export const UPCOMING_TRIPS = [');
  const endIndex = content.indexOf('export const DESTINATIONS = [');

  if (startIndex !== -1 && endIndex !== -1) {
    const rawArray = content.slice(startIndex + 'export const UPCOMING_TRIPS = '.length, endIndex).trim();
    // Strip trailing semicolon if present
    const cleanArray = rawArray.replace(/;\s*$/, '');
    const fn = new Function(`return ${cleanArray}`);
    const trips = fn();
    fs.writeFileSync(targetPath, JSON.stringify(trips, null, 2), 'utf8');
    console.log(`✅ Successfully extracted ${trips.length} trip packages to backend/data/trips.json`);
  } else {
    console.error('Indices not found:', { startIndex, endIndex });
  }
} catch (err) {
  console.error('Extraction error:', err.message);
}
