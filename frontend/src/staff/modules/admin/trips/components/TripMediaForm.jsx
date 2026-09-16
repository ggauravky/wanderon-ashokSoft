import React, { useState } from 'react';
import { Images, Plus, Trash2 } from 'lucide-react';
import MediaLibraryModal from '../../../../../components/MediaLibraryModal';
import UploadLocationImageModal from '../../../../../components/UploadLocationImageModal';

const inputClass = 'min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500';

const TripMediaForm = ({ value, onChange }) => {
  const [picker, setPicker] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTarget, setUploadTarget] = useState(null);
  const select = (asset, target = picker) => {
    if (target === 'gallery') onChange({ ...value, gallery: [...(value.gallery || []), asset.url] });
    else if (target) onChange({ ...value, [target]: asset.url });
    setPicker(null);
  };
  const uploaded = (asset) => { select({ url: asset?.storage?.secureUrl || asset?.url }, uploadTarget); setUploadOpen(false); setUploadTarget(null); };
  return <div className="space-y-6">
    {[['image', 'Main image'], ['heroImage', 'Hero image']].map(([field, label]) => <div key={field} className="grid gap-3 md:grid-cols-[140px_1fr_auto]"><div className="h-24 overflow-hidden rounded-lg bg-slate-100">{value[field] ? <img src={value[field]} alt="" className="h-full w-full object-cover" /> : <Images className="m-auto mt-9 text-slate-400" size={22} />}</div><label className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label} URL</span><input className={inputClass} value={value[field]} onChange={(e) => onChange({ ...value, [field]: e.target.value })} /></label><button type="button" onClick={() => setPicker(field)} className="min-h-10 self-end rounded-lg border border-slate-200 px-3 text-sm font-semibold">Choose media</button></div>)}
    <div><div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-slate-900">Gallery</h3><p className="text-xs text-slate-500">Reuse canonical Media Library assets.</p></div><button type="button" onClick={() => setPicker('gallery')} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold"><Plus size={15} />Add image</button></div><div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">{(value.gallery || []).map((url, index) => <div key={`${url}-${index}`} className="group relative aspect-4/3 overflow-hidden rounded-lg bg-slate-100"><img src={url} alt="" className="h-full w-full object-cover" /><button type="button" onClick={() => onChange({ ...value, gallery: value.gallery.filter((_, idx) => idx !== index) })} className="absolute right-2 top-2 h-8 w-8 rounded-lg bg-slate-950/75 text-white"><Trash2 size={14} className="mx-auto" /></button></div>)}</div></div>
    <MediaLibraryModal isOpen={Boolean(picker)} onClose={() => setPicker(null)} onSelectMedia={select} initialDestination={value.destination} initialLocation={value.location} onOpenUpload={() => { setUploadTarget(picker); setUploadOpen(true); }} />
    {uploadOpen && <UploadLocationImageModal isOpen onClose={() => setUploadOpen(false)} onAssetCreated={uploaded} initialDestination={value.destination} initialLocationName={value.location} />}
  </div>;
};

export default TripMediaForm;
