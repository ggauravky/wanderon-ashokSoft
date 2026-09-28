import React, { useEffect, useRef, useState } from 'react';
import QuotationTemplateRenderer from './QuotationTemplateRenderer.jsx';
import { preparePdfAssets, validatePdfLayout } from './pdfPreflight.js';
import { brokenMediaQuotation, extremeQuotation, fiveDayQuotation, minimalQuotation, normalQuotation, stressQuotation, ticketHeavyQuotation } from './__fixtures__/stressQuotation.js';

const fixtures = { minimal: minimalQuotation, normal: normalQuotation, stress: stressQuotation, ticketHeavy: ticketHeavyQuotation, fiveDay: fiveDayQuotation, extreme: extremeQuotation, broken: brokenMediaQuotation };
const templates = ['signature_luxe', 'journey', 'minimal'];

export default function PdfQaPage() {
  const params = new URLSearchParams(window.location.search);
  const [template, setTemplate] = useState(params.get('template') || 'journey');
  const [fixture, setFixture] = useState(params.get('fixture') || 'normal');
  const [debug, setDebug] = useState(params.get('debug') === '1');
  const ref = useRef(null);
  const [report, setReport] = useState(null);
  useEffect(() => {
    let cancelled = false;
    window.__WANDERLUXE_PDF_READY__ = false;
    window.__WANDERLUXE_PDF_ERROR__ = null;
    setReport(null);
    const run = async () => {
      try {
        for (let i = 0; i < 1200 && ref.current?.querySelector('[data-pdf-layout-state]')?.dataset.pdfLayoutState !== 'ready'; i += 1) {
          const state = ref.current?.querySelector('[data-pdf-layout-state]');
          if (state?.dataset.pdfLayoutState === 'error') throw new Error(state.dataset.pdfLayoutError || 'Measured layout failed.');
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
        if (!ref.current || cancelled) return;
        const layoutState = ref.current.querySelector('[data-pdf-layout-state]');
        if (layoutState?.dataset.pdfLayoutState !== 'ready') throw new Error(`Measured layout timed out in state ${layoutState?.dataset.pdfLayoutState || 'missing'}.`);
        const assets = await preparePdfAssets(ref.current, { timeoutMs: 20000 });
        const layout = validatePdfLayout(ref.current);
        window.__WANDERLUXE_PDF_REPORT__ = { assets, layout };
        if (!layout.valid) {
          const invalid = layout.pages.filter((page) => page.verticalOverflowPx > 2 || page.horizontalOverflowPx > 2 || page.footerCollisionPx > 2 || page.headerCollisionPx > 2 || page.pageSizeMismatchPx > 2);
          throw new Error(`Final PDF pages failed layout validation: ${JSON.stringify(invalid)}.`);
        }
        if (!cancelled) {
          const next = { assets, layout };
          setReport(next);
          window.__WANDERLUXE_PDF_REPORT__ = next;
          window.__WANDERLUXE_PDF_READY__ = true;
        }
      } catch (error) {
        if (!cancelled) window.__WANDERLUXE_PDF_ERROR__ = error.message;
      }
    };
    run();
    window.__WANDERLUXE_RUN_FALLBACK__ = async () => {
      const { exportPagedElementToPdf } = await import('../utils/pdfGenerator.js');
      return exportPagedElementToPdf(ref.current, { filename: `qa-${fixture}-${template}.pdf`, scale: 1.25, quality: 0.78 });
    };
    return () => { cancelled = true; delete window.__WANDERLUXE_RUN_FALLBACK__; };
  }, [debug, fixture, template]);
  return <main className="pdf-qa-page" style={{ background: '#d9dfdc', minHeight: '100vh', padding: 20 }}><div className="pdf-qa-toolbar" style={{ maxWidth: 900, margin: '0 auto 16px', font: '12px Arial', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}><strong>PDF QA</strong><label>Template <select value={template} onChange={(event) => setTemplate(event.target.value)}>{templates.map((item) => <option key={item}>{item}</option>)}</select></label><label>Fixture <select value={fixture} onChange={(event) => setFixture(event.target.value)}>{Object.keys(fixtures).map((item) => <option key={item}>{item}</option>)}</select></label><label><input type="checkbox" checked={debug} onChange={(event) => setDebug(event.target.checked)} /> Show block boundaries and measured heights</label>{report && <span data-qa-status="valid">{report.layout.pages.length} pages · No overflow · {report.layout.pages.map((page) => Math.max(page.verticalOverflowPx, page.horizontalOverflowPx)).join('/')} px overflow</span>}</div><QuotationTemplateRenderer ref={ref} quotation={fixtures[fixture] || normalQuotation} templateKey={template} debug={debug} /></main>;
}
