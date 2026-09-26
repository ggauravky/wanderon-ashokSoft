import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from './pdfLayoutConstants.js';

export function validatePdfLayout(element, tolerance = 3) {
  const pages = [...(element?.querySelectorAll('[data-pdf-page="true"]') || [])].map((page, index) => {
    const content = page.querySelector('.pdf-page-content');
    const footer = page.querySelector('.pdf-running-footer');
    const contentBottom = content && !page.classList.contains('quotation-pdf-page--cover')
      ? Math.max(0, ...[...content.children].map((child) => child.offsetTop + Math.max(child.offsetHeight, child.scrollHeight))) : 0;
    const footerCollisionPx = footer ? Math.max(0, contentBottom - footer.offsetTop + 14) : 0;
    const pageSizeMismatchPx = Math.max(Math.abs(page.clientWidth - PAGE_WIDTH_PX), Math.abs(page.clientHeight - PAGE_HEIGHT_PX));
    const verticalOverflowPx = Math.max(0, page.scrollHeight - page.clientHeight, (content?.scrollHeight || 0) - (content?.clientHeight || 0), footerCollisionPx);
    const horizontalOverflowPx = Math.max(0, page.scrollWidth - page.clientWidth, (content?.scrollWidth || 0) - (content?.clientWidth || 0));
    return {
      pageNumber: index + 1,
      title: page.dataset.pageTitle || `Page ${index + 1}`,
      template: page.dataset.template || '',
      verticalOverflowPx,
      footerCollisionPx,
      horizontalOverflowPx,
      pageSizeMismatchPx
    };
  });
  return { valid: pages.length > 0 && pages.every((page) => page.verticalOverflowPx <= tolerance && page.horizontalOverflowPx <= tolerance && page.pageSizeMismatchPx <= tolerance), pages };
}

export function assertNoPdfOverflow(element, tolerance = 3) {
  const report = validatePdfLayout(element, tolerance);
  if (report.valid) return report;
  const page = report.pages.find((item) => item.verticalOverflowPx > tolerance || item.horizontalOverflowPx > tolerance || item.pageSizeMismatchPx > tolerance);
  const error = new Error(`PDF layout overflow on ${page?.template || 'template'} page ${page?.pageNumber || '?'} (${page?.title || 'Untitled page'}).`);
  error.code = 'PDF_LAYOUT_OVERFLOW';
  error.page = page;
  throw error;
}

export async function preparePdfAssets(element, { timeoutMs = 15000, onProgress } = {}) {
  const started = Date.now();
  const deadline = started + timeoutMs;
  let fontsReady = !document.fonts?.ready;
  if (document.fonts?.ready) {
    await Promise.race([document.fonts.ready.then(() => { fontsReady = true; }), new Promise((resolve) => setTimeout(resolve, Math.min(5000, timeoutMs)))]);
  }
  let pending = [];
  do {
    pending = [...element.querySelectorAll('[data-pdf-document="loading"], [data-pdf-image="loading"]')];
    if (!pending.length) break;
    onProgress?.({ stage: 'assets', message: `Preparing ${element.querySelectorAll('img[data-pdf-image]').length} images and ${element.querySelectorAll('[data-pdf-document]').length} travel documents...` });
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  pending.filter((item) => item.tagName === 'IMG').forEach((img) => img.dispatchEvent(new Event('error')));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const images = [...element.querySelectorAll('[data-pdf-image]')];
  const documents = [...element.querySelectorAll('[data-pdf-document]')];
  return {
    totalImages: images.length,
    loadedImages: images.filter((img) => img.dataset.pdfImage === 'ready' && (img.tagName !== 'IMG' || (img.complete && img.naturalWidth > 0))).length,
    failedImages: element.querySelectorAll('[data-pdf-image="failed"]').length,
    documentsPrepared: documents.filter((item) => item.dataset.pdfDocument !== 'loading').length,
    documentPreviewFailures: documents.filter((item) => item.dataset.pdfDocument === 'failed').length,
    fontsReady,
    durationMs: Date.now() - started
  };
}
