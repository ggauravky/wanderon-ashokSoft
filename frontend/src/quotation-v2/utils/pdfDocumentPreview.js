async function renderSinglePdf(targetUrl, timeoutMs, maxWidth) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url).toString();
  const task = pdfjs.getDocument({ url: targetUrl, withCredentials: false, disableAutoFetch: true });
  let pdf;
  let canvas;
  const deadline = Date.now() + timeoutMs;
  const withTimeout = async (promise) => {
    let timer;
    try {
      return await Promise.race([
        promise,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('PDF preview timed out.')), Math.max(1, deadline - Date.now())); })
      ]);
    } finally { clearTimeout(timer); }
  };
  try {
    pdf = await withTimeout(task.promise);
    const page = await withTimeout(pdf.getPage(1));
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(2, maxWidth / base.width) });
    canvas = document.createElement('canvas');
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    await withTimeout(page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise);
    return canvas.toDataURL('image/jpeg', 0.84);
  } finally {
    if (canvas) { canvas.width = 0; canvas.height = 0; }
    if (pdf) await pdf.destroy();
    else await task.destroy();
  }
}

export async function renderPdfFirstPage(url, { timeoutMs = 12000, maxWidth = 1100, relayUrl = null } = {}) {
  if (!/^https?:\/\//i.test(url) && !url?.startsWith?.('/')) {
    throw new Error('PDF preview requires a valid document URL.');
  }
  try {
    return await renderSinglePdf(url, timeoutMs, maxWidth);
  } catch (err) {
    if (relayUrl && relayUrl !== url) {
      return await renderSinglePdf(relayUrl, timeoutMs, maxWidth);
    }
    throw err;
  }
}
