import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Grid2X2, Image, List, Loader2, RefreshCw, Upload } from 'lucide-react';
import { deleteMediaAssetApi, getMediaAssetByIdApi, getMediaCoverageReportApi, listMediaAssetsApi, updateMediaAssetApi } from '../../../../services/api.js';
import useDebouncedValue from '../../../../hooks/useDebouncedValue.js';
import MediaFilters from './components/MediaFilters.jsx';
import MediaGrid from './components/MediaGrid.jsx';
import MediaList from './components/MediaList.jsx';
import MediaUploadModal from './components/MediaUploadModal.jsx';
import MediaEditModal from './components/MediaEditModal.jsx';
import MediaPreviewModal from './components/MediaPreviewModal.jsx';
import MediaCoveragePanel from './components/MediaCoveragePanel.jsx';
import { getMediaUrl } from './mediaHelpers.js';

const initialFilters = { search: '', type: 'all', destination: 'all', category: 'all', source: 'all', active: 'true' };

const MediaWorkspace = () => {
  const [assets, setAssets] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const debouncedSearch = useDebouncedValue(filters.search.trim());
  const [facets, setFacets] = useState({ destinations: [], categories: [], sources: [], types: [] });
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0, limit: 24 });
  const [page, setPage] = useState(1);
  const [view, setView] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [coverage, setCoverage] = useState(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const { type, destination, category, source, active } = filters;

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  const loadCoverage = useCallback(async () => { try { setCoverage(await getMediaCoverageReportApi()); } catch { setCoverage(null); } }, []);
  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const response = await listMediaAssetsApi({ admin: true, search: debouncedSearch, type, destination, category, source, active, page, limit: 24 });
      setAssets(Array.isArray(response.data) ? response.data : []);
      setFacets(response.facets || { destinations: response.destinations || [], categories: [], sources: [], types: [] });
      setPagination(response.pagination || { page, pages: 0, total: 0, limit: 24 });
    } catch (loadError) {
      setAssets([]);
      setError(loadError.message || 'Unable to load media.');
    } finally { setLoading(false); setRefreshing(false); }
  }, [active, category, debouncedSearch, destination, page, source, type]);
  useEffect(() => { load(); }, [load]);
  useEffect(() => { loadCoverage(); }, [loadCoverage]);

  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); if (key !== 'search') setPage(1); };
  const openPreview = async (asset) => { setError(''); try { setPreview(await getMediaAssetByIdApi(asset._id)); } catch (viewError) { setError(viewError.message); } };
  const copyUrl = async (asset) => { try { await navigator.clipboard.writeText(getMediaUrl(asset)); setNotice('Media URL copied.'); } catch { setNotice('Copy failed. Open the asset and copy its URL manually.'); } };
  const saveEdit = async (payload) => { setBusy(true); setError(''); try { const updated = await updateMediaAssetApi(editing._id, payload); setEditing(null); setPreview((current) => current?._id === updated._id ? { ...current, ...updated } : current); setNotice('Media metadata saved.'); await load(true); await loadCoverage(); } catch (saveError) { setError(saveError.message); } finally { setBusy(false); } };
  const archive = async (asset) => { setBusy(true); setError(''); try { const result = await deleteMediaAssetApi(asset._id); setPreview(null); setNotice(result.message); await load(true); await loadCoverage(); } catch (archiveError) { setError(archiveError.message); } finally { setBusy(false); } };
  const created = async () => { setUploadOpen(false); setNotice('Media asset uploaded and persisted.'); await load(true); await loadCoverage(); };

  return <div className="space-y-5"><header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Media Library</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">One MongoDB-backed asset library for Trips, Quotations, Pages, and itinerary media selection.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { load(true); loadCoverage(); }} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh</button><button type="button" onClick={() => setUploadOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"><Upload size={15} />Upload asset</button></div></header><MediaCoveragePanel coverage={coverage} /><MediaFilters filters={filters} facets={facets} onChange={updateFilter} />{notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}{error ? <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" /><h2 className="mt-3 font-semibold text-rose-900">Unable to load media</h2><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => load()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">Retry</button></section> : loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading media…</section> : assets.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Image size={28} className="mx-auto text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">No media assets found.</h2><p className="mt-1 text-sm text-slate-500">The Media Library only displays persisted MediaAsset records.</p></section> : <><div className="flex justify-end gap-1"><button type="button" onClick={() => setView('grid')} className={`rounded-lg p-2 ${view === 'grid' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500'}`} title="Grid view"><Grid2X2 size={16} /></button><button type="button" onClick={() => setView('list')} className={`rounded-lg p-2 ${view === 'list' ? 'bg-slate-900 text-white' : 'border border-slate-200 text-slate-500'}`} title="List view"><List size={16} /></button></div>{view === 'grid' ? <MediaGrid assets={assets} onPreview={openPreview} onEdit={setEditing} onCopy={copyUrl} /> : <MediaList assets={assets} onPreview={openPreview} onEdit={setEditing} onCopy={copyUrl} />}</>}{!loading && pagination.pages > 0 && <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">{pagination.total} asset{pagination.total === 1 ? '' : 's'} · Page {pagination.page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={15} />Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40">Next<ChevronRight size={15} /></button></div></footer>}<MediaUploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} onCreated={created} /><MediaEditModal asset={editing} busy={busy} onClose={() => setEditing(null)} onSave={saveEdit} /><MediaPreviewModal asset={preview} busy={busy} onClose={() => setPreview(null)} onCopy={copyUrl} onEdit={(asset) => { setPreview(null); setEditing(asset); }} onArchive={archive} /></div>;
};

export default MediaWorkspace;
