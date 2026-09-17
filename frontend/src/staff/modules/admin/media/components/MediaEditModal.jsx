import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { MEDIA_SOURCES, humanizeMediaValue } from '../mediaHelpers.js';

const inputClass = 'mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const MediaEditModal = ({ asset, busy, onClose, onSave }) => {
  const [form, setForm] = useState(null);
  useEffect(() => {
    if (!asset) return;
    setForm({
      title: asset.title || '', altText: asset.altText || '', caption: asset.caption || '',
      destination: asset.geography?.destination || '', city: asset.geography?.city || '', locality: asset.geography?.locality || '', poi: asset.geography?.poi || '',
      categories: (asset.categories || []).join(', '), tags: (asset.tags || []).join(', '),
      sourceType: asset.source?.sourceType || 'PROJECT_ASSET', attribution: asset.source?.attribution || '', featured: Boolean(asset.featured), active: asset.active !== false
    });
  }, [asset]);
  if (!asset || !form) return null;
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    onSave({
      title: form.title.trim(), altText: form.altText.trim(), caption: form.caption.trim(),
      geography: { ...asset.geography, destination: form.destination.trim(), city: form.city.trim(), locality: form.locality.trim(), poi: form.poi.trim() },
      categories: form.categories.split(',').map((value) => value.trim()).filter(Boolean),
      tags: form.tags.split(',').map((value) => value.trim()).filter(Boolean),
      source: { ...asset.source, sourceType: form.sourceType, attribution: form.attribution.trim() },
      featured: form.featured, active: form.active
    });
  };
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-2xl"><header className="sticky top-0 flex items-start justify-between border-b border-slate-200 bg-white p-5"><div><h2 className="font-semibold text-slate-950">Edit media metadata</h2><p className="mt-1 text-xs text-slate-500">Cloudinary file and public ID remain unchanged.</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button></header><div className="grid gap-4 p-5 sm:grid-cols-2"><label className="text-sm font-medium text-slate-700 sm:col-span-2">Title<input required value={form.title} onChange={(e) => set('title', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Alt text<input required value={form.altText} onChange={(e) => set('altText', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700 sm:col-span-2">Caption<textarea rows="3" value={form.caption} onChange={(e) => set('caption', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700">Destination<input required value={form.destination} onChange={(e) => set('destination', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700">City<input value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700">Locality<input value={form.locality} onChange={(e) => set('locality', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700">POI<input value={form.poi} onChange={(e) => set('poi', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700">Categories<input value={form.categories} onChange={(e) => set('categories', e.target.value)} className={inputClass} placeholder="Landscape, Hero" /></label><label className="text-sm font-medium text-slate-700">Tags<input value={form.tags} onChange={(e) => set('tags', e.target.value)} className={inputClass} /></label><label className="text-sm font-medium text-slate-700">Source<select value={form.sourceType} onChange={(e) => set('sourceType', e.target.value)} className={inputClass}>{MEDIA_SOURCES.map((value) => <option key={value} value={value}>{humanizeMediaValue(value)}</option>)}</select></label><label className="text-sm font-medium text-slate-700">Attribution<input value={form.attribution} onChange={(e) => set('attribution', e.target.value)} className={inputClass} /></label><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.featured} onChange={(e) => set('featured', e.target.checked)} />Featured</label><label className="flex items-center gap-2 text-sm font-medium text-slate-700"><input type="checkbox" checked={form.active} onChange={(e) => set('active', e.target.checked)} />Active</label></div><footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700">Cancel</button><button type="submit" disabled={busy} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Save metadata'}</button></footer></form></div>;
};

export default MediaEditModal;

