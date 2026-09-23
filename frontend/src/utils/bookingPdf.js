export async function downloadBookingPdf(element, filename) {
  if (!element) throw new Error('Document is not ready.');
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'), import('jspdf')
  ]);
  await Promise.all(Array.from(element.querySelectorAll('img')).map((img) => img.decode?.().catch(() => {})));
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = 210;
  const pageHeight = 297;
  const renderedHeight = canvas.height * pageWidth / canvas.width;
  const pageCount = Math.ceil(renderedHeight / pageHeight);
  const pixelsPerPage = Math.floor(canvas.width * pageHeight / pageWidth);
  for (let index = 0; index < pageCount; index += 1) {
    if (index) pdf.addPage();
    const slice = document.createElement('canvas');
    slice.width = canvas.width;
    slice.height = Math.min(pixelsPerPage, canvas.height - index * pixelsPerPage);
    slice.getContext('2d').drawImage(canvas, 0, index * pixelsPerPage, canvas.width, slice.height, 0, 0, canvas.width, slice.height);
    pdf.addImage(slice.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, slice.height * pageWidth / canvas.width);
  }
  pdf.save(filename);
}

export function printBookingDocument(element) {
  if (!element) throw new Error('Document is not ready.');
  const frame = document.createElement('iframe');
  frame.style.position = 'fixed';
  frame.style.width = '0';
  frame.style.height = '0';
  frame.style.border = '0';
  document.body.appendChild(frame);
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((node) => node.outerHTML).join('');
  const doc = frame.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html><head>${styles}<style>@page{size:A4;margin:0}body{margin:0;background:white!important}</style></head><body>${element.outerHTML}</body></html>`);
  doc.close();
  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => frame.remove(), 1000);
  };
}
