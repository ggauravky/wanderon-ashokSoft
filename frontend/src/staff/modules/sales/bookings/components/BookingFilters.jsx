import React from 'react';
import { Search } from 'lucide-react';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../bookingHelpers.js';

const BookingFilters = ({ search, paymentStatus, bookingStatus, dateFrom, dateTo, onChange }) => (
  <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_12rem_14rem_10rem_10rem]">
    <label className="relative"><span className="sr-only">Search bookings</span><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" aria-hidden="true" /><input value={search} onChange={(event) => onChange('search', event.target.value)} placeholder="Booking, traveler, quotation, trip…" className="min-h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" /></label>
    <select value={paymentStatus} onChange={(event) => onChange('paymentStatus', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"><option value="all">All payments</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select>
    <select value={bookingStatus} onChange={(event) => onChange('bookingStatus', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500"><option value="all">All booking statuses</option>{BOOKING_STATUSES.map((status) => <option key={status} value={status}>{status.replaceAll('_', ' ')}</option>)}</select>
    <label><span className="mb-1 block text-[11px] font-medium text-slate-500">From</span><input type="date" value={dateFrom} onChange={(event) => onChange('dateFrom', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-700" /></label>
    <label><span className="mb-1 block text-[11px] font-medium text-slate-500">To</span><input type="date" value={dateTo} onChange={(event) => onChange('dateTo', event.target.value)} className="min-h-10 w-full rounded-lg border border-slate-200 px-2 text-sm text-slate-700" /></label>
  </section>
);

export default BookingFilters;
