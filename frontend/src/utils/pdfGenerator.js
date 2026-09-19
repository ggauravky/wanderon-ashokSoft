import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
      const timer = setTimeout(() => resolve(), timeoutMs);
      img.onload = () => {
        clearTimeout(timer);
        resolve();
      };
      img.onerror = () => {
        clearTimeout(timer);
        img.crossOrigin = 'anonymous';
        resolve();
      };
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
export const printElementDirectly = (element, title = 'Travel Document') => {
  if (!element) return;

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
  frameDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>${title}</title>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://cdn.tailwindcss.com"></script>
        <style>
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            background-color: #ffffff;
            margin: 0;
            padding: 0;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          * {
            box-sizing: border-box;
          }
          .pdf-page {
            width: 794px !important;
            min-height: 1123px !important;
            max-height: 1123px !important;
            page-break-after: always !important;
            break-after: page !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          .break-inside-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        </style>
      </head>
      <body>
        <div style="width: 100%; max-width: 794px; margin: 0 auto;">
          ${element.innerHTML}
        </div>
      </body>
    </html>
  `);
  frameDoc.close();

  setTimeout(() => {
    printFrame.contentWindow.focus();
    printFrame.contentWindow.print();
    setTimeout(() => {
      document.body.removeChild(printFrame);
    }, 1000);
  }, 600);
};

export default {
  exportElementToPdf,
  printElementDirectly
};
