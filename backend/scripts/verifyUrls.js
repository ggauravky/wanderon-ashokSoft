import https from 'https';
import { CANONICAL_MEDIA_ASSETS } from '../data/canonicalMediaAssets.js';

async function verifyAllUrls() {
  console.log('Testing HTTP status of all ' + CANONICAL_MEDIA_ASSETS.length + ' seeded assets:');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < CANONICAL_MEDIA_ASSETS.length; i++) {
    const a = CANONICAL_MEDIA_ASSETS[i];
    const url = a.storage?.secureUrl;
    try {
      const res = await new Promise((resolve, reject) => {
        const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 8000 }, (r) => {
          resolve(r);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
      });

      if (res.statusCode >= 200 && res.statusCode < 400) {
        console.log(`  [${i+1}/${CANONICAL_MEDIA_ASSETS.length}] ${res.statusCode} OK: ${a.title} (${a.geography.destination} - ${a.geography.poi || a.geography.locality})`);
        successCount++;
      } else {
        console.error(`  [${i+1}/${CANONICAL_MEDIA_ASSETS.length}] ${res.statusCode} FAILED: ${a.title} -> ${url}`);
        failCount++;
      }
    } catch (err) {
      console.error(`  [${i+1}/${CANONICAL_MEDIA_ASSETS.length}] ERROR: ${a.title} -> ${err.message}`);
      failCount++;
    }
  }

  console.log(`\nRESULT: ${successCount} valid, ${failCount} failed.`);
  process.exit(failCount > 0 ? 1 : 0);
}

verifyAllUrls();
