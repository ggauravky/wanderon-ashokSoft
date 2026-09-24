import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, ClipboardList, Loader2, RefreshCw, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ensureOperationalTripApi, getOperationsTripsApi } from '../../../../services/api.js';
import OperationsStatusBadge from '../components/OperationsStatusBadge.jsx';
import { formatOperationsWindow, formatStartTiming } from '../helpers/operationsFormatters.js';

const initialFilters = { search: '', phase: 'all', readiness: 'all', sourceType: 'all', attentionOnly: false, sort: 'soonest' };
const selectClass = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500';

const Readiness = ({ row }) => {
  const value = row.execution.readiness;
  return <div><OperationsStatusBadge value={value.status}/><p className="mt-1 text-[11px] text-slate-500">{value.confirmedRequiredServices}/{value.requiredServices} required confirmed</p></div>;
};

export default function OperationsTripsWorkspace() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await getOperationsTripsApi({ ...filters, attentionOnly: filters.attentionOnly ? 'true' : '', page, limit: 20 });
      setRows(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 0, total: 0 });
    } catch (requestError) { setError(requestError.message || 'Unable to load Trip Execution.'); }
    finally { setLoading(false); }
  }, [filters, page]);

  useEffect(() => { const timer = setTimeout(() => { void load(); }, 250); return () => clearTimeout(timer); }, [load]);
  const change = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); setPage(1); };
  const openExecution = async (row) => {
    setOpening(row.operationKey); setError('');
    try {
      const operationId = row.execution.operationalTripId || (await ensureOperationalTripApi(row.operationKey)).data.operationalTrip._id;
      navigate(`/staff/operations/trips/${operationId}`);
    } catch (requestError) { setError(requestError.message || 'Unable to open this operational departure.'); setOpening(''); }
  };

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">Operations · Execution</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Trip Execution</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Open confirmed departures, assign real service providers, and track factual confirmation readiness.</p></div><button type="button" onClick={load} disabled={loading} className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>Refresh</button></header>

    <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 md:grid-cols-2 xl:grid-cols-6"><label className="relative xl:col-span-2"><Search className="pointer-events-none absolute left-3 top-3 text-slate-400" size={15}/><input value={filters.search} onChange={(event) => change('search', event.target.value)} placeholder="Journey, destination, booking…" className="min-h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500"/></label><select value={filters.phase} onChange={(event) => change('phase', event.target.value)} className={selectClass}><option value="all">All phases</option><option value="UPCOMING">Upcoming</option><option value="ONGOING">Ongoing</option><option value="COMPLETED">Completed</option><option value="DATE_UNRESOLVED">Date unresolved</option></select><select value={filters.readiness} onChange={(event) => change('readiness', event.target.value)} className={selectClass}><option value="all">All readiness</option><option value="NOT_CONFIGURED">Not configured</option><option value="IN_PROGRESS">In progress</option><option value="READY">Ready</option></select><select value={filters.sourceType} onChange={(event) => change('sourceType', event.target.value)} className={selectClass}><option value="all">Catalog &amp; custom</option><option value="CATALOG">Catalog</option><option value="CUSTOM">Custom</option></select><select value={filters.sort} onChange={(event) => change('sort', event.target.value)} className={selectClass}><option value="soonest">Departure soonest</option><option value="attention">Attention first</option><option value="recent">Recently updated</option></select><label className="flex min-h-10 items-center gap-2 text-sm text-slate-700 md:col-span-2 xl:col-span-6"><input type="checkbox" checked={filters.attentionOnly} onChange={(event) => change('attentionOnly', event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600"/>Show attention-required departures only</label></section>

    {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    {loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={18}/>Loading operational departures…</section> : rows.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><ClipboardList className="mx-auto text-slate-300" size={34}/><h2 className="mt-3 font-semibold text-slate-950">No operational departures match these filters.</h2><p className="mt-1 text-sm text-slate-500">Confirmed Booking handoffs appear here automatically.</p></section> : <>
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white lg:block"><table className="min-w-[1120px] w-full text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{['Journey','Type','Departure','Load','Coordinator','Readiness','Service confirmation','Attention','Action'].map((label) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{rows.map((row) => <tr key={row.operationKey} className="align-top"><td className="px-4 py-4"><p className="font-semibold text-slate-950">{row.title}</p><p className="mt-1 text-xs text-slate-500">{row.destination || 'Destination not recorded'}</p></td><td className="px-4 py-4"><OperationsStatusBadge value={row.type}/></td><td className="px-4 py-4 text-xs text-slate-600"><p>{formatOperationsWindow(row)}</p><p className="mt-1 font-medium text-slate-700">{formatStartTiming(row)}</p></td><td className="px-4 py-4 text-xs text-slate-600">{row.bookingCount} bookings<br/>{row.travelerCount} travelers</td><td className="px-4 py-4 text-xs text-slate-600">{row.execution.coordinator?.name || 'Unassigned'}</td><td className="px-4 py-4"><Readiness row={row}/></td><td className="px-4 py-4 text-xs text-slate-600">{row.execution.readiness.pendingRequiredServices} pending<br/>{row.execution.readiness.unassignedRequiredServices} unassigned</td><td className="px-4 py-4">{row.attention.required ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700"><AlertTriangle size={14}/>{row.attention.severity}</span> : <span className="text-xs text-slate-400">Clear</span>}</td><td className="px-4 py-4"><button type="button" onClick={() => openExecution(row)} disabled={opening === row.operationKey} className="min-h-9 whitespace-nowrap rounded-lg bg-slate-950 px-3 text-xs font-semibold text-white disabled:opacity-50">{opening === row.operationKey ? 'Opening…' : 'Open Execution'}</button></td></tr>)}</tbody></table></div>
      <div className="grid gap-3 lg:hidden">{rows.map((row) => <article key={row.operationKey} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-950">{row.title}</h2><p className="mt-1 text-xs text-slate-500">{row.destination || 'Destination not recorded'} · {formatStartTiming(row)}</p></div><OperationsStatusBadge value={row.type}/></div><div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-400">Travel window</p><p className="mt-1 font-medium text-slate-700">{formatOperationsWindow(row)}</p></div><div><p className="text-slate-400">Load</p><p className="mt-1 font-medium text-slate-700">{row.bookingCount} bookings · {row.travelerCount} travelers</p></div><div><p className="text-slate-400">Coordinator</p><p className="mt-1 font-medium text-slate-700">{row.execution.coordinator?.name || 'Unassigned'}</p></div><Readiness row={row}/></div><button type="button" onClick={() => openExecution(row)} disabled={opening === row.operationKey} className="mt-4 min-h-10 w-full rounded-lg bg-slate-950 px-3 text-sm font-semibold text-white disabled:opacity-50">{opening === row.operationKey ? 'Opening…' : 'Open Execution'}</button></article>)}</div>
    </>}

    {!loading && pagination.pages > 0 && <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">{pagination.total} departure{pagination.total === 1 ? '' : 's'} · Page {pagination.page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={15}/>Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40">Next<ChevronRight size={15}/></button></div></footer>}
  </div>;
}
