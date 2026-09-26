import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CalendarPlus, FileText, Loader2, PhoneCall, UserCheck, WandSparkles } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext.jsx';
import { createSmartQuotationFromAiLeadApi } from '../../../../services/quotationService.js';
import {
  assignLeadApi,
  claimLeadApi,
  createFollowUpApi,
  getAiPlannerLeadDossierApi,
  getSalesUsersApi,
  logLeadContactApi,
  updateLeadStatusApi
} from '../../../../services/api.js';
import ContactActionLinks from '../components/ContactActionLinks.jsx';
import ContactOutcomeModal from '../components/ContactOutcomeModal.jsx';
import FollowUpModal from '../components/FollowUpModal.jsx';
import LostReasonModal from '../components/LostReasonModal.jsx';
import { LEAD_STATUSES } from '../salesNavigation.js';
import { formatDate, formatDateTime, getLeadId, getStatusClasses } from '../salesUtils.js';
import AIPlannerLeadDossier from './components/AIPlannerLeadDossier.jsx';

const AIPlannerLeadDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = String(user?.role || '').toLowerCase();
  const canAssign = ['admin', 'super_admin'].includes(role);
  const [dossier, setDossier] = useState(null);
  const [salesUsers, setSalesUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [activeModal, setActiveModal] = useState(null);

  const loadDossier = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      setDossier(await getAiPlannerLeadDossierApi(id));
    } catch (loadError) {
      setError(loadError.message || 'Unable to load this AI Planner Lead.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { loadDossier(); }, [loadDossier]);
  useEffect(() => {
    if (!canAssign) return;
    getSalesUsersApi().then(setSalesUsers).catch(() => setSalesUsers([]));
  }, [canAssign]);

  const mutate = async (action, successMessage) => {
    setSaving(true); setNotice('');
    try {
      await action();
      setNotice(successMessage);
      setActiveModal(null);
      await loadDossier(true);
    } catch (actionError) {
      setNotice(actionError.message || 'The requested CRM action could not be completed.');
    } finally { setSaving(false); }
  };

  if (loading) return <section aria-live="polite" className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" aria-hidden="true" /> Loading AI Planner Lead dossier…</section>;
  if (error) return <section className="rounded-xl border border-rose-200 bg-rose-50 p-6"><AlertCircle size={24} className="text-rose-600" aria-hidden="true" /><h2 className="mt-3 font-semibold text-rose-900">Unable to load AI Planner Lead</h2><p className="mt-1 text-sm text-rose-700">{error}</p><div className="mt-4 flex gap-2"><button type="button" onClick={() => loadDossier()} className="rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white">Retry</button><Link to="/staff/sales/ai-planner-leads" className="rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-800">Back to leads</Link></div></section>;

  const lead = dossier?.lead || {};
  const itineraryId = lead.sourceItineraryId || dossier?.itinerary?._id;
  const quotations = dossier?.crm?.quotations || [];
  const latestQuotation = quotations[quotations.length - 1];
  const buildQuotationUrl = () => {
    const params = new URLSearchParams({ leadId: getLeadId(lead) });
    if (itineraryId) params.set('itineraryId', itineraryId);
    return `/staff/sales/quotations/new?${params.toString()}`;
  };
  const createSmartQuotation = async () => {
    setSaving(true); setNotice(''); setError('');
    try {
      const data = await createSmartQuotationFromAiLeadApi(getLeadId(lead));
      const quotationId = data.quotation?._id || data.quotation?.id;
      if (!quotationId) throw new Error('Smart quotation was created without a usable identifier.');
      navigate(`/staff/sales/quotations/${quotationId}/edit`, { state: { smartBuildSummary: data.buildSummary, smartBuildExisting: data.isExisting === true } });
    } catch (actionError) {
      setNotice(actionError.message || 'Unable to create smart quotation. Retry when ready.');
    } finally { setSaving(false); }
  };

  return <div className="space-y-5">
    <Link to="/staff/sales/ai-planner-leads" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={16} aria-hidden="true" /> AI Planner Leads</Link>

    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700"><WandSparkles size={15} aria-hidden="true" /> AI Planner Lead</p><p className="mt-2 font-mono text-xs font-semibold text-slate-500">{lead.referenceId}</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">{lead.name}</h1><p className="mt-1 text-sm text-slate-500">{dossier?.itinerary?.destination || lead.destination} · {dossier?.itinerary?.duration || '—'} days · Created {formatDateTime(lead.createdAt)}</p><div className="mt-3 flex flex-wrap gap-2"><span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClasses(lead.status)}`}>{lead.status?.replaceAll('_', ' ')}</span><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700">{lead.priority || 'MEDIUM'} priority</span><span className="rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-700">AI Plan {dossier?.sourcePlanState === 'AVAILABLE' ? 'Attached' : 'Unavailable'}</span></div><p className="mt-3 text-sm text-slate-600">Assigned specialist: <strong className="text-slate-900">{lead.assignedToUser?.name || lead.assignedToUserName || 'Unassigned'}</strong></p></div>
        <div className="flex max-w-2xl flex-wrap gap-2"><ContactActionLinks lead={lead} /><button type="button" onClick={() => setActiveModal('outcome')} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><PhoneCall size={15} aria-hidden="true" /> Log Contact</button><button type="button" onClick={() => setActiveModal('followup')} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"><CalendarPlus size={15} aria-hidden="true" /> Follow-up</button>{!lead.assignedToUser && !lead.assignedToUserName && <button type="button" disabled={saving} onClick={() => mutate(() => claimLeadApi(getLeadId(lead)), 'Lead claimed successfully.')} className="flex min-h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-sm font-semibold text-emerald-800"><UserCheck size={15} aria-hidden="true" /> Claim Lead</button>}{latestQuotation ? <button type="button" onClick={() => navigate(`/staff/sales/quotations/${latestQuotation._id || latestQuotation.id}`)} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500"><FileText size={15} aria-hidden="true" /> Open Latest Quotation</button> : <button type="button" disabled={saving} aria-busy={saving} onClick={createSmartQuotation} className="flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-60">{saving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <FileText size={15} aria-hidden="true" />}{saving ? 'Building quotation…' : 'Create Smart Quotation'}</button>}</div>
      </div>

      <div className="mt-5 grid gap-3 border-t border-slate-100 pt-4 md:grid-cols-2">
        <label className="text-xs font-medium text-slate-500">Lead status<select value={lead.status || 'NEW'} disabled={saving} onChange={(event) => event.target.value === 'LOST' ? setActiveModal('lost') : mutate(() => updateLeadStatusApi(getLeadId(lead), { status: event.target.value }), 'Lead status updated.')} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800">{LEAD_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select></label>
        {canAssign && <label className="text-xs font-medium text-slate-500">Assign specialist<select value={lead.assignedToUser?._id || lead.assignedToUser?.id || ''} disabled={saving} onChange={(event) => event.target.value && mutate(() => assignLeadApi(getLeadId(lead), { assignedToUserId: event.target.value }), 'Specialist assignment updated.')} className="mt-1 min-h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800"><option value="">Select specialist</option>{salesUsers.map((specialist) => <option key={specialist._id || specialist.id} value={specialist._id || specialist.id}>{specialist.name}</option>)}</select></label>}
      </div>
    </section>

    {notice && <div role="status" className="rounded-lg border border-slate-200 bg-slate-900 px-4 py-3 text-sm text-white">{notice}{notice.includes('Unable to create smart quotation') && <button type="button" disabled={saving} onClick={createSmartQuotation} className="ml-3 underline">Retry</button>}</div>}

    <AIPlannerLeadDossier dossier={dossier} />

    <section className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-950">CRM activity</h2><p className="mt-1 text-xs text-slate-500">Factual contact outcomes recorded by Staff.</p>{dossier?.crm?.contactHistory?.length ? <ol className="mt-4 space-y-3">{[...dossier.crm.contactHistory].reverse().map((item, index) => <li key={item._id || `${item.loggedAt}-${index}`} className="rounded-lg bg-slate-50 p-3"><div className="flex justify-between gap-3"><p className="text-sm font-semibold text-slate-800">{item.outcome?.replaceAll('_', ' ')}</p><time className="text-xs text-slate-400">{formatDateTime(item.loggedAt)}</time></div>{item.notes && <p className="mt-2 text-sm text-slate-600">{item.notes}</p>}<p className="mt-1 text-xs text-slate-400">{item.loggedByName ? `Logged by ${item.loggedByName}` : item.channel}</p></li>)}</ol> : <p className="mt-4 rounded-lg border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">No contact activity recorded.</p>}</div>
      <div className="rounded-xl border border-slate-200 bg-white p-5"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Quotation history</h2><p className="mt-1 text-xs text-slate-500">Commercial proposals remain separate from the AI planning estimate.</p></div>{latestQuotation && !['LOST', 'CONVERTED'].includes(lead.status) && <button type="button" onClick={() => navigate(buildQuotationUrl())} className="text-xs font-semibold text-emerald-700 hover:text-emerald-800">Create another</button>}</div>{quotations.length ? <div className="mt-4 space-y-2">{quotations.map((quotation) => <button key={quotation._id || quotation.id} type="button" onClick={() => navigate(`/staff/sales/quotations/${quotation._id || quotation.id}`)} className="flex w-full items-center justify-between rounded-lg border border-slate-200 p-3 text-left hover:border-emerald-200 hover:bg-emerald-50"><div><p className="font-mono text-xs font-semibold text-slate-900">{quotation.quotationNumber || 'Quotation'}</p><p className="mt-1 text-xs text-slate-500">Created {formatDate(quotation.createdAt)}</p></div><span className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-700">{quotation.status || 'DRAFT'}</span></button>)}</div> : <div className="mt-4 rounded-lg border border-dashed border-slate-200 p-5 text-center"><p className="text-sm text-slate-500">No quotation created.</p><button type="button" disabled={saving} onClick={createSmartQuotation} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Building quotation…' : 'Create Smart Quotation'}</button></div>}</div>
    </section>

    {activeModal === 'outcome' && <ContactOutcomeModal lead={lead} saving={saving} onClose={() => setActiveModal(null)} onSubmit={(payload) => mutate(() => logLeadContactApi(getLeadId(lead), payload), 'Contact outcome recorded.')} />}
    {activeModal === 'followup' && <FollowUpModal lead={lead} saving={saving} onClose={() => setActiveModal(null)} onSubmit={(payload) => mutate(() => createFollowUpApi(payload), 'Follow-up scheduled.')} />}
    {activeModal === 'lost' && <LostReasonModal lead={lead} saving={saving} onClose={() => setActiveModal(null)} onSubmit={(payload) => mutate(() => updateLeadStatusApi(getLeadId(lead), payload), 'Lead marked as lost.')} />}
  </div>;
};

export default AIPlannerLeadDetail;
