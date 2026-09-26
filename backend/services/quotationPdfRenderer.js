const RENDER_TIMEOUT_MS = 45000;

const withTimeout = async (promise, code, timeoutMs = RENDER_TIMEOUT_MS) => {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(Object.assign(new Error(code), { code })), timeoutMs); })
    ]);
  } finally { clearTimeout(timer); }
};

export const serverPdfEnabled = () => process.env.QUOTATION_SERVER_PDF_ENABLED === 'true';

export function pdfRenderOrigins() {
  const frontend = new URL(process.env.FRONTEND_URL);
  const api = new URL(process.env.QUOTATION_PDF_API_ORIGIN || frontend.origin);
  if (process.env.NODE_ENV === 'production' && [frontend, api].some((url) => url.protocol !== 'https:')) {
    throw new Error('PDF render origins must use HTTPS in production.');
  }
  const mediaHosts = String(process.env.QUOTATION_PDF_MEDIA_HOSTS || 'res.cloudinary.com')
    .split(',').map((host) => host.trim().toLowerCase()).filter(Boolean);
  return { frontend, allowedOrigins: new Set([frontend.origin, api.origin]), mediaHosts: new Set(mediaHosts) };
}

export function isPdfAssetAllowed(rawUrl, { allowedOrigins, mediaHosts }) {
  try {
    const url = new URL(rawUrl);
    if (allowedOrigins.has(url.origin)) return true;
    return url.protocol === 'https:' && mediaHosts.has(url.hostname.toLowerCase());
  } catch { return false; }
}

export async function renderQuotationPdf(quotation, templateKey) {
  const { frontend, ...allowlist } = pdfRenderOrigins();
  let browser;
  try {
    let chromium;
    try { ({ chromium } = await import('playwright-chromium')); }
    catch { throw Object.assign(new Error('Chromium renderer is unavailable.'), { code: 'PDF_BROWSER_UNAVAILABLE' }); }
    browser = await withTimeout(chromium.launch({
      headless: true,
      ...(process.env.QUOTATION_PDF_CHROMIUM_EXECUTABLE ? { executablePath: process.env.QUOTATION_PDF_CHROMIUM_EXECUTABLE } : {}),
      ...(process.env.QUOTATION_PDF_DISABLE_SANDBOX === 'true' ? { args: ['--no-sandbox'] } : {})
    }), 'PDF_BROWSER_UNAVAILABLE', 20000);
    const context = await browser.newContext({ viewport: { width: 1100, height: 1300 }, serviceWorkers: 'block' });
    const page = await context.newPage();
    page.setDefaultTimeout(RENDER_TIMEOUT_MS);
    await page.route('**/*', (route) => {
      const request = route.request();
      if (['data:', 'blob:'].some((prefix) => request.url().startsWith(prefix)) || isPdfAssetAllowed(request.url(), allowlist)) return route.continue();
      return route.abort();
    });
    await page.addInitScript((data) => { window.__WANDERLUXE_RENDER_DATA__ = data; }, { quotation, templateKey });
    await page.goto(new URL('/internal/quotation-pdf', frontend).toString(), { waitUntil: 'domcontentloaded', timeout: RENDER_TIMEOUT_MS });
    await withTimeout(page.waitForFunction(() => window.__WANDERLUXE_PDF_READY__ === true || Boolean(window.__WANDERLUXE_PDF_ERROR__), { timeout: RENDER_TIMEOUT_MS }), 'PDF_RENDER_TIMEOUT');
    const report = await page.evaluate(() => ({ ready: window.__WANDERLUXE_PDF_READY__, error: window.__WANDERLUXE_PDF_ERROR__, layout: window.__WANDERLUXE_PDF_REPORT__?.layout }));
    if (!report.ready || !report.layout?.valid || report.error) {
      const error = new Error(report.error || 'Quotation PDF page overflowed.');
      error.code = 'PDF_LAYOUT_OVERFLOW';
      throw error;
    }
    const bytes = await withTimeout(page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true, outline: true, margin: { top: '0', right: '0', bottom: '0', left: '0' } }), 'PDF_RENDER_TIMEOUT');
    return { bytes, pageCount: report.layout.pages.length };
  } finally {
    if (browser) await browser.close();
  }
}
