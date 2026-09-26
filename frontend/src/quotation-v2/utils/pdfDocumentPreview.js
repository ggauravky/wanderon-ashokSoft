export async function renderPdfFirstPage(url, { timeoutMs = 10000, maxWidth = 1100 } = {}) {
  if (!/^https:\/\//i.test(url)) throw new Error('PDF preview requires an HTTPS document URL.');
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({ url, withCredentials: false, disableAutoFetch: true });
  let pdf;
  let canvas;
  let timer;
  try {
    pdf = await Promise.race([
      task.promise,
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('PDF preview timed out.')), timeoutMs); })
    ]);
    const page = await pdf.getPage(1);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, maxWidth / base.width) });
    canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
    return canvas.toDataURL('image/jpeg', 0.84);
  } finally {
    clearTimeout(timer);
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (pdf) await pdf.destroy();
    else await task.destroy();
  }
}
