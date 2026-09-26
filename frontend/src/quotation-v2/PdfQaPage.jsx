import React, { useEffect, useRef, useState } from 'react';
import QuotationTemplateRenderer from './QuotationTemplateRenderer.jsx';
import { preparePdfAssets, validatePdfLayout } from './pdfPreflight.js';
import { stressQuotation, minimalQuotation, brokenMediaQuotation, extremeQuotation } from './__fixtures__/stressQuotation.js';

const fixtures = { stress: stressQuotation, minimal: minimalQuotation, broken: brokenMediaQuotation, extreme: extremeQuotation };

export default function PdfQaPage() {
  const params = new URLSearchParams(window.location.search);
  const template = params.get('template') || 'journey';
  const fixture = params.get('fixture') || 'stress';
  const ref = useRef(null);
  const [report, setReport] = useState(null);
  useEffect(() => {
    let cancelled = false;
    window.__WANDERLUXE_PDF_READY__ = false;
    const run = async () => {
      for (let i = 0; i < 100 && !ref.current?.querySelector('[data-pdf-page]'); i += 1) await new Promise((resolve) => setTimeout(resolve, 50));
      if (!ref.current || cancelled) return;
      const assets = await preparePdfAssets(ref.current);
      const layout = validatePdfLayout(ref.current);
      if (!cancelled) {
        const next = { assets, layout };
        setReport(next);
        window.__WANDERLUXE_PDF_REPORT__ = next;
        window.__WANDERLUXE_PDF_READY__ = true;
      }
    };
    run();
    return () => { cancelled = true; };
  }, [template, fixture]);
  return <main className="pdf-qa-page" style={{ background: '#d9dfdc', minHeight: '100vh', padding: 20 }}><div className="pdf-qa-toolbar" style={{ maxWidth: 800, margin: '0 auto 16px', font: '12px Arial' }}><strong>PDF QA · {fixture} · {template}</strong> {report && <span data-qa-status={report.layout.valid ? 'valid' : 'overflow'}> · {report.layout.pages.length} pages · {report.layout.valid ? 'No overflow' : 'Overflow detected'}</span>}</div><QuotationTemplateRenderer ref={ref} quotation={fixtures[fixture] || stressQuotation} templateKey={template} /></main>;
}
