import React, { useEffect, useState } from 'react';
import { Building2, Plus, RefreshCw, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { listHotelsApi, setHotelStatusApi } from '../../../../services/hotelService.js';

const types = ['HOTEL', 'BOUTIQUE_HOTEL', 'RESORT', 'HOSTEL', 'HOMESTAY', 'GUEST_HOUSE', 'CAMP', 'VILLA', 'APARTMENT', 'LODGE', 'OTHER'];
const control = 'min-h-10 rounded border border-slate-300 bg-white px-3 text-sm text-slate-900';

export default function HotelsWorkspace() {
  const [filters, setFilters] = useState({ search: '', city: '', status: 'ALL', propertyType: '', starRating: '', page: 1 });
  const [result, setResult] = useState({ data: [], pagination: {}, facets: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  const change = (key, value) => setFilters((current) => ({ ...current, [key]: value, page: key === 'page' ? value : 1 }));
  useEffect(() => {
    let alive = true;
    const timer = setTimeout(() => {
      setLoading(true); setError('');
      listHotelsApi(filters).then((data) => { if (alive) setResult(data); }).catch((cause) => { if (alive) setError(cause.message); }).finally(() => { if (alive) setLoading(false); });
    }, 250);
    return () => { alive = false; clearTimeout(timer); };
  }, [filters, revision]);
  const statusAction = async (hotel, status) => {
    if (status === 'ARCHIVED' && !window.confirm(`Archive ${hotel.name}? Existing quotations will remain unchanged.`)) return;
    try {
      await setHotelStatusApi(hotel._id, status, hotel.catalogVersion);
      setRevision((value) => value + 1);
    } catch (cause) { setError(cause.message); }
  };
  return <div className="space-y-5">
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-5"><div><p className="text-xs font-semibold uppercase text-emerald-700">Administration</p><h1 className="mt-1 text-2xl font-semibold text-slate-950">Hotels</h1><p className="mt-1 text-sm text-slate-600">Accommodation properties available to quotation builders.</p></div><div className="flex gap-2"><button type="button" onClick={() => setRevision((value) => value + 1)} aria-label="Refresh hotels" title="Refresh hotels" className={control}><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button><Link to="/staff/admin/hotels/new" className="inline-flex min-h-10 items-center gap-2 rounded bg-slate-950 px-4 text-sm font-semibold text-white"><Plus size={16} />New hotel</Link></div></header>
    <div className="flex flex-wrap gap-2 text-sm">{['ALL', 'DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED'].map((status) => <button key={status} type="button" onClick={() => change('status', status)} className={`min-h-9 border-b-2 px-2 ${filters.status === status ? 'border-emerald-600 font-semibold text-emerald-700' : 'border-transparent text-slate-600'}`}>{status === 'ALL' ? 'All' : status.charAt(0) + status.slice(1).toLowerCase()} {status !== 'ALL' && <span className="text-slate-400">{result.facets?.statuses?.[status] || 0}</span>}</button>)}</div>
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"><label className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input aria-label="Search hotels" placeholder="Name, alias, city, code" value={filters.search} onChange={(event) => change('search', event.target.value)} className={`${control} w-full pl-9`} /></label><input aria-label="Filter city" placeholder="City" value={filters.city} onChange={(event) => change('city', event.target.value)} className={control} /><select aria-label="Property type" value={filters.propertyType} onChange={(event) => change('propertyType', event.target.value)} className={control}><option value="">All property types</option>{types.map((type) => <option key={type} value={type}>{type.replaceAll('_', ' ')}</option>)}</select><select aria-label="Star rating" value={filters.starRating} onChange={(event) => change('starRating', event.target.value)} className={control}><option value="">All ratings</option>{[5, 4, 3, 2, 1, 0].map((stars) => <option key={stars} value={stars}>{stars} stars</option>)}</select></div>
    {error && <div role="alert" className="border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}
    {loading ? <div className="py-16 text-center text-sm text-slate-500">Loading hotels…</div> : result.data.length ? <><div className="overflow-x-auto border-y border-slate-200 bg-white"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="px-4 py-3">Property</th><th className="px-4 py-3">City</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Rating</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr></thead><tbody>{result.data.map((hotel) => <tr key={hotel._id} className="border-t border-slate-100"><td className="px-4 py-3"><Link to={`/staff/admin/hotels/${hotel._id}`} className="font-semibold text-slate-900 hover:text-emerald-700">{hotel.name}</Link><div className="text-xs text-slate-500">{hotel.hotelCode}</div></td><td className="px-4 py-3">{hotel.location?.city}</td><td className="px-4 py-3">{hotel.propertyType?.replaceAll('_', ' ')}</td><td className="px-4 py-3">{hotel.starRating || '—'}</td><td className="px-4 py-3">{hotel.status}</td><td className="px-4 py-3"><div className="flex gap-2">{hotel.status !== 'ARCHIVED' && <><Link to={`/staff/admin/hotels/${hotel._id}/edit`} className="text-emerald-700 hover:underline">Edit</Link><button type="button" onClick={() => statusAction(hotel, hotel.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')} className="text-slate-600 hover:underline">{hotel.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}</button><button type="button" onClick={() => statusAction(hotel, 'ARCHIVED')} className="text-rose-700 hover:underline">Archive</button></>}</div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between text-sm text-slate-600"><span>{result.pagination.total} properties</span><div className="flex gap-2"><button type="button" disabled={filters.page <= 1} onClick={() => change('page', filters.page - 1)} className={control}>Previous</button><span className="self-center">{filters.page} / {result.pagination.pages || 1}</span><button type="button" disabled={filters.page >= result.pagination.pages} onClick={() => change('page', filters.page + 1)} className={control}>Next</button></div></div></> : <div className="py-16 text-center text-sm text-slate-500"><Building2 size={24} className="mx-auto mb-2" />No hotels match these filters.</div>}
  </div>;
}
