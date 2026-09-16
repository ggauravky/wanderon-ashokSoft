import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Loader2, RefreshCw } from 'lucide-react';
import { getSalesBookingsApi } from '../../../../services/api.js';
import BookingFilters from './components/BookingFilters.jsx';
import SalesBookingCard from './components/SalesBookingCard.jsx';
import SalesBookingTable from './components/SalesBookingTable.jsx';

const SalesBookingsWorkspace = () => {
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({ search: '', paymentStatus: 'all', bookingStatus: 'all', dateFrom: '', dateTo: '' });
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { const timer = window.setTimeout(() => setDebouncedSearch(filters.search.trim()), 300); return () => window.clearTimeout(timer); }, [filters.search]);
  const loadBookings = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const data = await getSalesBookingsApi({ search: debouncedSearch, paymentStatus: filters.paymentStatus === 'all' ? undefined : filters.paymentStatus, bookingStatus: filters.bookingStatus === 'all' ? undefined : filters.bookingStatus, dateFrom: filters.dateFrom, dateTo: filters.dateTo, limit: 100 });
      setBookings(Array.isArray(data?.bookings) ? data.bookings : []);
    } catch (loadError) {
      setError(loadError.message || 'Unable to load bookings.');
      setBookings([]);
    } finally { setLoading(false); setRefreshing(false); }
  }, [debouncedSearch, filters.bookingStatus, filters.dateFrom, filters.dateTo, filters.paymentStatus]);
  useEffect(() => { loadBookings(); }, [loadBookings]);
  const filtersActive = Boolean(filters.search || filters.paymentStatus !== 'all' || filters.bookingStatus !== 'all' || filters.dateFrom || filters.dateTo);

  return <div className="space-y-5"><section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white px-5 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Sales · Booking handoff</p><h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Bookings</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Track bookings created from quotations available to your current Sales permissions. Payment and booking status are read-only.</p></div><button type="button" onClick={() => loadBookings(true)} disabled={refreshing} className="flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />Refresh</button></section><BookingFilters {...filters} onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))} />{error ? <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" /><h3 className="mt-3 font-semibold text-rose-900">Unable to load bookings</h3><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => loadBookings()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">Retry</button></section> : loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading bookings…</section> : bookings.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><BookOpen size={28} className="mx-auto text-slate-300" /><h3 className="mt-3 font-semibold text-slate-900">{filtersActive ? 'No bookings match these filters.' : 'No bookings yet.'}</h3><p className="mt-1 text-sm text-slate-500">Bookings appear here after an approved quotation is converted.</p></section> : <><SalesBookingTable bookings={bookings} /><div className="grid gap-3 xl:hidden">{bookings.map((booking) => <SalesBookingCard key={booking.bookingId || booking._id} booking={booking} />)}</div></>}</div>;
};

export default SalesBookingsWorkspace;
