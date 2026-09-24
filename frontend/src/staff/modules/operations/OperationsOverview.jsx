import { useCallback, useEffect, useState } from 'react';
import { Activity, AlertTriangle, CalendarClock, CheckCircle2, Clock3, Compass, Info, RefreshCw, Route, UsersRound } from 'lucide-react';
import { getOperationsDashboardApi } from '../../../services/api.js';
import OperationsMetricCard from './components/OperationsMetricCard.jsx';
import OperationsAttentionList from './components/OperationsAttentionList.jsx';
import OperationsDepartureTable from './components/OperationsDepartureTable.jsx';

const DashboardSkeleton = () => <div className="space-y-5" aria-label="Loading Operations dashboard"><div className="h-36 animate-pulse rounded-xl border border-slate-200 bg-white"/><div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">{Array.from({ length: 6 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl border border-slate-200 bg-white"/>)}</div><div className="h-56 animate-pulse rounded-xl border border-slate-200 bg-white"/></div>;

const Section = ({ eyebrow, title, description, children }) => <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5"><div className="mb-4"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-emerald-700">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{children}</section>;

export default function OperationsOverview() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ refresh = false } = {}) => {
    refresh ? setRefreshing(true) : setLoading(true);
    setError('');
    try { setDashboard(await getOperationsDashboardApi()); }
    catch (requestError) { setError(requestError.message || 'Unable to load Operations dashboard.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <DashboardSkeleton/>;
  if (error && !dashboard) return <div className="rounded-xl border border-rose-200 bg-white p-8 text-center"><AlertTriangle className="mx-auto text-rose-600" size={28}/><h1 className="mt-3 text-lg font-semibold text-slate-950">Unable to load Operations dashboard.</h1><p className="mt-2 text-sm text-slate-600">{error}</p><button type="button" onClick={() => load()} className="mt-5 min-h-10 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white">Retry</button></div>;

  const summary = dashboard.summary;
  const noTrips = summary.operationalTrips === 0;
  return <div className="space-y-5">
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-7 sm:py-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-emerald-700">Operations</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Operations Control Center</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Monitor confirmed journeys from booking handoff through departure timing, traveler readiness and operational attention.</p></div><div className="flex shrink-0 items-center gap-3"><p className="text-right text-xs text-slate-500">Last updated<br/><span className="font-medium text-slate-700">{new Date(dashboard.generatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></p><button type="button" onClick={() => load({ refresh: true })} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''}/>Refresh</button></div></div></section>

    {error && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">Latest refresh failed: {error}. Showing the last loaded snapshot.</p>}

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <OperationsMetricCard label="Operational Trips" value={summary.operationalTrips} detail={`${summary.activeBookings} eligible bookings`} icon={Route} tone="slate"/>
      <OperationsMetricCard label="Upcoming" value={summary.upcoming} detail={`${summary.travelers} travelers in scope`} icon={CalendarClock} tone="sky"/>
      <OperationsMetricCard label="Starting Soon" value={summary.startingSoon} detail={`Within ${dashboard.definitions.startingSoonDays} days`} icon={Clock3} tone="amber"/>
      <OperationsMetricCard label="Ongoing" value={summary.ongoing} detail="Travel window active" icon={Activity} tone="emerald"/>
      <OperationsMetricCard label="Needs Attention" value={summary.attentionRequired} detail="Fact-based readiness flags" icon={AlertTriangle} tone="rose"/>
      <OperationsMetricCard label="Completed" value={summary.completed} detail="Derived from travel dates" icon={CheckCircle2} tone="slate"/>
    </div>

    <div className="flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900"><Info className="mt-0.5 shrink-0" size={17}/><p><strong>How trips are counted:</strong> Operational Trips are grouped confirmed and provisionally confirmed bookings. Catalog bookings on the same Trip departure count as one operational departure; custom quotation bookings remain separate journeys. {summary.awaitingHandoff > 0 && <span className="ml-1">{summary.awaitingHandoff} pending-payment booking{summary.awaitingHandoff === 1 ? '' : 's'} await handoff and are not included.</span>}</p></div>

    {noTrips ? <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center"><Compass className="mx-auto text-slate-300" size={36}/><h2 className="mt-4 text-lg font-semibold text-slate-950">No operational trips yet.</h2><p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">Confirmed and provisionally confirmed bookings will appear here automatically.</p></div> : <>
      <Section eyebrow="Priority" title="Needs Attention" description="Only issues derived from current Booking and Trip facts are shown."><OperationsAttentionList departures={dashboard.attention}/></Section>
      <Section eyebrow="Live travel windows" title="Ongoing Now"><OperationsDepartureTable departures={dashboard.ongoing} emptyMessage="No operational departures are ongoing today."/></Section>
      <Section eyebrow="Nearest first" title="Upcoming Departures"><OperationsDepartureTable departures={dashboard.upcoming} emptyMessage="No upcoming operational departures."/></Section>
      {dashboard.unresolved.length > 0 && <Section eyebrow="Data quality" title="Data Needs Review" description="These confirmed journeys cannot be placed on the calendar until their travel dates are resolved."><OperationsDepartureTable departures={dashboard.unresolved} emptyMessage="No unresolved journey dates."/></Section>}
      <Section eyebrow="Travel window ended" title="Recently Completed"><OperationsDepartureTable departures={dashboard.recentlyCompleted} emptyMessage="No completed operational departures yet."/></Section>
    </>}

    <div className="flex items-start gap-2 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500"><UsersRound className="mt-0.5 shrink-0" size={15}/><p>Read-only Phase 1 view. No vendor, driver, task, incident, expense or settlement state is inferred by this dashboard.</p></div>
  </div>;
}
