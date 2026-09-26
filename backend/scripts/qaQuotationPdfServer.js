import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minimalQuotation } from '../../frontend/src/quotation-v2/__fixtures__/stressQuotation.js';
import { renderQuotationPdf } from '../services/quotationPdfRenderer.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const output = path.join(root, 'tmp', 'pdfs');

process.env.FRONTEND_URL ||= 'http://127.0.0.1:5180';
process.env.QUOTATION_PDF_MEDIA_HOSTS ||= 'res.cloudinary.com';

await mkdir(output, { recursive: true });
const { bytes, pageCount } = await renderQuotationPdf(minimalQuotation, 'journey');
assert.equal(Buffer.from(bytes).subarray(0, 4).toString(), '%PDF');
assert(pageCount > 0);
assert(bytes.length > 10_000);
const target = path.join(output, 'WanderLuxe_server_native_smoke.pdf');
await writeFile(target, bytes);
console.log(`Server-native PDF: ${pageCount} pages, ${bytes.length} bytes, ${target}`);
