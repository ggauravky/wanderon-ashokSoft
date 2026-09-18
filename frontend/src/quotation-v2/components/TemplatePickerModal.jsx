import React, { useEffect, useMemo, useRef } from 'react';
import { Download, Eye, X } from 'lucide-react';
import { buildQuotationPresentationModel } from '../buildQuotationPresentationModel.js';
import { getQuotationTemplate, quotationTemplateOptions } from '../templateRegistry.js';
import PdfImage from './PdfImage.jsx';

export function TemplateChoiceGrid({ quotation, selectedKey, onSelect, onPreview, compact = false }) {
  const model = useMemo(() => buildQuotationPresentationModel(quotation), [quotation]);
  return <div className={`template-choice-grid ${compact ? 'is-compact' : ''}`} role="radiogroup" aria-label="Quotation presentation template">
    {quotationTemplateOptions().map((template) => <article key={template.key} className={`template-choice-card ${selectedKey === template.key ? 'is-selected' : ''}`}>
      <button type="button" role="radio" aria-checked={selectedKey === template.key} onClick={() => onSelect(template.key)} className="template-choice-select">
        {!compact && <div className={`template-cover-mini is-${template.key}`}>{model.journey.coverImage ? <PdfImage src={model.journey.coverImage} alt="" /> : <div className="template-cover-shape" />}<div><small>WANDERLUXE</small><strong>{model.journey.title}</strong><span>{model.journey.destination}</span></div></div>}
        <div className="template-choice-copy"><div><span>{template.detail}</span><strong>{template.name}</strong></div><em>{template.targetPages}</em><p>{template.shortDescription}</p>{!compact && <small>{template.bestFor || template.description}</small>}</div>
      </button>
      {onPreview && <button type="button" onClick={() => onPreview(template.key)} className="template-choice-preview"><Eye size={15} />Preview {template.name}</button>}
    </article>)}
  </div>;
}

export default function TemplatePickerModal({ open, quotation, selectedKey, onSelect, onClose, onPreview, onDownload, busy = false, mode = 'download' }) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    dialogRef.current?.focus();
    return () => window.removeEventListener('keydown', close);
  }, [onClose, open]);
  if (!open) return null;
  const selected = getQuotationTemplate(selectedKey);
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/75 p-3 backdrop-blur-sm"><section ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="template-picker-title" className="max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl md:p-7">
    <div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[.16em] text-emerald-700">WanderLuxe presentation studio</p><h2 id="template-picker-title" className="mt-1 text-2xl font-semibold text-slate-950">{mode === 'preview' ? 'Choose Preview Style' : 'Choose PDF Style'}</h2><p className="mt-1 text-sm text-slate-500">Select how detailed you want this quotation to be. This does not change the saved revision.</p></div><button type="button" aria-label="Close template picker" onClick={onClose} className="rounded-lg border border-slate-200 p-2 text-slate-500"><X size={18} /></button></div>
    <div className="mt-6"><TemplateChoiceGrid quotation={quotation} selectedKey={selected.key} onSelect={onSelect} onPreview={onPreview} /></div>
    <div className="mt-6 flex flex-col-reverse gap-2 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-end"><button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="button" onClick={() => onPreview(selected.key)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 text-sm font-semibold text-slate-800"><Eye size={16} />Preview Selected</button>{mode === 'download' && <button type="button" disabled={busy} onClick={() => onDownload(selected.key)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"><Download size={16} />Download Selected PDF</button>}</div>
  </section></div>;
}
