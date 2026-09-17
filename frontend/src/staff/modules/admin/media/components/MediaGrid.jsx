import React from 'react';
import { Copy, FileText, Pencil, Play, Search } from 'lucide-react';
import { formatMediaDate, getMediaUrl, humanizeMediaValue } from '../mediaHelpers.js';

const MediaGrid = ({ assets, onPreview, onEdit, onCopy }) => (
  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {assets.map((asset) => {
      const url = getMediaUrl(asset);
      return <article key={asset._id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <button type="button" onClick={() => onPreview(asset)} className="group relative block aspect-[16/10] w-full overflow-hidden bg-slate-100 text-left">
          {asset.type === 'IMAGE' ? <img src={url} alt={asset.altText || asset.title} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" /> : <span className="flex h-full items-center justify-center text-slate-400">{asset.type === 'VIDEO' ? <Play size={34} /> : <FileText size={34} />}</span>}
          <span className="absolute left-3 top-3 rounded-full border border-white/30 bg-slate-950/75 px-2 py-0.5 text-[10px] font-semibold text-white">{humanizeMediaValue(asset.type)}</span>
          {!asset.active && <span className="absolute right-3 top-3 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">Archived</span>}
        </button>
        <div className="p-4"><h2 className="truncate text-sm font-semibold text-slate-950">{asset.title}</h2><p className="mt-1 truncate text-xs text-slate-500">{asset.geography?.destination || 'No destination'}{asset.geography?.poi ? ` · ${asset.geography.poi}` : ''}</p><div className="mt-3 flex items-center justify-between text-[11px] text-slate-400"><span>{(asset.categories || []).join(', ') || 'Uncategorised'}</span><span>{formatMediaDate(asset.createdAt)}</span></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3"><button type="button" onClick={() => onPreview(asset)} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"><Search size={13} />View</button><button type="button" onClick={() => onEdit(asset)} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"><Pencil size={13} />Edit</button><button type="button" onClick={() => onCopy(asset)} className="inline-flex min-h-9 items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700"><Copy size={13} />URL</button></div></div>
      </article>;
    })}
  </div>
);

export default MediaGrid;

