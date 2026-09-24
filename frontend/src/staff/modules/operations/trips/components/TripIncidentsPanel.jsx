import { useCallback, useEffect, useState } from 'react';
import { AlertOctagon, Loader2, Plus, Siren } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createOperationalIncidentApi, getOperationalTripIncidentsApi } from '../../../../../services/api.js';
import IncidentFormModal from '../../components/IncidentFormModal.jsx';
import OperationsStatusBadge from '../../components/OperationsStatusBadge.jsx';
import { formatOperationsDate } from '../../helpers/operationsFormatters.js';

export default function TripIncidentsPanel({ operationId, trip, coordinators }) {
  const [response, setResponse] = useState(null); const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [open, setOpen] = useState(false);
  const load = useCallback(async () => { setLoading(true); setError(''); try { setResponse(await getOperationalTripIncidentsApi(operationId)); } catch (requestError) { setError(requestError.message || 'Unable to load journey issues.'); } finally { setLoading(false); } }, [operationId]);
  useEffect(() => { void load(); }, [load]);
  const save = async (payload) => { await createOperationalIncidentApi(operationId, payload); await load(); };
  if (loading && !response) return <div className="flex min-h-52 items-center justify-center text-sm text-slate-500"><Loader2 className="mr-2 animate-spin" size={17}/>Loading journey issues…</div>;
  const summary = response?.summary || trip.incidentSummary || {};
  return <section><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[.12em] text-rose-700">Operational safety</p><h2 className="mt-1 text-lg font-semibold text-slate-950">Issues &amp; Emergencies</h2><p className="mt-1 text-sm text-slate-500">{summary.open || 0} open · {summary.inProgress || 0} in progress · {summary.resolved || 0} resolved · {summary.critical || 0} critical</p></div><button onClick={() => setOpen(true)} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-rose-600 px-4 text-sm font-semibold text-white"><Plus size={15}/>Report Issue</button></div>
    {error && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}
    {(response?.data || []).length === 0 ? <div className="mt-4 rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><Siren className="mx-auto text-slate-300" size={32}/><h3 className="mt-3 font-semibold text-slate-900">No operational issues reported.</h3><p className="mt-1 text-sm text-slate-500">Report only factual issues requiring operational ownership.</p></div> : <div className="mt-5 grid gap-3 lg:grid-cols-2">{response.data.map((incident) => <article key={incident._id} className={`rounded-xl border bg-white p-4 ${incident.severity === 'CRITICAL' && ['OPEN','IN_PROGRESS'].includes(incident.status) ? 'border-rose-300 shadow-sm' : 'border-slate-200'}`}><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-rose-700">{incident.incidentCode}</p><h3 className="mt-1 font-semibold text-slate-900">{incident.title}</h3></div>{incident.severity === 'CRITICAL' && <AlertOctagon className="shrink-0 text-rose-600" size={20}/>}</div><div className="mt-3 flex flex-wrap gap-2"><OperationsStatusBadge value={incident.severity}/><OperationsStatusBadge value={incident.status}/><OperationsStatusBadge value={incident.escalation?.status}/></div><p className="mt-3 line-clamp-2 text-sm text-slate-600">{incident.description}</p><p className="mt-2 text-xs text-slate-500">{incident.incidentType.replaceAll('_',' ')} · {incident.assignedTo?.name || 'Unassigned'} · {formatOperationsDate(incident.reportedAt)}</p><Link to={`/staff/operations/issues/${incident._id}`} className="mt-4 inline-flex min-h-9 items-center rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-700">Open incident</Link></article>)}</div>}
    {open && <IncidentFormModal bookings={trip.bookings} services={trip.services} coordinators={coordinators} onClose={() => setOpen(false)} onSave={save}/>}
  </section>;
}
