import React, { useEffect, useRef } from 'react';
import QuotationTemplateRenderer from './QuotationTemplateRenderer.jsx';
import { preparePdfAssets, validatePdfLayout } from './pdfPreflight.js';

export default function PdfRenderPage() {
  const ref = useRef(null);
  const data = window.__WANDERLUXE_RENDER_DATA__;

  useEffect(() => {
    if (!data?.quotation) return undefined;
    let cancelled = false;
    window.__WANDERLUXE_PDF_READY__ = false;
    window.__WANDERLUXE_PDF_ERROR__ = null;
    document.title = `WanderLuxe ${data.quotation.quotationNumber || 'Quotation'}`;
    (async () => {
      try {
        for (let i = 0; i < 800 && ref.current?.querySelector('[data-pdf-layout-state]')?.dataset.pdfLayoutState !== 'ready'; i += 1) {
          const state = ref.current?.querySelector('[data-pdf-layout-state]');
          if (state?.dataset.pdfLayoutState === 'error') throw new Error(state.dataset.pdfLayoutError || 'Quotation layout failed.');
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (!ref.current) throw new Error('Quotation pages did not render.');
        if (ref.current.querySelector('[data-pdf-layout-state]')?.dataset.pdfLayoutState !== 'ready') throw new Error('Quotation layout did not become ready in time.');
        const assets = await preparePdfAssets(ref.current);
        const layout = validatePdfLayout(ref.current);
        if (!layout.valid) throw new Error('Quotation pages exceeded A4 bounds.');
        if (!cancelled) {
          window.__WANDERLUXE_PDF_REPORT__ = { assets, layout };
          window.__WANDERLUXE_PDF_READY__ = true;
        }
      } catch (error) {
        if (!cancelled) window.__WANDERLUXE_PDF_ERROR__ = error.message;
      }
    })();
    return () => { cancelled = true; };
  }, [data]);

  if (!data?.quotation) return null;
  return <main className="pdf-render-page"><QuotationTemplateRenderer ref={ref} quotation={data.quotation} templateKey={data.templateKey} isSuperseded={data.quotation.superseded} /></main>;
}
