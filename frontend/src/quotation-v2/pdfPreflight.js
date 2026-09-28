import { PDF_LAYOUT_TOLERANCE_PX, PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from './pdfLayoutConstants.js';

const offsetWithin = (node, ancestor) => {
  let top = 0;
  let current = node;
  while (current && current !== ancestor) { top += current.offsetTop || 0; current = current.offsetParent; }
  return top;
};

export function validatePdfLayout(element, tolerance = PDF_LAYOUT_TOLERANCE_PX) {
  const pages = [...(element?.querySelectorAll('[data-pdf-page="true"]') || [])].map((page, index) => {
    const content = page.querySelector('.pdf-page-content');
    const header = page.querySelector('.pdf-running-header');
    const footer = page.querySelector('.pdf-running-footer');
    const blocks = [...page.querySelectorAll('[data-pdf-block]')];
    const contentBottom = content && !page.classList.contains('quotation-pdf-page--cover')
      ? Math.max(0, ...blocks.map((child) => offsetWithin(child, page) + Math.max(child.offsetHeight, child.scrollHeight))) : 0;
    const contentTop = blocks.length ? Math.min(...blocks.map((child) => offsetWithin(child, page))) : 0;
    const footerCollisionPx = footer ? Math.max(0, contentBottom - footer.offsetTop + 14) : 0;
    const headerCollisionPx = header && contentTop ? Math.max(0, header.offsetTop + header.offsetHeight + 14 - contentTop) : 0;
    const pageSizeMismatchPx = Math.max(Math.abs(page.clientWidth - PAGE_WIDTH_PX), Math.abs(page.clientHeight - PAGE_HEIGHT_PX));
    const verticalOverflowPx = Math.max(0, page.scrollHeight - page.clientHeight, (content?.scrollHeight || 0) - (content?.clientHeight || 0), footerCollisionPx);
    const horizontalOverflowPx = Math.max(0, page.scrollWidth - page.clientWidth, (content?.scrollWidth || 0) - (content?.clientWidth || 0));
    return {
      pageNumber: index + 1,
      title: page.dataset.pageTitle || `Page ${index + 1}`,
      template: page.dataset.template || '',
      verticalOverflowPx,
      footerCollisionPx,
      headerCollisionPx,
      horizontalOverflowPx,
      pageSizeMismatchPx
    };
  });
  return { valid: pages.length > 0 && pages.every((page) => page.verticalOverflowPx <= tolerance && page.horizontalOverflowPx <= tolerance && page.footerCollisionPx <= tolerance && page.headerCollisionPx <= tolerance && page.pageSizeMismatchPx <= tolerance), pages };
}

export function assertNoPdfOverflow(element, tolerance = PDF_LAYOUT_TOLERANCE_PX) {
  const report = validatePdfLayout(element, tolerance);
  if (report.valid) return report;
  const page = report.pages.find((item) => item.verticalOverflowPx > tolerance || item.horizontalOverflowPx > tolerance || item.footerCollisionPx > tolerance || item.headerCollisionPx > tolerance || item.pageSizeMismatchPx > tolerance);
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
  pending = [...element.querySelectorAll('[data-pdf-document="loading"], [data-pdf-image="loading"]')];
  if (pending.length) {
    const details = pending.slice(0, 6).map((item) => ({
      tag: item.tagName,
      source: item.tagName === 'IMG' ? String(item.currentSrc || item.getAttribute('src') || '').slice(0, 120) : item.querySelector('h3')?.textContent,
      image: item.dataset.pdfImage,
      document: item.dataset.pdfDocument,
      complete: item.tagName === 'IMG' ? item.complete : undefined,
      naturalWidth: item.tagName === 'IMG' ? item.naturalWidth : undefined
    }));
    const error = new Error(`PDF assets did not settle before the ${timeoutMs}ms deadline: ${JSON.stringify(details)}.`);
    error.code = 'PDF_ASSET_TIMEOUT';
    throw error;
  }
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
