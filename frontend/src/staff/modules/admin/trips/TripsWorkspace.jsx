import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Map, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getAdminTripsApi } from '../../../../services/api';
import TripFilters from './components/TripFilters';
import TripMobileCard from './components/TripMobileCard';
import TripTable from './components/TripTable';

const TripsWorkspace = () => {
  const [trips, setTrips] = useState([]);
  const [filters, setFilters] = useState({ search: '', status: 'all', destination: 'all', category: 'all' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTrips = async () => {
    setLoading(true); setError('');
    try { setTrips(await getAdminTripsApi(filters)); }
    catch (err) { setError(err.message || 'Unable to load trips.'); }
    finally { setLoading(false); }
  };

  useEffect(() => { const timer = setTimeout(loadTrips, 250); return () => clearTimeout(timer); }, [filters.search, filters.status, filters.destination, filters.category]);
  const destinations = useMemo(() => [...new Set(trips.map((trip) => trip.destination).filter(Boolean))].sort(), [trips]);
  const categories = useMemo(() => [...new Set(trips.map((trip) => trip.category).filter(Boolean))].sort(), [trips]);

  return <div className="space-y-5">
    <header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Trips</h1><p className="mt-2 text-sm text-slate-600">Manage the live catalog, departure inventory, pricing and publishing state.</p></div><div className="flex gap-2"><button type="button" onClick={loadTrips} disabled={loading} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh</button><Link to="/staff/admin/trips/new" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-slate-950 px-4 text-sm font-semibold text-white"><Plus size={16} />Create trip</Link></div></header>
    <TripFilters filters={filters} onChange={(field, value) => setFilters((current) => ({ ...current, [field]: value }))} destinations={destinations} categories={categories} />
    {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"><AlertCircle size={18} className="mr-2 inline" />{error}</div>}
    {!error && loading && <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500"><RefreshCw size={22} className="mx-auto mb-3 animate-spin text-emerald-600" />Loading catalog…</div>}
    {!error && !loading && trips.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center"><Map size={26} className="mx-auto text-slate-400" /><h2 className="mt-3 font-semibold text-slate-900">No trips match these filters</h2><p className="mt-1 text-sm text-slate-500">An empty catalog is respected—nothing is auto-seeded or fabricated.</p></div>}
    {!loading && trips.length > 0 && <><TripTable trips={trips} /><div className="grid gap-3 lg:hidden">{trips.map((trip) => <TripMobileCard key={trip._id} trip={trip} />)}</div></>}
  </div>;
};

export default TripsWorkspace;

