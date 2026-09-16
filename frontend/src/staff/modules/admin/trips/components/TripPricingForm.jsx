import React from 'react';

const inputClass = 'min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500';
const TripPricingForm = ({ value, onChange }) => {
  const set = (field, next) => onChange({ ...value, [field]: next });
  const setSharing = (field, next) => onChange({ ...value, sharingPricing: { ...(value.sharingPricing || {}), [field]: next } });
  return <div className="space-y-6">
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>Base price</span><input type="number" min="0" className={inputClass} value={value.price} onChange={(e) => set('price', e.target.value)} /></label>
      <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>Original price</span><input type="number" min="0" className={inputClass} value={value.originalPrice} onChange={(e) => set('originalPrice', e.target.value)} /></label>
      <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>Discount %</span><input type="number" min="0" className={inputClass} value={value.discount} onChange={(e) => set('discount', e.target.value)} /></label>
      <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>Currency</span><input className={inputClass} value={value.currency} onChange={(e) => set('currency', e.target.value.toUpperCase())} /></label>
    </div>
    <div><h3 className="text-sm font-semibold text-slate-900">Sharing pricing</h3><p className="mt-1 text-xs text-slate-500">Trip-level rates used when a departure does not override them.</p><div className="mt-3 grid gap-4 md:grid-cols-3">
      {[['tripleSharing', 'Triple sharing'], ['doubleSharing', 'Double sharing'], ['singleSharing', 'Single sharing']].map(([field, label]) => <label key={field} className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span><input type="number" min="0" className={inputClass} value={value.sharingPricing?.[field] ?? ''} onChange={(e) => setSharing(field, e.target.value)} /></label>)}
    </div></div>
  </div>;
};

export default TripPricingForm;

