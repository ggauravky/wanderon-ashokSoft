import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

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
    scale = 3, // 300 DPI high-definition print quality
    orientation = 'portrait',
    quality = 0.98
  } = options;

  // 1. Capture element with high-definition pixel density
  const canvas = await html2canvas(element, {
    scale: scale,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth || 794,
    windowHeight: element.scrollHeight || 1123,
    onclone: (clonedDoc) => {
      // Ensure all cloned text and fonts are crisp and rendered with opacity 1
      const clonedEl = clonedDoc.getElementById(element.id) || clonedDoc.querySelector('#ai-itinerary-print-document');
      if (clonedEl) {
        clonedEl.style.opacity = '1';
        clonedEl.style.visibility = 'visible';
        clonedEl.style.display = 'block';
        clonedEl.style.position = 'relative';
        clonedEl.style.left = '0';
        clonedEl.style.top = '0';
      }
    }
  });

  const imgData = canvas.toDataURL('image/jpeg', quality);

  // 2. Standard A4 dimensions in millimeters
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

  // 3. Render first page
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pageHeight;

  // 4. Render subsequent pages if content exceeds single A4 page height
  while (heightLeft > 2) {
    position -= pageHeight;
    pageNumber++;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;
  }

  // 5. Save document
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
