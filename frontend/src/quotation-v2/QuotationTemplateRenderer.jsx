import React, { forwardRef, lazy, Suspense, useEffect, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { buildQuotationPresentationModel } from './buildQuotationPresentationModel.js';
import { getQuotationTemplate } from './templateRegistry.js';

const SignatureLuxeTemplate = lazy(() => import('./templates/SignatureLuxeTemplate.jsx'));
const JourneyJournalTemplate = lazy(() => import('./templates/JourneyJournalTemplate.jsx'));
const ExpeditionDossierTemplate = lazy(() => import('./templates/ExpeditionDossierTemplate.jsx'));

const templateComponents = {
  signature_luxe: SignatureLuxeTemplate,
  journey: JourneyJournalTemplate,
  minimal: ExpeditionDossierTemplate
};

const QuotationTemplateRenderer = forwardRef(function QuotationTemplateRenderer({ quotation = {}, templateKey, isDraft, isSuperseded }, forwardedRef) {
  const viewportRef = useRef(null);
  const documentRef = useRef(null);
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState('auto');
  const chosen = getQuotationTemplate(templateKey || quotation.templateKey || quotation.presentationSettings?.template).key;
  const Template = templateComponents[chosen];
  const model = useMemo(() => buildQuotationPresentationModel(quotation, { isDraft, isSuperseded }), [isDraft, isSuperseded, quotation]);

  useImperativeHandle(forwardedRef, () => documentRef.current);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    const documentNode = documentRef.current;
    if (!viewport || !documentNode) return undefined;
    const update = () => {
      const available = Math.max(280, viewport.clientWidth);
      const nextScale = Math.min(1, available / 794);
      setScale(nextScale);
      setHeight(`${documentNode.scrollHeight * nextScale}px`);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const observer = new ResizeObserver(update);
    observer.observe(viewport);
    observer.observe(documentNode);
    return () => observer.disconnect();
  }, [chosen, quotation]);

  useEffect(() => {
    const handle = requestAnimationFrame(() => {
      if (documentRef.current) setHeight(`${documentRef.current.scrollHeight * scale}px`);
    });
    return () => cancelAnimationFrame(handle);
  }, [scale, chosen]);

  return <div ref={viewportRef} className="quotation-pdf-viewport" style={{ width: '100%', overflow: 'hidden', minHeight: height }}>
    <article ref={documentRef} className="quotation-pdf-document" data-template={chosen} style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}>
      <Suspense fallback={<div className="quotation-template-loading">Preparing {getQuotationTemplate(chosen).name}...</div>}><Template model={model} /></Suspense>
    </article>
  </div>;
});

export default QuotationTemplateRenderer;
