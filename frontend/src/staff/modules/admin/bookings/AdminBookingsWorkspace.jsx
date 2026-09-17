import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BookOpen, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { getAdminBookingsApi } from '../../../../services/api.js';
import useDebouncedValue from '../../../../hooks/useDebouncedValue.js';
import AdminBookingFilters from './components/AdminBookingFilters.jsx';
import AdminBookingTable from './components/AdminBookingTable.jsx';
import AdminBookingCard from './components/AdminBookingCard.jsx';

const initialFilters = { search: '', bookingStatus: 'all', paymentStatus: 'all', source: 'all', dateFrom: '', dateTo: '', sort: 'created_desc' };
const AdminBookingsWorkspace = () => {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const debouncedSearch = useDebouncedValue(filters.search.trim());
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const { bookingStatus, paymentStatus, source, dateFrom, dateTo, sort } = filters;

  useEffect(() => { setPage(1); }, [debouncedSearch]);
  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const response = await getAdminBookingsApi({ bookingStatus, paymentStatus, source, dateFrom, dateTo, sort, search: debouncedSearch, page, limit: 25, envelope: true });
      setBookings(Array.isArray(response.bookings) ? response.bookings : []);
      setPagination(response.pagination || { page, limit: 25, total: 0, pages: 0 });
    } catch (err) { setError(err.message || 'Unable to load bookings.'); setBookings([]); }
    finally { setLoading(false); setRefreshing(false); }
  }, [bookingStatus, dateFrom, dateTo, debouncedSearch, page, paymentStatus, sort, source]);
  useEffect(() => { load(); }, [load]);
  const updateFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); if (key !== 'search') setPage(1); };
  const filtersActive = Object.entries(filters).some(([key, value]) => key === 'sort' ? value !== 'created_desc' : Boolean(value && value !== 'all'));

  return <div className="space-y-5"><header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Booking CRM</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">All platform bookings, traveler snapshots, payment visibility, source relationships, documents, and controlled cancellation.</p></div><button type="button" onClick={() => load(true)} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh</button></header><AdminBookingFilters filters={filters} onChange={updateFilter} />{error ? <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" /><h2 className="mt-3 font-semibold text-rose-900">Unable to load bookings</h2><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => load()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">Retry</button></section> : loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading bookings…</section> : bookings.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><BookOpen size={28} className="mx-auto text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">{filtersActive ? 'No bookings match these filters.' : 'No bookings recorded.'}</h2><p className="mt-1 text-sm text-slate-500">The Admin CRM only displays persisted MongoDB booking records.</p></section> : <><AdminBookingTable bookings={bookings} /><div className="grid gap-3 xl:hidden">{bookings.map((booking) => <AdminBookingCard key={booking.bookingId || booking._id} booking={booking} />)}</div></>}{!loading && pagination.pages > 0 && <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">{pagination.total} booking{pagination.total === 1 ? '' : 's'} · Page {pagination.page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((current) => current - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={15} />Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((current) => current + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40">Next<ChevronRight size={15} /></button></div></footer>}</div>;
};

export default AdminBookingsWorkspace;
