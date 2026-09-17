import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Headphones, Loader2, RefreshCw, TimerOff, UserRoundPlus } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  createFollowUpApi,
  getAdminLeadsApi,
  getLeadByIdApi,
  getSalesDashboardApi,
  logLeadContactApi,
  updateLeadStatusApi
} from '../../../services/api.js';
import useDebouncedValue from '../../../hooks/useDebouncedValue.js';
import ContactOutcomeModal from './components/ContactOutcomeModal.jsx';
import ExpertRequestDrawer from './components/ExpertRequestDrawer.jsx';
import ExpertRequestFilters from './components/ExpertRequestFilters.jsx';
import ExpertRequestMobileCard from './components/ExpertRequestMobileCard.jsx';
import ExpertRequestTable from './components/ExpertRequestTable.jsx';
import FollowUpModal from './components/FollowUpModal.jsx';
import LostReasonModal from './components/LostReasonModal.jsx';
import SalesMetricCard from './components/SalesMetricCard.jsx';
import { SALES_VIEW_IDS, getMetricValue } from './salesNavigation.js';
import { getCallbackState, getLeadId } from './salesUtils.js';

const METRIC_CARDS = [
  { view: 'all', label: 'Total Requests', icon: Headphones },
  { view: 'new', label: 'New', icon: UserRoundPlus },
  { view: 'due_today', label: 'Due Today', icon: Clock3 },
  { view: 'overdue', label: 'Overdue', icon: TimerOff },
  { view: 'in_progress', label: 'In Progress', icon: RefreshCw },
  { view: 'qualified', label: 'Qualified', icon: CheckCircle2 }
];

const ExpertRequestsWorkspace = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const requestedView = searchParams.get('view') || 'all';
  const requestedLeadId = searchParams.get('leadId');
  const view = SALES_VIEW_IDS.has(requestedView) ? requestedView : 'all';

  const [leads, setLeads] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(true);
  const [metricsError, setMetricsError] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const [status, setStatus] = useState('all');
  const [priority, setPriority] = useState('all');
  const [callbackTiming, setCallbackTiming] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [selectedLead, setSelectedLead] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeModal, setActiveModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (requestedView !== view) {
      setSearchParams(view === 'all' ? {} : { view }, { replace: true });
    }
  }, [requestedView, setSearchParams, view]);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    setMetricsError(false);
    try {
      const data = await getSalesDashboardApi();
      setMetrics(data?.metrics || {});
    } catch {
      setMetrics({});
      setMetricsError(true);
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const loadQueue = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const data = await getAdminLeadsApi({
        envelope: true,
        leadType: 'callback_request',
        quickFilter: view === 'all' ? undefined : view,
        status,
        priority,
        search: debouncedSearch,
        limit: 100,
        sortBy: 'effective_priority'
      });
      setLeads(Array.isArray(data?.items) ? data.items : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load Expert Requests.');
      setLeads([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, priority, status, view]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const handleViewChange = (nextView) => {
    setSearchParams(nextView === 'all' ? {} : { view: nextView });
  };

  const filteredLeads = useMemo(() => {
    if (callbackTiming === 'all') return leads;
    return leads.filter((lead) => getCallbackState(lead).id === callbackTiming);
  }, [callbackTiming, leads]);

  const updateLeadInState = useCallback((updatedLead) => {
    if (!updatedLead) return;
    const updatedId = String(getLeadId(updatedLead));
    setLeads((current) => current.map((lead) => String(getLeadId(lead)) === updatedId ? updatedLead : lead));
    setSelectedLead((current) => String(getLeadId(current)) === updatedId ? updatedLead : current);
  }, []);

  const handleOpenLead = useCallback(async (lead) => {
    setSelectedLead(lead);
    setDetailLoading(true);
    setNotice('');
    try {
      const detailedLead = await getLeadByIdApi(getLeadId(lead));
      setSelectedLead(detailedLead);
    } catch (detailError) {
      setNotice(detailError.message || 'Detailed request data is unavailable.');
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!requestedLeadId || String(getLeadId(selectedLead)) === requestedLeadId) return;
    handleOpenLead({ _id: requestedLeadId });
  }, [handleOpenLead, requestedLeadId, selectedLead]);

  const refreshSelectedLead = useCallback(async () => {
    if (!selectedLead) return;
    try {
      const detailedLead = await getLeadByIdApi(getLeadId(selectedLead));
      updateLeadInState(detailedLead);
    } catch {
      // The successful mutation remains authoritative even if the detail refresh fails.
    }
  }, [selectedLead, updateLeadInState]);

  const handleStatusChange = async (nextStatus) => {
    if (!selectedLead || nextStatus === selectedLead.status) return;
    if (nextStatus === 'LOST') {
      setActiveModal('lost');
      return;
    }
    setSaving(true);
    setNotice('');
    try {
      const data = await updateLeadStatusApi(getLeadId(selectedLead), { status: nextStatus });
      updateLeadInState(data?.lead);
      setNotice(`Status updated to ${nextStatus.replaceAll('_', ' ')}.`);
      await loadMetrics();
    } catch (statusError) {
      setNotice(statusError.message || 'Unable to update status.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogContact = async (payload) => {
    setSaving(true);
    setNotice('');
    try {
      const data = await logLeadContactApi(getLeadId(selectedLead), payload);
      updateLeadInState(data?.lead);
      setActiveModal(null);
      setNotice('Contact outcome recorded.');
      await loadMetrics();
    } catch (actionError) {
      setNotice(actionError.message || 'Unable to record contact outcome.');
    } finally {
      setSaving(false);
    }
  };

  const handleScheduleFollowUp = async (payload) => {
    setSaving(true);
    setNotice('');
    try {
      await createFollowUpApi(payload);
      setActiveModal(null);
      setNotice('Follow-up scheduled.');
      await Promise.all([refreshSelectedLead(), loadQueue(true), loadMetrics()]);
    } catch (actionError) {
      setNotice(actionError.message || 'Unable to schedule follow-up.');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkLost = async (payload) => {
    setSaving(true);
    setNotice('');
    try {
      const data = await updateLeadStatusApi(getLeadId(selectedLead), payload);
      updateLeadInState(data?.lead);
      setActiveModal(null);
      setNotice('Request marked as lost.');
      await loadMetrics();
    } catch (actionError) {
      setNotice(actionError.message || 'Unable to mark request as lost.');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([loadQueue(true), loadMetrics()]);
  };

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Sales · Shared queue</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Expert Requests</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Every Sales specialist and administrator works from this same queue. Activity is attributed to the staff member who performs it.</p>
        </div>
        <button type="button" onClick={handleRefresh} disabled={refreshing} className="flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} aria-hidden="true" /> Refresh queue
        </button>
      </section>

      <section aria-label="Expert request metrics">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {METRIC_CARDS.map((item) => (
            <SalesMetricCard key={item.view} label={item.label} value={getMetricValue(metrics, item.view)} icon={item.icon} active={view === item.view} loading={metricsLoading} unavailable={metricsError} onClick={() => handleViewChange(item.view)} />
          ))}
        </div>
        {metricsError && <p className="mt-2 text-xs text-rose-700">Queue metrics are temporarily unavailable. Request records can still be used below.</p>}
      </section>

      <ExpertRequestFilters
        view={view}
        metrics={metrics}
        search={search}
        status={status}
        priority={priority}
        callbackTiming={callbackTiming}
        onViewChange={handleViewChange}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
        onPriorityChange={setPriority}
        onCallbackTimingChange={setCallbackTiming}
      />

      {error ? (
        <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center">
          <AlertCircle size={24} className="mx-auto text-rose-600" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-rose-900">Unable to load Expert Requests</h3>
          <p className="mt-1 text-sm text-rose-700">{error}</p>
          <button type="button" onClick={() => loadQueue()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white hover:bg-rose-600">Retry</button>
        </section>
      ) : loading ? (
        <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500">
          <Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Loading shared queue…
        </section>
      ) : filteredLeads.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center">
          <Headphones size={28} className="mx-auto text-slate-300" aria-hidden="true" />
          <h3 className="mt-3 font-semibold text-slate-900">{leads.length === 0 && !search && status === 'all' && priority === 'all' ? 'No Expert Requests found' : 'No requests match these filters'}</h3>
          <p className="mt-1 text-sm text-slate-500">Try another queue view or clear a filter.</p>
        </section>
      ) : (
        <>
          <ExpertRequestTable leads={filteredLeads} onView={handleOpenLead} />
          <div className="grid gap-3 xl:hidden">
            {filteredLeads.map((lead) => <ExpertRequestMobileCard key={getLeadId(lead)} lead={lead} onView={handleOpenLead} />)}
          </div>
        </>
      )}

      {notice && (
        <div role="status" className="fixed bottom-4 right-4 z-[80] max-w-sm rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 text-sm text-white shadow-xl">
          <div className="flex items-start justify-between gap-4"><span>{notice}</span><button type="button" onClick={() => setNotice('')} className="text-slate-300 hover:text-white" aria-label="Dismiss message">×</button></div>
        </div>
      )}

      {selectedLead && (
        <ExpertRequestDrawer
          lead={selectedLead}
          loading={detailLoading}
          saving={saving}
          modalOpen={Boolean(activeModal)}
          onClose={() => { setSelectedLead(null); setActiveModal(null); }}
          onStatusChange={handleStatusChange}
          onLogContact={() => setActiveModal('outcome')}
          onScheduleFollowUp={() => setActiveModal('followup')}
          onCreateQuotation={() => navigate(`/staff/sales/quotations/new?leadId=${getLeadId(selectedLead)}`)}
          onOpenQuotation={(quotation) => navigate(`/staff/sales/quotations/${quotation._id || quotation.id || quotation.quotationNumber}`)}
          onOpenBooking={(booking) => navigate(`/staff/sales/bookings/${booking.bookingId || booking._id}`)}
        />
      )}

      {activeModal === 'outcome' && selectedLead && <ContactOutcomeModal lead={selectedLead} saving={saving} onClose={() => setActiveModal(null)} onSubmit={handleLogContact} />}
      {activeModal === 'followup' && selectedLead && <FollowUpModal lead={selectedLead} saving={saving} onClose={() => setActiveModal(null)} onSubmit={handleScheduleFollowUp} />}
      {activeModal === 'lost' && selectedLead && <LostReasonModal lead={selectedLead} saving={saving} onClose={() => setActiveModal(null)} onSubmit={handleMarkLost} />}
    </div>
  );
};

export default ExpertRequestsWorkspace;
