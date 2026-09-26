import { PAGE_HEIGHT_PX, PAGE_WIDTH_PX } from './pdfLayoutConstants.js';

export function validatePdfLayout(element, tolerance = 3) {
  const pages = [...(element?.querySelectorAll('[data-pdf-page="true"]') || [])].map((page, index) => {
    const content = page.querySelector('.pdf-page-content');
    const footer = page.querySelector('.pdf-running-footer');
    const contentBottom = content && !page.classList.contains('quotation-pdf-page--cover')
      ? Math.max(0, ...[...content.children].map((child) => child.getBoundingClientRect().bottom)) : 0;
    const footerCollisionPx = footer ? Math.max(0, contentBottom - footer.getBoundingClientRect().top + 14) : 0;
    const verticalOverflowPx = Math.max(0, page.scrollHeight - PAGE_HEIGHT_PX, (content?.scrollHeight || 0) - (content?.clientHeight || 0), footerCollisionPx);
    const horizontalOverflowPx = Math.max(0, page.scrollWidth - PAGE_WIDTH_PX, (content?.scrollWidth || 0) - (content?.clientWidth || 0));
    return {
      pageNumber: index + 1,
      title: page.dataset.pageTitle || `Page ${index + 1}`,
      template: page.dataset.template || '',
      verticalOverflowPx,
      footerCollisionPx,
      horizontalOverflowPx
    };
  });
  return { valid: pages.length > 0 && pages.every((page) => page.verticalOverflowPx <= tolerance && page.horizontalOverflowPx <= tolerance), pages };
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
    pending = [...element.querySelectorAll('[data-pdf-document="loading"], img[data-pdf-image="loading"]')];
    if (!pending.length) break;
    onProgress?.({ stage: 'assets', message: `Preparing ${element.querySelectorAll('img[data-pdf-image]').length} images and ${element.querySelectorAll('[data-pdf-document]').length} travel documents...` });
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);
  pending.filter((item) => item.tagName === 'IMG').forEach((img) => img.dispatchEvent(new Event('error')));
  await new Promise((resolve) => requestAnimationFrame(resolve));
  const images = [...element.querySelectorAll('img[data-pdf-image]')];
  const documents = [...element.querySelectorAll('[data-pdf-document]')];
  return {
    totalImages: images.length + element.querySelectorAll('[data-pdf-image="failed"]').length,
    loadedImages: images.filter((img) => img.complete && img.naturalWidth > 0).length,
    failedImages: element.querySelectorAll('[data-pdf-image="failed"]').length,
    documentsPrepared: documents.filter((item) => item.dataset.pdfDocument !== 'loading').length,
    documentPreviewFailures: documents.filter((item) => item.dataset.pdfDocument === 'failed').length,
    fontsReady,
    durationMs: Date.now() - started
  };
}
