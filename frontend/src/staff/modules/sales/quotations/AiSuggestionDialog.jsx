import React, { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

const show = (value) => Array.isArray(value) ? value.map((item) => typeof item === 'object' ? `Day ${item.day}: ${item.description}` : item).join('\n') : typeof value === 'object' ? Object.entries(value || {}).map(([key, text]) => `${key}: ${text}`).join('\n\n') : String(value || '');

export default function AiSuggestionDialog({ proposal, onApply, onClose }) {
  const itemKey = (item, index) => typeof item === 'object' ? `day:${item.day}` : `index:${index}`;
  const [selected, setSelected] = useState(() => Array.isArray(proposal?.suggestion)
    ? proposal.suggestion.map(itemKey)
    : Object.keys(proposal?.suggestion || {}));
  const closeRef = useRef(null);
  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  if (!proposal) return null;
  const multiple = proposal.field === 'policies.all';
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/60 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-label="Review writing suggestion" className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white p-5 shadow-2xl">
      <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold text-slate-950">Review {proposal.label || 'suggestion'}</h2><button ref={closeRef} type="button" aria-label="Close suggestion" onClick={onClose}><X size={18} /></button></div>
      {proposal.stale && <p className="mt-3 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This field changed after the suggestion was generated. Review the current text carefully before applying.</p>}
      {multiple ? <div className="mt-4 space-y-3">{Object.entries(proposal.suggestion).map(([key, value]) => <label key={key} className="block rounded border border-slate-200 p-3"><span className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={selected.includes(key)} onChange={(event) => setSelected((items) => event.target.checked ? [...items, key] : items.filter((item) => item !== key))} />{key.replace(/([A-Z])/g, ' $1')}</span><span className="mt-2 block whitespace-pre-wrap text-sm text-slate-700">{value}</span></label>)}</div> : Array.isArray(proposal.suggestion) ? <div className="mt-4 space-y-3">{proposal.suggestion.map((item, index) => { const key = itemKey(item, index); return <label key={key} className="block rounded border border-emerald-200 bg-emerald-50 p-3"><span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><input type="checkbox" checked={selected.includes(key)} onChange={(event) => setSelected((items) => event.target.checked ? [...items, key] : items.filter((value) => value !== key))} />{typeof item === 'object' ? `Day ${item.day}` : item}</span>{typeof item === 'object' && <><span className="mt-2 block text-xs font-semibold uppercase text-slate-500">Suggested</span><span className="block whitespace-pre-wrap text-sm text-slate-700">{item.description}</span></>}</label>; })}</div> : <div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase text-slate-500">Current</p><div className="mt-1 min-h-28 whitespace-pre-wrap rounded border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{show(proposal.current) || 'Empty'}</div></div><div><p className="text-xs font-semibold uppercase text-emerald-700">Suggestion</p><div className="mt-1 min-h-28 whitespace-pre-wrap rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-slate-900">{show(proposal.suggestion) || 'No text suggested'}</div></div></div>}
      <div className="mt-5 flex flex-wrap justify-end gap-2"><button type="button" onClick={onClose} className="min-h-10 rounded border border-slate-200 px-3 text-sm">Discard</button><button type="button" onClick={() => onApply('append', selected)} disabled={multiple && !selected.length} className="min-h-10 rounded border border-slate-200 px-3 text-sm">{Array.isArray(proposal.suggestion) ? 'Add missing' : 'Append'}</button><button type="button" onClick={() => onApply('replace', selected)} disabled={multiple && !selected.length} className="inline-flex min-h-10 items-center gap-2 rounded bg-emerald-700 px-3 text-sm font-semibold text-white"><Check size={15} />{show(proposal.current) ? 'Replace' : 'Apply'}</button></div>
    </section>
  </div>;
}
