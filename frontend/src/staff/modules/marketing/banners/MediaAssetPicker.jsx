import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Image, RefreshCw, Search } from 'lucide-react';
import { listMediaAssetsApi } from '../../../../services/api';
import { getApiErrorMessage } from '../../../../services/apiConfig';

export default function MediaAssetPicker({ value, onSelect }) {
  const [open, setOpen] = useState(false);
  const [assets, setAssets] = useState([]);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ pages: 1 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const triggerRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    window.requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let cancelled = false;
    setLoading(true);
    setError('');
    listMediaAssetsApi({ type: 'IMAGE', search, page, limit: 18 })
      .then((data) => {
        if (cancelled) return;
        setAssets(data.data || []);
        setPagination(data.pagination || { pages: 1 });
      })
      .catch((requestError) => {
        if (!cancelled) setError(getApiErrorMessage(requestError, 'Unable to load approved media.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, page, search]);

  const submit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(query.trim());
  };

  const close = () => setOpen(false);
  const dialog = open && createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}
    >
      <section
        className="flex max-h-[90dvh] w-full max-w-[1100px] min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="approved-media-title"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="approved-media-title" className="font-semibold text-slate-950">Approved media</h2>
            <p className="mt-1 text-xs leading-5 text-slate-500">Active image assets only. This picker does not grant Media Library administration.</p>
          </div>
          <button ref={closeRef} type="button" onClick={close} className="shrink-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Close</button>
        </header>

        <form onSubmit={submit} className="flex shrink-0 flex-col gap-2 border-b border-slate-100 p-4 sm:flex-row">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search approved media</span>
            <Search size={15} className="pointer-events-none absolute left-3 top-3 text-slate-400" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, destination, or caption" className="min-h-10 w-full min-w-0 rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
          </label>
          <button type="submit" className="min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Search</button>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
          {error ? (
            <p className="rounded-lg bg-rose-50 p-4 text-sm text-rose-700">{error}</p>
          ) : loading ? (
            <RefreshCw className="mx-auto my-16 animate-spin text-slate-400" />
          ) : assets.length ? (
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {assets.map((asset) => (
                <button
                  type="button"
                  key={asset._id}
                  onClick={() => { onSelect(asset); close(); }}
                  className="group min-w-0 overflow-hidden rounded-xl border border-slate-200 text-left hover:border-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="relative aspect-video bg-slate-100">
                    <img src={asset.storage?.secureUrl} alt={asset.altText || asset.title} loading="lazy" className="h-full w-full object-cover" />
                    {value === asset._id && <span className="absolute right-2 top-2 rounded-full bg-emerald-600 p-1 text-white"><Check size={13} /></span>}
                  </div>
                  <div className="p-3">
                    <p className="truncate text-sm font-semibold text-slate-900">{asset.title}</p>
                    <p className="truncate text-xs text-slate-500">{asset.geography?.destination || 'Shared media'}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p className="py-16 text-center text-sm text-slate-500">No approved images match this search.</p>
          )}
        </div>

        <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-slate-200 bg-white p-4 text-sm text-slate-500">
          <span>Page {pagination.page || page} of {pagination.pages || 1}</span>
          <div className="flex gap-2">
            <button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Previous</button>
            <button type="button" disabled={page >= (pagination.pages || 1)} onClick={() => setPage((current) => current + 1)} className="rounded-lg border border-slate-200 px-3 py-2 disabled:opacity-40">Next</button>
          </div>
        </footer>
      </section>
    </div>,
    document.body
  );

  return (
    <>
      <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
        <Image size={16} />{value ? 'Change approved image' : 'Choose approved image'}
      </button>
      {dialog}
    </>
  );
}
