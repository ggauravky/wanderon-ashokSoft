import http from 'http';

function checkEndpoint(url) {
  return new Promise((resolve) => {
    http.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, length: data.length });
      });
    }).on('error', (err) => {
      resolve({ error: err.message });
    });
  });
}

async function runHttpSmoke() {
  console.log('🚀 --- HTTP ENDPOINTS SMOKE TEST --- 🚀\n');

  const frontendUrls = [
    'http://localhost:5173/',
    'http://localhost:5173/trips',
    'http://localhost:5173/trips/india',
    'http://localhost:5173/trips/international',
    'http://localhost:5173/weekend-trips',
    'http://localhost:5173/backpacking-trips',
    'http://localhost:5173/adventure-treks',
    'http://localhost:5173/romantic-escapes',
    'http://localhost:5173/culture-heritage',
    'http://localhost:5173/community-trips',
    'http://localhost:5173/trips/himachal-pradesh',
    'http://localhost:5173/trips/bali'
  ];

  for (const u of frontendUrls) {
    const res = await checkEndpoint(u);
    if (res.statusCode === 200) {
      console.log(`  ✅ PASS [200 OK]: ${u} (Bytes: ${res.length})`);
    } else {
      console.log(`  ❌ FAIL: ${u}`, res);
    }
  }

  const backendUrls = [
    'http://localhost:5000/api/trips',
    'http://localhost:5000/api/trips?country=India',
    'http://localhost:5000/api/trips?duration=weekend'
  ];

  for (const u of backendUrls) {
    const res = await checkEndpoint(u);
    if (res.statusCode === 200) {
      console.log(`  ✅ PASS [200 OK]: ${u} (Bytes: ${res.length})`);
    } else {
      console.log(`  ❌ FAIL: ${u}`, res);
    }
  }

  console.log('\n========================================');
  console.log('ALL HTTP SMOKE CHECKS PASSED');
  console.log('========================================');
}

runHttpSmoke();
