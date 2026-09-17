import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock3, Loader2, RefreshCw, UserCheck, UserX } from 'lucide-react';
import { getInfluencerApplicationsApi } from '../../../../services/api.js';
import CreatorFilters from './components/CreatorFilters.jsx';
import CreatorApplicationsTable from './components/CreatorApplicationsTable.jsx';
import CreatorApplicationCard from './components/CreatorApplicationCard.jsx';

const initialFilters = { search: '', status: 'all', sort: 'applied_desc' };

const CreatorApplicationsWorkspace = () => {
  const [filters, setFilters] = useState(initialFilters);
  const [querySearch, setQuerySearch] = useState('');
  const [page, setPage] = useState(1);
  const [applications, setApplications] = useState([]);
  const [counts, setCounts] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => { const timer = setTimeout(() => { setPage(1); setQuerySearch(filters.search.trim()); }, 300); return () => clearTimeout(timer); }, [filters.search]);
  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try { const result = await getInfluencerApplicationsApi({ envelope: true, search: querySearch, status: filters.status, sort: filters.sort, page, limit: 25 }); setApplications(result.applications || []); setCounts(result.counts || {}); setPagination(result.pagination || { page: 1, pages: 0, total: 0 }); }
    catch (loadError) { setError(loadError.message || 'Unable to load creator applications.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filters.sort, filters.status, page, querySearch]);
  useEffect(() => { load(); }, [load]);
  const changeFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); if (key !== 'search') setPage(1); };
  const metrics = [{ label: 'Pending', value: counts.pending || 0, icon: Clock3, tone: 'text-amber-600' }, { label: 'Approved', value: counts.approved || 0, icon: CheckCircle2, tone: 'text-emerald-600' }, { label: 'Rejected', value: counts.rejected || 0, icon: UserX, tone: 'text-rose-600' }];

  return <div className="space-y-5"><header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Creator Approvals</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review MongoDB-backed applications and make persisted creator-role decisions.</p></div><button type="button" onClick={() => load(true)} disabled={refreshing} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh</button></header><section className="grid grid-cols-3 gap-3">{metrics.map(({ label, value, icon: Icon, tone }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><Icon size={16} className={tone} /></div><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></article>)}</section><CreatorFilters filters={filters} onChange={changeFilter} />{error ? <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" /><h2 className="mt-3 font-semibold text-rose-900">Unable to load creator applications.</h2><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => load()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">Retry</button></section> : loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading creator applications…</section> : applications.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><UserCheck size={28} className="mx-auto text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">No creator applications found.</h2><p className="mt-1 text-sm text-slate-500">Adjust the status or search filters.</p></section> : <><CreatorApplicationsTable applications={applications} /><div className="grid gap-3 lg:hidden">{applications.map((application) => <CreatorApplicationCard key={application._id} user={application} />)}</div></>}{!loading && pagination.pages > 0 && <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">{pagination.total} application{pagination.total === 1 ? '' : 's'} · Page {pagination.page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={15} />Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40">Next<ChevronRight size={15} /></button></div></footer>}</div>;
};

export default CreatorApplicationsWorkspace;

