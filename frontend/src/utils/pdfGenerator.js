import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { preparePdfAssets, validatePdfLayout } from '../quotation-v2/pdfPreflight.js';
import { PAGE_WIDTH_PX } from '../quotation-v2/pdfLayoutConstants.js';

export { preparePdfAssets, validatePdfLayout };

export const exportPagedElementToPdf = async (element, options = {}) => {
  if (!element) throw new Error('Quotation PDF preview is not ready.');
  const { filename = 'WanderLuxe_Quotation.pdf', scale = 1.9, quality = 0.84, onProgress } = options;
  const report = await preparePdfAssets(element, { onProgress });
  onProgress?.({ stage: 'layout', message: 'Validating quotation pages...' });
  const layout = validatePdfLayout(element);
  if (!layout.valid) {
    const page = layout.pages.find((item) => item.verticalOverflowPx > 3 || item.horizontalOverflowPx > 3);
    const error = new Error(`This proposal could not be safely paginated. ${page?.title || 'A page'} overflows by ${Math.ceil(Math.max(page?.verticalOverflowPx || 0, page?.horizontalOverflowPx || 0))} px.`);
    error.code = 'PDF_LAYOUT_OVERFLOW';
    error.page = page;
    throw error;
  }
  const pages = [...element.querySelectorAll('[data-pdf-page="true"]')];
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
  pdf.setProperties({ title: `WanderLuxe Quotation - ${pages[0]?.dataset.pageTitle || 'Travel Proposal'}`, author: 'WanderLuxe', subject: 'Travel quotation', creator: 'WanderLuxe' });
  const width = pdf.internal.pageSize.getWidth();
  const height = pdf.internal.pageSize.getHeight();
  for (let i = 0; i < pages.length; i += 1) {
    onProgress?.({ stage: 'render', current: i + 1, total: pages.length, message: `Composing page ${i + 1} of ${pages.length}...` });
    const canvas = await html2canvas(pages[i], {
      scale, useCORS: true, allowTaint: false, logging: false, backgroundColor: '#ffffff',
      windowWidth: PAGE_WIDTH_PX,
      onclone: (cloned) => {
        const doc = cloned.querySelector('.quotation-pdf-document');
        if (doc) doc.style.transform = 'none';
        const page = cloned.querySelectorAll('[data-pdf-page="true"]')[i];
        if (page) { page.style.boxShadow = 'none'; page.style.visibility = 'visible'; page.style.opacity = '1'; }
      }
    });
    try {
      if (i) pdf.addPage();
      pdf.addImage(canvas.toDataURL('image/jpeg', quality), 'JPEG', 0, 0, width, height, undefined, 'FAST');
    } finally { canvas.width = 0; canvas.height = 0; }
  }
  onProgress?.({ stage: 'done', message: 'Downloading PDF...' });
  pdf.save(filename);
  return { pages: pages.length, assets: report, bytes: pdf.output('arraybuffer').byteLength };
};

/**
 * Wait for all images within an element to be loaded / decoded.
 * Fails gracefully so a single broken image never blocks PDF generation.
 */
const waitForImages = async (container, timeoutMs = 4000) => {
  if (!container) return;
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length === 0) return;

  const promises = images.map((img) => {
    // If already loaded and has dimensions
    if (img.complete && img.naturalHeight !== 0) {
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const finish = () => { clearTimeout(timer); img.removeEventListener('load', finish); img.removeEventListener('error', finish); resolve(); };
      const timer = setTimeout(finish, timeoutMs);
      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', finish, { once: true });
    });
  });

  await Promise.all(promises);
};

/**
 * Ultra High-Resolution Multi-Page PDF Exporter for Travel Documents & Itineraries
 * Page-aware engine: Renders discrete .pdf-page elements directly into individual A4 pages,
 * completely preventing cards from half-cutting or clipping across page breaks.
 */
export const exportElementToPdf = async (element, options = {}) => {
  if (!element) {
    throw new Error('Target element for PDF export not found.');
  }

  const {
    filename = 'WanderLuxe-Travel-Itinerary.pdf',
    scale = 2.2, // ~210 DPI for crisp typography and sharp photos
    orientation = 'portrait',
    quality = 0.95,
    onProgress = null
  } = options;

  if (onProgress) onProgress('Preparing document & assets...');

  // 1. Ensure custom web fonts are fully loaded
  if (document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Proceed even if fonts timeout
    }
  }

  // 2. Ensure all images are decoded and ready
  if (onProgress) onProgress('Loading destination media...');
  await waitForImages(element, 4000);

  // 3. Check for discrete multi-page containers (.pdf-page)
  const pageElements = Array.from(element.querySelectorAll('.pdf-page'));

  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  if (pageElements.length > 0) {
    // DISCRETE PAGE RENDERING (100% Guaranteed ZERO Card Cutting)
    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      if (onProgress) onProgress(`Rendering Page ${i + 1} of ${pageElements.length}...`);

      const canvas = await html2canvas(pageEl, {
        scale: scale,
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 794,
        onclone: (clonedDoc) => {
          const clonedPage = clonedDoc.querySelectorAll('.pdf-page')[i];
          if (clonedPage) {
            clonedPage.style.opacity = '1';
            clonedPage.style.visibility = 'visible';
            clonedPage.style.display = 'block';
            clonedPage.style.boxShadow = 'none';
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', quality);

      if (i > 0) {
        pdf.addPage();
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight, undefined, 'FAST');

      // Memory cleanup
      canvas.width = 1;
      canvas.height = 1;
    }
  } else {
    // FALLBACK CONTINUOUS CAPTURE (With Smart Aspect Ratio Scaling)
    if (onProgress) onProgress('Rendering high-definition print canvas...');
    const canvas = await html2canvas(element, {
      scale: scale,
      useCORS: true,
      allowTaint: false,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth || 794,
      windowHeight: element.scrollHeight || 1123,
      onclone: (clonedDoc) => {
        const clonedEl = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('#ai-itinerary-print-document');
        if (clonedEl) {
          clonedEl.style.opacity = '1';
          clonedEl.style.visibility = 'visible';
          clonedEl.style.display = 'block';
          clonedEl.style.position = 'relative';
          clonedEl.style.left = '0';
          clonedEl.style.top = '0';
          clonedEl.style.boxShadow = 'none';
        }
      }
    });

    const imgData = canvas.toDataURL('image/jpeg', quality);
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    if (onProgress) onProgress('Composing PDF pages...');

    // First page
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Subsequent pages
    while (heightLeft > 2) {
      position -= pageHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    // Memory Cleanup
    canvas.width = 1;
    canvas.height = 1;
  }

  // 4. Save document
  if (onProgress) onProgress('Downloading PDF...');
  pdf.save(filename);

  return true;
};

/**
 * Clean In-Browser Print Helper with A4 Page Optimization
 */
export const printElementDirectly = async (element, title = 'Travel Document') => {
  if (!element) return false;

  const printFrame = document.createElement('iframe');
  printFrame.style.position = 'fixed';
  printFrame.style.right = '0';
  printFrame.style.bottom = '0';
  printFrame.style.width = '0';
  printFrame.style.height = '0';
  printFrame.style.border = '0';

  document.body.appendChild(printFrame);

  const frameDoc = printFrame.contentWindow.document;
  frameDoc.open();
  frameDoc.write('<!doctype html><html><head><meta charset="utf-8"></head><body></body></html>');
  frameDoc.close();
  frameDoc.title = String(title);
  [...document.head.querySelectorAll('link[rel="stylesheet"], style')].forEach((node) => frameDoc.head.appendChild(node.cloneNode(true)));
  const style = frameDoc.createElement('style');
  style.textContent = '@page{size:A4 portrait;margin:0}body{margin:0;background:#fff;print-color-adjust:exact}.quotation-pdf-document{transform:none!important}.pdf-page{break-after:page;page-break-after:always;box-shadow:none!important}.pdf-page:last-child{break-after:auto}';
  frameDoc.head.appendChild(style);
  frameDoc.body.appendChild(element.cloneNode(true));
  await Promise.race([Promise.all([...frameDoc.querySelectorAll('link[rel="stylesheet"]')].map((link) => new Promise((resolve) => { link.onload = resolve; link.onerror = resolve; }))), new Promise((resolve) => setTimeout(resolve, 5000))]);
  await Promise.race([frameDoc.fonts?.ready || Promise.resolve(), new Promise((resolve) => setTimeout(resolve, 5000))]);
  await waitForImages(frameDoc.body, 5000);
  const cleanup = () => { if (printFrame.isConnected) printFrame.remove(); };
  printFrame.contentWindow.addEventListener('afterprint', cleanup, { once: true });
  setTimeout(cleanup, 60000);
  printFrame.contentWindow.focus();
  printFrame.contentWindow.print();
  return true;
};

export default {
  exportElementToPdf,
  printElementDirectly
};
