import React from 'react';

const inputClass = 'min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500';
const TripSeoForm = ({ value, onChange }) => {
  const seo = value.seo || {};
  const set = (field, next) => onChange({ ...value, seo: { ...seo, [field]: next } });
  const fields = [['seoTitle', 'SEO title'], ['canonicalUrl', 'Canonical URL'], ['ogTitle', 'Open Graph title'], ['ogImage', 'Open Graph image'], ['structuredSchemaType', 'Structured schema type']];
  return <div className="grid gap-4 md:grid-cols-2">{fields.map(([field, label]) => <label key={field} className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span><input className={inputClass} value={seo[field] || ''} onChange={(e) => set(field, e.target.value)} /></label>)}<label className="space-y-1.5 text-sm font-medium text-slate-700"><span>Indexing</span><select className={inputClass} value={seo.indexingDirective || 'index, follow'} onChange={(e) => set('indexingDirective', e.target.value)}><option>index, follow</option><option>noindex, nofollow</option></select></label><label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2"><span>Meta description</span><textarea rows="4" className={`${inputClass} py-2`} value={seo.metaDescription || ''} onChange={(e) => set('metaDescription', e.target.value)} /></label><label className="space-y-1.5 text-sm font-medium text-slate-700 md:col-span-2"><span>Open Graph description</span><textarea rows="4" className={`${inputClass} py-2`} value={seo.ogDescription || ''} onChange={(e) => set('ogDescription', e.target.value)} /></label></div>;
};

export default TripSeoForm;

