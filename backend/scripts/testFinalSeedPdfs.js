import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-chromium';
import connectDB from '../config/db.js';
import Quotation from '../models/Quotation.js';
import QuotationRevision from '../models/QuotationRevision.js';
import { buildPublicRevisionDto } from '../services/quotationV2Service.js';
import { buildQuotationPresentationModel } from '../../frontend/src/quotation-v2/buildQuotationPresentationModel.js';
import { DEMO_CUSTOMER_EMAIL } from './seedMaximumQuotationDemo.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const outputDir = path.join(root, 'tmp', 'final_submission_pdfs');
await mkdir(outputDir, { recursive: true });

async function main() {
  await connectDB();
  const quotation = await Quotation.findOne({ 'customerSnapshot.email': DEMO_CUSTOMER_EMAIL });
  if (!quotation) throw new Error('Seeded quotation not found! Run seedMaximumQuotationDemo first.');
  const revision = await QuotationRevision.findById(quotation.currentRevisionId);
  if (!revision) throw new Error('Current revision not found!');

  console.log(`Found seeded quotation: ${quotation.quotationNumber} (${quotation._id})`);
  console.log(`Revision: ${revision._id}, status: ${revision.status}, price: INR ${revision.finalCustomerPrice}`);

  const share = {
    _id: revision._id,
    templateKey: 'journey',
    allowPdfDownload: true,
    allowAttachments: true,
    requireEmailVerification: false,
    approvalEnabled: false,
    recipientEmail: DEMO_CUSTOMER_EMAIL,
    isActive: true
  };
  const publicDto = buildPublicRevisionDto({ quotation, revision, share });

  const templates = ['signature_luxe', 'journey', 'minimal'];
  const results = {};

  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  for (const templateKey of templates) {
    console.log(`\n--- Generating PDF for template: ${templateKey} ---`);
    const page = await browser.newPage({ viewport: { width: 1100, height: 1300 } });

    const browserErrors = [];
    page.on('console', (msg) => {
      console.log(`[BROWSER ${msg.type()}]:`, msg.text());
      if (msg.type() === 'error') browserErrors.push(msg.text());
    });
    page.on('pageerror', (err) => browserErrors.push(err.message));

    // Allow static assets, cloudinary, unsplash, pexels, data, blob
    await page.route('**/*', (route) => {
      const reqUrl = route.request().url();
      if (
        reqUrl.startsWith('data:') ||
        reqUrl.startsWith('blob:') ||
        reqUrl.includes('localhost') ||
        reqUrl.includes('127.0.0.1') ||
        reqUrl.includes('res.cloudinary.com') ||
        reqUrl.includes('images.unsplash.com') ||
        reqUrl.includes('images.pexels.com') ||
        reqUrl.includes('cdnjs.cloudflare.com')
      ) {
        return route.continue();
      }
      return route.abort();
    });

    await page.addInitScript(({ quot, tpl }) => {
      window.__WANDERLUXE_RENDER_DATA__ = { quotation: quot, templateKey: tpl };
    }, { quot: publicDto, tpl: templateKey });

    const targetUrl = `${frontendUrl}/internal/quotation-pdf`;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });

    await page.waitForFunction(() => window.__WANDERLUXE_PDF_READY__ === true || Boolean(window.__WANDERLUXE_PDF_ERROR__), null, { timeout: 45000 });

    const renderError = await page.evaluate(() => window.__WANDERLUXE_PDF_ERROR__);
    if (renderError) throw new Error(`Render error for ${templateKey}: ${renderError}`);

    const report = await page.evaluate(() => ({
      layout: window.__WANDERLUXE_PDF_REPORT__?.layout,
      assets: window.__WANDERLUXE_PDF_REPORT__?.assets
    }));

    const pageCount = report.layout?.pages?.length || 0;
    const isValid = report.layout?.valid === true;

    // Check overflow
    const maxVOverflow = Math.max(...(report.layout?.pages?.map(p => p.verticalOverflowPx) || [0]));
    const maxHOverflow = Math.max(...(report.layout?.pages?.map(p => p.horizontalOverflowPx) || [0]));

    console.log(`Template ${templateKey}: ${pageCount} pages, valid: ${isValid}, maxVOverflow: ${maxVOverflow}px, maxHOverflow: ${maxHOverflow}px`);
    console.log(`Assets: loadedImages=${report.assets?.loadedImages}, failedImages=${report.assets?.failedImages}, docsPrepared=${report.assets?.documentsPrepared}, docFailures=${report.assets?.documentPreviewFailures}`);

    // Generate actual PDF bytes
    const pdfBytes = await page.pdf({
      format: 'A4',
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const pdfPath = path.join(outputDir, `WanderLuxe_Final_Seed_${templateKey}.pdf`);
    await writeFile(pdfPath, pdfBytes);
    console.log(`Saved PDF to ${pdfPath} (${pdfBytes.length} bytes)`);

    // Extract text content from the rendered page stack
    const renderedText = await page.locator('.quotation-pdf-stack').innerText();

    results[templateKey] = {
      pageCount,
      isValid,
      maxVOverflow,
      maxHOverflow,
      renderedText,
      bytesLength: pdfBytes.length
    };

    await page.close();
  }

  await browser.close();

  console.log('\n========================================');
  console.log('FINAL SEED PDF GENERATION RESULTS');
  console.log('========================================');
  console.log(`Signature Luxe:   ${results.signature_luxe.pageCount} pages (valid: ${results.signature_luxe.isValid})`);
  console.log(`Journey Journal:  ${results.journey.pageCount} pages (valid: ${results.journey.isValid})`);
  console.log(`Expedition Dossier: ${results.minimal.pageCount} pages (valid: ${results.minimal.isValid})`);

  // Assertions: Signature > Journey > Minimal
  assert(
    results.signature_luxe.pageCount > results.journey.pageCount,
    `Signature (${results.signature_luxe.pageCount}) must be > Journey (${results.journey.pageCount})`
  );
  assert(
    results.journey.pageCount > results.minimal.pageCount,
    `Journey (${results.journey.pageCount}) must be > Minimal/Dossier (${results.minimal.pageCount})`
  );

  console.log('\n[PAGE COUNT RELATIONSHIP]: PASS (Signature > Journey > Dossier)');

  // Text content assertions
  for (const tpl of templates) {
    const text = results[tpl].renderedText;
    assert(text.includes(quotation.quotationNumber), `${tpl} missing quotation number`);
    assert(text.includes('Arjun Mehra'), `${tpl} missing customer name`);
    assert(text.includes('Himachal Pradesh'), `${tpl} missing destination`);
    assert(text.includes('96,500'), `${tpl} missing final price`);

    // Verify NO internal cost leaks
    assert(!text.includes('supplierCost'), `${tpl} leaked supplierCost`);
    assert(!text.includes('totalInternalCost'), `${tpl} leaked totalInternalCost`);
    assert(!text.includes('Internal Demo Supplier Invoice'), `${tpl} leaked internal invoice`);
    assert(!text.includes('[DEMO] Mountain Transfer Partner'), `${tpl} leaked internal partner name`);
  }
  console.log('[SECURITY & ACCURACY AUDIT]: PASS (No internal leaks; customer facts preserved)');

  // Long narrative check:
  // Day 1 long description: "Begin with a morning train to Chandigarh and continue by private road transfer to Old Manali. The schedule keeps mountain driving in daylight where practical."
  const longSentence = 'The schedule keeps mountain driving in daylight where practical.';
  assert(results.signature_luxe.renderedText.includes(longSentence), 'Signature must contain full day narrative');
  assert(!results.minimal.renderedText.includes(longSentence), 'Dossier must NOT contain full long narrative');
  console.log('[CONTENT DIFFERENTIATION AUDIT]: PASS (Dossier summarizes narrative; Signature is full)');

  process.exit(0);
}

main().catch((err) => {
  console.error('\nFAILURE:', err);
  process.exit(1);
});
