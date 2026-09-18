import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Download, X } from 'lucide-react';
import QuotationTemplateRenderer from '../QuotationTemplateRenderer.jsx';
import { getQuotationTemplate, quotationTemplateOptions } from '../templateRegistry.js';

export default function QuotationPreviewModal({ open, quotation, initialTemplateKey, onClose, onBack, onDownload, busy = false, documentRef: externalRef }) {
  const localRef = useRef(null);
  const documentRef = externalRef || localRef;
  const [templateKey, setTemplateKey] = useState(initialTemplateKey || 'journey');
  const [pageCount, setPageCount] = useState(0);
  useEffect(() => { if (open) setTemplateKey(initialTemplateKey || quotation?.templateKey || quotation?.presentationSettings?.template || 'journey'); }, [initialTemplateKey, open, quotation]);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose, open]);
  useEffect(() => {
    if (!open) return undefined;
    const updateCount = () => setPageCount(documentRef.current?.querySelectorAll('[data-pdf-page="true"]').length || 0);
    const timer = setTimeout(updateCount, 120);
    const observer = new MutationObserver(updateCount);
    if (documentRef.current) observer.observe(documentRef.current, { childList: true, subtree: true });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [documentRef, open, quotation, templateKey]);
  if (!open || !quotation) return null;
  return <div className="fixed inset-0 z-[95] overflow-y-auto bg-slate-950/95"><div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 px-3 py-3 backdrop-blur"><div className="mx-auto flex max-w-[1200px] flex-wrap items-center gap-2"><button type="button" onClick={onBack || onClose} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm font-semibold text-white"><ArrowLeft size={16} />Templates</button><label className="ml-auto flex min-h-10 items-center gap-2 rounded-lg border border-white/15 px-3 text-sm text-white"><span className="sr-only">Template</span><select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)} className="bg-transparent font-semibold outline-none">{quotationTemplateOptions().map((item) => <option key={item.key} value={item.key} className="text-slate-950">{item.name}</option>)}</select></label><span className="min-h-10 rounded-lg border border-white/15 px-3 py-2.5 text-sm text-slate-300">{pageCount || '...'} pages</span><button type="button" disabled={busy} onClick={() => onDownload(quotation, templateKey, documentRef.current)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><Download size={16} />Download PDF</button><button type="button" aria-label="Close preview" onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-950"><X size={16} /></button></div></div><div className="mx-auto max-w-[1200px] p-3 md:p-8"><p className="mb-3 text-center text-xs font-semibold uppercase tracking-[.16em] text-slate-400">{getQuotationTemplate(templateKey).name} | screen preview</p><QuotationTemplateRenderer ref={documentRef} quotation={quotation} templateKey={templateKey} isSuperseded={quotation.superseded || quotation.status === 'SUPERSEDED'} /></div></div>;
}
