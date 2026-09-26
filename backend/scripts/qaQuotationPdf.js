import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-chromium';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'tmp', 'pdfs');
const base = process.env.PDF_QA_BASE_URL || 'http://127.0.0.1:5180';
const fixtures = (process.env.PDF_QA_FIXTURES || 'stress,minimal,broken').split(',').map((item) => item.trim());
const templates = ['signature_luxe', 'journey', 'minimal'];
const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });
try {
  const sample = await browser.newPage({ viewport: { width: 520, height: 780 } });
  await sample.setContent('<html><body style="font:18px Arial;padding:48px"><h1>SAMPLE TRAVEL TICKET</h1><p>Delhi to Leh</p><p>Reference: REF-000</p></body></html>');
  const pdfTicket = await sample.pdf({ format: 'A4' });
  const imageTicket = await sample.screenshot({ type: 'png' });
  await sample.close();

  for (const fixture of fixtures) {
    for (const template of templates) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      try {
        await page.route('https://example.com/**', (route) => {
          const isPdf = route.request().url().endsWith('.pdf');
          return route.fulfill({ status: 200, contentType: isPdf ? 'application/pdf' : 'image/png', body: isPdf ? pdfTicket : imageTicket,
            headers: { 'access-control-allow-origin': '*' } });
        });
        await page.goto(`${base}/__quotation-pdf-qa?fixture=${fixture}&template=${template}`, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(() => window.__WANDERLUXE_PDF_READY__ === true, { timeout: 45000 });
        const report = await page.evaluate(() => window.__WANDERLUXE_PDF_REPORT__);
        assert(report.layout.valid, `${fixture}/${template} overflow: ${JSON.stringify(report.layout.pages.filter((entry) => entry.verticalOverflowPx > 3 || entry.horizontalOverflowPx > 3))}`);
        assert(report.layout.pages.length > 0);
        if (fixture === 'broken') assert(report.assets.failedImages > 0, `${template} did not render a broken-image fallback`);
        if (fixture === 'stress') {
          assert.equal(report.assets.documentPreviewFailures, 0);
          const bytes = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
          assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
          assert(bytes.length > 10000);
          await writeFile(path.join(output, `WanderLuxe_${fixture}_${template}.pdf`), bytes);
          await page.locator('[data-pdf-page="true"]').first().screenshot({ path: path.join(output, `WanderLuxe_${fixture}_${template}_cover.png`) });
        }
        console.log(`${fixture}/${template}: ${report.layout.pages.length} pages, ${report.assets.loadedImages} images, ${report.assets.documentsPrepared} documents, no measured overflow`);
      } finally { await page.close(); }
    }
  }
} finally { await browser.close(); }
