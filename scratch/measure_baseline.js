import { chromium } from 'playwright-chromium';

const base = 'http://localhost:5173';
const fixture = 'stress';
const templates = ['signature_luxe', 'journey', 'minimal'];
const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

async function run() {
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });
  try {
    for (const template of templates) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      await page.goto(`${base}/__quotation-pdf-qa?fixture=${fixture}&template=${template}`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => window.__WANDERLUXE_PDF_READY__ === true || Boolean(window.__WANDERLUXE_PDF_ERROR__), null, { timeout: 60000 });
      const error = await page.evaluate(() => window.__WANDERLUXE_PDF_ERROR__);
      if (error) {
        console.error(`${template} error:`, error);
        continue;
      }
      const report = await page.evaluate(() => window.__WANDERLUXE_PDF_REPORT__);
      const pages = report?.layout?.pages?.length || 0;
      console.log(`BASELINE RESULT: ${template} -> ${pages} pages`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error('Error running baseline:', err);
  process.exit(1);
});
