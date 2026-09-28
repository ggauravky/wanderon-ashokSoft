import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright-chromium';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'tmp', 'pdfs');
const base = process.env.PDF_QA_BASE_URL || 'http://127.0.0.1:5180';
const fixtures = (process.env.PDF_QA_FIXTURES || 'minimal,normal,stress,ticketHeavy,fiveDay,extreme').split(',').map((item) => item.trim());
const templates = (process.env.PDF_QA_TEMPLATES || 'signature_luxe,journey,minimal').split(',').map((item) => item.trim());
const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);

await mkdir(output, { recursive: true });
const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });
try {
  const sample = await browser.newPage({ viewport: { width: 520, height: 780 } });
  await sample.setContent('<html><body style="font:18px Arial;padding:48px"><h1>SAMPLE TRAVEL TICKET</h1><p>Delhi to Leh</p><p>Reference: REF-000</p></body></html>');
  const pdfTicket = await sample.pdf({ format: 'A4' });
  const portraitTicket = await sample.screenshot({ type: 'png' });
  await sample.setViewportSize({ width: 1000, height: 500 });
  const landscapeTicket = await sample.screenshot({ type: 'png' });
  await sample.setViewportSize({ width: 400, height: 1600 });
  const tallTicket = await sample.screenshot({ type: 'png' });
  await sample.close();

  for (const fixture of fixtures) {
    for (const template of templates) {
      const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
      try {
        const browserErrors = [];
        page.on('console', (message) => { if (message.type() === 'error') browserErrors.push(message.text()); });
        page.on('pageerror', (error) => browserErrors.push(error.message));
        page.on('response', (response) => { if (response.status() >= 400) browserErrors.push(`${response.status()} ${response.url()}`); });
        page.on('requestfailed', (request) => browserErrors.push(`${request.failure()?.errorText || 'request failed'} ${request.url()}`));
        await page.route('https://example.com/**', (route) => {
          const requestUrl = new URL(route.request().url());
          if (requestUrl.pathname.includes('broken-image')) return route.fulfill({ status: 404, body: 'missing' });
          if (requestUrl.searchParams.has('invalid')) return route.fulfill({ status: 200, contentType: 'application/pdf', body: 'not a pdf', headers: { 'access-control-allow-origin': '*' } });
          const isPdf = requestUrl.pathname.endsWith('.pdf') && !requestUrl.searchParams.has('invalid');
          const imageTicket = requestUrl.pathname.includes('landscape-ticket') ? landscapeTicket : requestUrl.pathname.includes('tall-ticket') ? tallTicket : portraitTicket;
          return route.fulfill({ status: 200, contentType: isPdf ? 'application/pdf' : 'image/png', body: isPdf ? pdfTicket : imageTicket,
            headers: { 'access-control-allow-origin': '*' } });
        });
        await page.goto(`${base}/__quotation-pdf-qa?fixture=${fixture}&template=${template}`, { waitUntil: 'domcontentloaded' });
        try {
          await page.waitForFunction(() => window.__WANDERLUXE_PDF_READY__ === true || Boolean(window.__WANDERLUXE_PDF_ERROR__), null, { timeout: 90000 });
        } catch (waitError) {
          const diagnostic = await page.evaluate(() => ({
            url: location.href,
            title: document.title,
            ready: window.__WANDERLUXE_PDF_READY__,
            error: window.__WANDERLUXE_PDF_ERROR__,
            layoutState: document.querySelector('[data-pdf-layout-state]')?.dataset.pdfLayoutState,
            layoutError: document.querySelector('[data-pdf-layout-state]')?.dataset.pdfLayoutError,
            pages: document.querySelectorAll('[data-pdf-page="true"]').length,
            body: document.body.innerText.slice(0, 500)
          }));
          throw new Error(`${fixture}/${template} did not become ready: ${JSON.stringify(diagnostic)}; ${waitError.message}`);
        }
        const renderError = await page.evaluate(() => window.__WANDERLUXE_PDF_ERROR__);
        assert.equal(renderError, null, `${fixture}/${template}: ${renderError}`);
        const report = await page.evaluate(() => window.__WANDERLUXE_PDF_REPORT__);
        assert(report.layout.valid, `${fixture}/${template} overflow: ${JSON.stringify(report.layout.pages.filter((entry) => entry.verticalOverflowPx > 3 || entry.horizontalOverflowPx > 3))}`);
        assert(report.layout.pages.length > 0);
        const blockIds = await page.locator('[data-pdf-block]').evaluateAll((nodes) => nodes.map((node) => node.dataset.pdfBlock));
        assert.equal(new Set(blockIds).size, blockIds.length, `${fixture}/${template} repeated a PDF block`);
        const emptyPages = await page.locator('[data-pdf-page="true"]:not(.quotation-pdf-page--cover)').evaluateAll((pages) => pages.filter((item) => !item.querySelector('[data-pdf-block]')).length);
        assert.equal(emptyPages, 0, `${fixture}/${template} created an empty page`);
        if (fixture === 'normal') {
          const text = await page.locator('.quotation-pdf-stack').innerText();
          for (const expected of ['Rahul Sharma', 'Ladakh', 'Flight', 'Private', 'Local experience', 'Photography support', 'Confirmed inclusion', 'Expense not included', '2,45,000', 'Payment', 'Advisor']) {
            assert(text.toLowerCase().includes(expected.toLowerCase()), `${fixture}/${template} omitted ${expected}`);
          }
        }
        if (fixture === 'fiveDay') {
          const itineraryBlocks = await page.locator('[data-pdf-block^="itinerary-"]').count();
          assert(itineraryBlocks >= 5, `${template} dropped five-day itinerary content`);
          const perPage = await page.locator('[data-pdf-page="true"]').evaluateAll((pages) => pages.map((item) => item.querySelectorAll('[data-pdf-block^="itinerary-"]').length));
          assert(perPage.some((count) => count >= 2), `${template} did not dynamically share any itinerary page`);
        }
        if (fixture === 'ticketHeavy') {
          const text = await page.locator('.quotation-pdf-stack').innerText();
          assert(!text.includes('Internal supplier invoice'));
          assert(!text.includes('Hidden from PDF'));
          assert.equal(await page.locator('[data-pdf-display="link"] .pdf-document-preview').count(), 0);
          assert(await page.locator('[data-pdf-display="preview"] .pdf-document-preview').count() >= 5);
          assert(report.assets.failedImages > 0, `${template} did not render a broken-image fallback`);
          assert(report.assets.documentPreviewFailures > 0, `${template} did not render a broken-PDF fallback`);
        }
        if (fixture === 'ticketHeavy') assert(report.assets.documentPreviewFailures > 0);
        else assert.equal(report.assets.documentPreviewFailures, 0, `PDF preview errors: ${browserErrors.join(' | ')}`);
        const bytes = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
        assert.equal(bytes.subarray(0, 4).toString(), '%PDF');
        assert(bytes.length > 10000);
        if (['normal', 'stress', 'ticketHeavy', 'fiveDay'].includes(fixture)) {
          await writeFile(path.join(output, `WanderLuxe_${fixture}_${template}.pdf`), bytes);
          await page.locator('[data-pdf-page="true"]').first().screenshot({ path: path.join(output, `WanderLuxe_${fixture}_${template}_cover.png`) });
        }
        if (fixture === 'fiveDay' && template === 'journey') {
          const downloadPromise = page.waitForEvent('download', { timeout: 90000 });
          const resultPromise = page.evaluate(() => window.__WANDERLUXE_RUN_FALLBACK__());
          const [download, fallbackResult] = await Promise.all([downloadPromise, resultPromise]);
          assert(fallbackResult.pages > 0 && fallbackResult.bytes > 10_000);
          await download.saveAs(path.join(output, 'WanderLuxe_browser_fallback_fiveDay_journey.pdf'));
        }
        console.log(`${fixture}/${template}: ${report.layout.pages.length} pages, ${report.assets.loadedImages} images, ${report.assets.documentsPrepared} documents, no measured overflow`);
      } finally { await page.close(); }
    }
  }
} finally { await browser.close(); }
