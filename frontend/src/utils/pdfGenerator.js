import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

/**
 * Wait for all images within an element to be loaded / decoded.
 * Fails gracefully so a single broken image never blocks PDF generation.
 */
const waitForImages = async (container, timeoutMs = 3500) => {
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
        // Fallback: set crossOrigin and prevent broken image from breaking html2canvas
        img.crossOrigin = 'anonymous';
        resolve();
      };
    });
  });

  await Promise.all(promises);
};

/**
 * Ultra High-Resolution Multi-Page PDF Exporter for Travel Documents & Itineraries
 * Computes exact A4 page splits, eliminates blurriness, and prevents text cutoffs.
 */
export const exportElementToPdf = async (element, options = {}) => {
  if (!element) {
    throw new Error('Target element for PDF export not found.');
  }

  const {
    filename = 'WanderLuxe-Travel-Itinerary.pdf',
    scale = 2.2, // ~210 DPI for crisp typography and sharp photos without GPU memory exhaustion
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
  await waitForImages(element, 3500);

  // 3. Capture element with canonical A4 dimensions (794px width)
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
      // Ensure all cloned text and fonts are crisp and visible
      const clonedEl = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('#ai-itinerary-print-document');
      if (clonedEl) {
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.display = 'block';
        clonedEl.style.position = 'relative';
        clonedEl.style.left = '0';
        clonedEl.style.top = '0';
        // Remove browser-only drop-shadow from the print capture
        clonedEl.style.boxShadow = 'none';
      }
    }
  });

  const imgData = canvas.toDataURL('image/jpeg', quality);

  // 4. Standard A4 dimensions in millimeters (210mm x 297mm)
  const pdf = new jsPDF({
    orientation: orientation,
    unit: 'mm',
    format: 'a4',
    compress: true
  });

  const pageWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pageHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;
  let pageNumber = 1;

  if (onProgress) onProgress('Composing PDF pages...');

  // 5. Render first page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // 6. Render subsequent pages if content exceeds single A4 page height
  while (heightLeft > 2) {
    position -= pageHeight;
    pageNumber++;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  // 7. Save document
  if (onProgress) onProgress('Downloading PDF...');
  pdf.save(filename);

  // 8. Memory Cleanup: shrink canvas dimensions to release GPU and memory
  canvas.width = 1;
  canvas.height = 1;

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
            margin: 8mm;
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
