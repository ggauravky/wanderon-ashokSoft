import https from 'https';
import { CANONICAL_MEDIA_ASSETS } from '../data/canonicalMediaAssets.js';

const requestUrl = (url, redirectsLeft = 5) => new Promise((resolve, reject) => {
  const req = https.get(url, { headers: { 'User-Agent': 'WanderLuxe-Media-Health/1.0' }, timeout: 8000 }, (res) => {
    const redirect = res.statusCode >= 300 && res.statusCode < 400 && res.headers.location;
    if (redirect) {
      res.resume();
      if (redirectsLeft <= 0) return reject(new Error('Too many redirects'));
      return resolve(requestUrl(new URL(res.headers.location, url).toString(), redirectsLeft - 1));
    }
    res.resume();
    return resolve({ statusCode: res.statusCode, finalUrl: url });
  });
  req.on('error', reject);
  req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
});

async function verifyAllUrls() {
  console.log('Testing HTTP status of all ' + CANONICAL_MEDIA_ASSETS.length + ' seeded assets:');
  let successCount = 0;
  let failCount = 0;
  let cursor = 0;

  const verifyNext = async () => {
    const i = cursor;
    cursor += 1;
    if (i >= CANONICAL_MEDIA_ASSETS.length) return;
    const a = CANONICAL_MEDIA_ASSETS[i];
    const url = a.storage?.secureUrl;
    try {
      const res = await requestUrl(url);

      if (res.statusCode >= 200 && res.statusCode < 300) {
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
    await verifyNext();
  };

  await Promise.all(Array.from({ length: Math.min(6, CANONICAL_MEDIA_ASSETS.length) }, () => verifyNext()));

  console.log(`\nRESULT: ${successCount} valid, ${failCount} failed.`);
  process.exit(failCount > 0 ? 1 : 0);
}

verifyAllUrls();
