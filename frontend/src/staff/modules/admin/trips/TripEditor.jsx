import React, { useEffect, useState } from 'react';
import { AlertCircle, ArrowLeft, CheckCircle2, Loader2, Save, Send } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { createTripApi, deleteTripApi, getAdminTripByIdApi, updateTripApi } from '../../../../services/api';
import { emptyTrip, hydrateTrip } from './tripHelpers';
import TripBasicInfoForm from './components/TripBasicInfoForm';
import TripPricingForm from './components/TripPricingForm';
import TripDeparturesEditor from './components/TripDeparturesEditor';
import TripContentForm from './components/TripContentForm';
import TripMediaForm from './components/TripMediaForm';
import TripSeoForm from './components/TripSeoForm';
import TripDangerZone from './components/TripDangerZone';
import TripStatusBadge from './components/TripStatusBadge';

const tabs = [
  ['basic', 'Basic'], ['pricing', 'Pricing'], ['departures', 'Departures & inventory'],
  ['content', 'Content'], ['media', 'Media'], ['seo', 'SEO'], ['publishing', 'Publishing']
];

const TripEditor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editing = Boolean(id);
  const [trip, setTrip] = useState(emptyTrip);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(editing);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [slugTouched, setSlugTouched] = useState(editing);

  useEffect(() => {
    if (!editing) return;
    getAdminTripByIdApi(id).then((data) => setTrip(hydrateTrip(data))).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, [editing, id]);

  const validate = (publishing = false) => {
    if (!trip.title || !trip.slug || !trip.location || !trip.duration || trip.price === '' || !trip.image) return 'Title, slug, location, duration, base price, and main image are required.';
    if (trip.originalPrice !== '' && Number(trip.originalPrice) < Number(trip.price)) return 'Original price cannot be lower than base price.';
    if (publishing && trip.isCustom) return 'Quotation-created custom trips cannot be published publicly.';
    return '';
  };

  const persist = async (status = trip.status) => {
    const message = validate(status === 'published');
    if (message) { setError(message); return; }
    setBusy(true); setError(''); setNotice('');
    try {
      const saved = editing ? await updateTripApi(id, { ...trip, status }) : await createTripApi({ ...trip, status });
      setTrip(hydrateTrip(saved));
      setSlugTouched(true);
      setNotice(status === 'published' ? 'Trip published to the live catalog.' : status === 'inactive' ? 'Trip deactivated.' : 'Draft saved.');
      if (!editing) navigate(`/staff/admin/trips/${saved._id}/edit`, { replace: true });
    } catch (err) { setError(err.message || 'Unable to save trip.'); }
    finally { setBusy(false); }
  };

  const remove = async () => {
    setBusy(true); setError('');
    try { const result = await deleteTripApi(id); if (result.deactivated) { setNotice(result.message); setTrip((current) => ({ ...current, status: 'inactive', isActive: false })); } else navigate('/staff/admin/trips'); }
    catch (err) { setError(err.message || 'Unable to delete trip.'); }
    finally { setBusy(false); }
  };

  if (loading) return <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500"><Loader2 className="mx-auto mb-3 animate-spin" />Loading trip…</div>;
  return <div className="space-y-5">
    <header className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><Link to="/staff/admin/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950"><ArrowLeft size={15} />Back to Trips</Link><div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2"><h1 className="text-2xl font-semibold tracking-tight text-slate-950">{editing ? trip.title || 'Edit trip' : 'Create trip'}</h1><TripStatusBadge status={trip.status} /></div><p className="mt-1 text-sm text-slate-500">{editing ? `/${trip.slug}` : 'New trips begin as drafts and require explicit publishing.'}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={busy} onClick={() => persist(trip.status === 'draft' ? 'draft' : trip.status)} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><Save size={15} />{editing ? 'Save changes' : 'Save draft'}</button>{trip.status !== 'published' && <button type="button" disabled={busy} onClick={() => persist('published')} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white"><Send size={15} />Publish</button>}</div></div></header>
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><AlertCircle size={17} className="mr-2 inline" />{error}</div>}
    {notice && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"><CheckCircle2 size={17} className="mr-2 inline" />{notice}</div>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white px-2"><div className="flex min-w-max gap-1 py-2">{tabs.map(([key, label]) => <button key={key} type="button" onClick={() => setActiveTab(key)} className={`min-h-10 rounded-lg px-3 text-sm font-semibold ${activeTab === key ? 'bg-slate-950 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div></div>
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      {activeTab === 'basic' && <TripBasicInfoForm value={trip} onChange={setTrip} slugTouched={slugTouched} onSlugTouched={setSlugTouched} />}
      {activeTab === 'pricing' && <TripPricingForm value={trip} onChange={setTrip} />}
      {activeTab === 'departures' && <TripDeparturesEditor value={trip} onChange={setTrip} />}
      {activeTab === 'content' && <TripContentForm value={trip} onChange={setTrip} />}
      {activeTab === 'media' && <TripMediaForm value={trip} onChange={setTrip} />}
      {activeTab === 'seo' && <TripSeoForm value={trip} onChange={setTrip} />}
      {activeTab === 'publishing' && <div className="space-y-5"><div className="rounded-xl border border-slate-200 bg-slate-50 p-5"><h2 className="font-semibold text-slate-950">Publishing state</h2><p className="mt-2 text-sm leading-6 text-slate-600">Published trips are active and visible publicly. Draft and inactive trips are unavailable to public discovery and booking. Saving a draft never publishes it.</p><div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={busy || trip.status === 'draft'} onClick={() => persist('draft')} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold">Move to draft</button>{trip.status !== 'published' && <button type="button" disabled={busy || trip.isCustom} onClick={() => persist('published')} className="min-h-10 rounded-lg bg-emerald-700 px-4 text-sm font-semibold text-white">Publish trip</button>}{trip.status === 'published' && <button type="button" disabled={busy} onClick={() => persist('inactive')} className="min-h-10 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-900">Deactivate</button>}</div>{trip.isCustom && <p className="mt-3 text-sm font-medium text-amber-800">This quotation-created custom trip is intentionally excluded from the public catalog.</p>}</div>{editing && <TripDangerZone trip={trip} busy={busy} onDeactivate={() => persist('inactive')} onDelete={remove} />}</div>}
    </section>
  </div>;
};

export default TripEditor;
