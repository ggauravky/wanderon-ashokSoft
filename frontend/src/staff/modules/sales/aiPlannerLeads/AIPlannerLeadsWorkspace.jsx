import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, RefreshCw, Search, Sparkles, WandSparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDebouncedValue from '../../../../hooks/useDebouncedValue.js';
import { getAiPlannerLeadsApi } from '../../../../services/api.js';
import { formatDate, getLeadId, getStatusClasses } from '../salesUtils.js';
import { LEAD_STATUSES } from '../salesNavigation.js';

const travelerLabel = (lead) => {
  const breakdown = lead?.sourceItineraryId?.plannerContext?.travelersBreakdown;
  if (breakdown) {
    const parts = [
      breakdown.adults ? `${breakdown.adults} adult${breakdown.adults === 1 ? '' : 's'}` : '',
      breakdown.children ? `${breakdown.children} child${breakdown.children === 1 ? '' : 'ren'}` : '',
      breakdown.infants ? `${breakdown.infants} infant${breakdown.infants === 1 ? '' : 's'}` : '',
      breakdown.seniors ? `${breakdown.seniors} senior${breakdown.seniors === 1 ? '' : 's'}` : ''
    ].filter(Boolean);
    if (parts.length) return parts.join(' · ');
  }
  return `${lead?.travelersCount || 1} traveler${Number(lead?.travelersCount || 1) === 1 ? '' : 's'}`;
};

const travelPeriod = (lead) => {
  const planner = lead?.sourceItineraryId?.plannerContext || {};
  if (planner.datesFlexible !== false) return planner.flexibleMonth ? `${planner.flexibleMonth} · Flexible` : lead.travelMonth || 'Flexible dates';
  return planner.startDate ? `${formatDate(planner.startDate)}${planner.endDate ? ` – ${formatDate(planner.endDate)}` : ''}` : lead.travelDate || 'Not provided';
};

const planningContext = (lead) => {
  const planner = lead?.sourceItineraryId?.plannerContext || {};
  return [...(planner.interests || []).slice(0, 2), planner.stayPreference].filter(Boolean).join(' · ') || 'Plan preferences available';
};

const quotationState = (lead) => {
  const quotations = Array.isArray(lead?.quotations) ? lead.quotations : [];
  return quotations.length ? quotations[quotations.length - 1]?.status || 'DRAFT' : 'Not created';
};

const LeadTable = ({ leads, onOpen }) => (
  <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white xl:block">
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1220px] text-left">
        <thead className="border-b border-slate-200 bg-slate-50 text-[11px] uppercase tracking-[0.08em] text-slate-500"><tr>{['Reference', 'Traveler', 'Trip', 'Travel period', 'Travelers', 'Planning context', 'Specialist', 'Quotation', 'Status', 'Action'].map((item) => <th key={item} className="px-4 py-3 font-semibold">{item}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-100">
          {leads.map((lead) => <tr key={getLeadId(lead)} className="align-top hover:bg-slate-50/70">
            <td className="px-4 py-4"><p className="font-mono text-xs font-semibold text-emerald-700">{lead.referenceId}</p><p className="mt-1 text-xs text-slate-400">{formatDate(lead.createdAt)}</p></td>
            <td className="px-4 py-4"><p className="max-w-44 truncate text-sm font-semibold text-slate-900">{lead.name}</p><p className="mt-1 text-xs text-slate-500">{lead.phone}</p><p className="max-w-44 truncate text-xs text-slate-400">{lead.email}</p></td>
            <td className="px-4 py-4"><p className="max-w-44 text-sm font-medium text-slate-900">{lead.sourceItineraryId?.title || lead.tripTitle || lead.destination}</p><p className="mt-1 text-xs text-slate-500">{lead.destination} · {lead.sourceItineraryId?.duration || '—'} days</p>{lead.planUpdatedAfterEnquiry && <p className="mt-1 text-[11px] font-semibold text-amber-700">Updated after enquiry</p>}</td>
            <td className="px-4 py-4 text-xs text-slate-600">{travelPeriod(lead)}</td>
            <td className="px-4 py-4 text-xs text-slate-600">{travelerLabel(lead)}</td>
            <td className="px-4 py-4"><p className="max-w-52 text-xs leading-5 text-slate-600">{planningContext(lead)}</p><span className="mt-2 inline-flex rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">AI Plan Attached</span></td>
            <td className="px-4 py-4 text-xs text-slate-600">{lead.assignedToUser?.name || lead.assignedToUserName || 'Unassigned'}</td>
            <td className="px-4 py-4 text-xs font-semibold text-slate-700">{quotationState(lead).replaceAll('_', ' ')}</td>
            <td className="px-4 py-4"><span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(lead.status)}`}>{lead.status?.replaceAll('_', ' ')}</span></td>
            <td className="px-4 py-4"><button type="button" onClick={() => onOpen(lead)} className="min-h-9 rounded-lg bg-slate-900 px-3 text-xs font-semibold text-white hover:bg-slate-800">Open</button></td>
          </tr>)}
        </tbody>
      </table>
    </div>
  </div>
);

const LeadCards = ({ leads, onOpen }) => <div className="grid gap-3 xl:hidden">{leads.map((lead) => <article key={getLeadId(lead)} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
  <button type="button" onClick={() => onOpen(lead)} className="w-full text-left">
    <div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-emerald-700">{lead.referenceId}</p><h3 className="mt-1 text-base font-semibold text-slate-950">{lead.name}</h3><p className="mt-1 text-sm text-slate-500">{lead.phone}</p></div><ChevronRight size={18} className="text-slate-400" aria-hidden="true" /></div>
    <div className="mt-4 grid gap-2 text-sm text-slate-600 sm:grid-cols-2"><p><strong className="text-slate-800">Trip:</strong> {lead.sourceItineraryId?.title || lead.tripTitle || lead.destination}</p><p><strong className="text-slate-800">Travel:</strong> {travelPeriod(lead)}</p><p><strong className="text-slate-800">Group:</strong> {travelerLabel(lead)}</p><p><strong className="text-slate-800">Assigned:</strong> {lead.assignedToUser?.name || lead.assignedToUserName || 'Unassigned'}</p></div>
    <div className="mt-4 flex flex-wrap gap-2"><span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${getStatusClasses(lead.status)}`}>{lead.status?.replaceAll('_', ' ')}</span><span className="rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-700">AI Plan Attached</span>{lead.planUpdatedAfterEnquiry && <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Plan updated</span>}</div>
  </button>
</article>)}</div>;

const AIPlannerLeadsWorkspace = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [filters, setFilters] = useState({ status: 'all', assignedToUser: 'all', destination: '', travelPeriod: '', createdFrom: '', createdTo: '', hasQuotation: 'all' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadLeads = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const result = await getAiPlannerLeadsApi({ ...filters, search: debouncedSearch, page, limit: 25, sortBy: 'newest' });
      setData({ items: result.items || [], total: result.total || 0, totalPages: result.totalPages || 1 });
    } catch (loadError) {
      setError(loadError.message || 'AI Planner leads are temporarily unavailable.');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }, [debouncedSearch, filters, page]);

  useEffect(() => { loadLeads(); }, [loadLeads]);
  const updateFilter = (key, value) => { setPage(1); setFilters((current) => ({ ...current, [key]: value })); };

  return <div className="space-y-5">
    <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Sales · AI planning pipeline</p><h2 className="mt-1 text-2xl font-semibold text-slate-950">AI Planner Leads</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Review each traveler’s persisted AI plan, preferences and CRM progress before preparing a commercial quotation.</p></div><button type="button" onClick={() => loadLeads(true)} disabled={refreshing} className="flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" /> Refresh</button></section>

    <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 md:grid-cols-2 xl:grid-cols-4" aria-label="AI Planner Lead filters">
      <label className="relative xl:col-span-2"><span className="sr-only">Search AI Planner Leads</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><input type="search" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search reference, traveler, phone, trip or destination…" className="min-h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
      <label><span className="sr-only">Lead status</span><select value={filters.status} onChange={(event) => updateFilter('status', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">All statuses</option>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
      <label><span className="sr-only">Assignment</span><select value={filters.assignedToUser} onChange={(event) => updateFilter('assignedToUser', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">Any specialist</option><option value="my">Assigned to me</option><option value="unassigned">Unassigned</option></select></label>
      <label><span className="sr-only">Destination</span><input value={filters.destination} onChange={(event) => updateFilter('destination', event.target.value)} placeholder="Destination" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
      <label><span className="sr-only">Travel period</span><input value={filters.travelPeriod} onChange={(event) => updateFilter('travelPeriod', event.target.value)} placeholder="Travel month or date" className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
      <label><span className="sr-only">Created from</span><input type="date" value={filters.createdFrom} onChange={(event) => updateFilter('createdFrom', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
      <label><span className="sr-only">Created to</span><input type="date" value={filters.createdTo} onChange={(event) => updateFilter('createdTo', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm" /></label>
      <label><span className="sr-only">Quotation state</span><select value={filters.hasQuotation} onChange={(event) => updateFilter('hasQuotation', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm"><option value="all">Any quotation state</option><option value="true">Has quotation</option><option value="false">No quotation</option></select></label>
    </section>

    {error ? <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" aria-hidden="true" /><h3 className="mt-3 font-semibold text-rose-900">AI Planner leads unavailable</h3><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => loadLeads()} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Retry</button></section>
      : loading ? <section aria-live="polite" className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Loading AI Planner leads…</section>
      : data.items.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><WandSparkles size={30} className="mx-auto text-slate-300" aria-hidden="true" /><h3 className="mt-3 font-semibold text-slate-900">No AI Planner leads yet</h3><p className="mt-1 text-sm text-slate-500">Traveler requests created from the WanderLuxe AI Planner will appear here automatically.</p></section>
      : <><LeadTable leads={data.items} onOpen={(lead) => navigate(`/staff/sales/ai-planner-leads/${getLeadId(lead)}`)} /><LeadCards leads={data.items} onOpen={(lead) => navigate(`/staff/sales/ai-planner-leads/${getLeadId(lead)}`)} /></>}

    {!loading && !error && data.total > 0 && <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between"><p><Sparkles size={14} className="mr-1 inline text-violet-500" aria-hidden="true" /> {data.total} AI Planner Lead{data.total === 1 ? '' : 's'}</p><div className="flex items-center gap-2"><button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page <= 1} className="flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 disabled:opacity-40"><ChevronLeft size={15} aria-hidden="true" /> Previous</button><span className="px-2">Page {page} of {data.totalPages}</span><button type="button" onClick={() => setPage((value) => Math.min(data.totalPages, value + 1))} disabled={page >= data.totalPages} className="flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 disabled:opacity-40">Next <ChevronRight size={15} aria-hidden="true" /></button></div></footer>}
  </div>;
};

export default AIPlannerLeadsWorkspace;
