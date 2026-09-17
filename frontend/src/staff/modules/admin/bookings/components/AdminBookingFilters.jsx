import React from 'react';
import { Search } from 'lucide-react';
import { BOOKING_STATUSES, PAYMENT_STATUSES } from '../bookingAdminHelpers.js';

const field = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const AdminBookingFilters = ({ filters, onChange }) => <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_13rem_13rem_12rem_10rem_10rem_11rem]">
  <label className="relative"><span className="sr-only">Search bookings</span><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={filters.search} onChange={(e) => onChange('search', e.target.value)} placeholder="Booking, traveler, trip, payment…" className={`${field} w-full pl-9`} /></label>
  <select value={filters.bookingStatus} onChange={(e) => onChange('bookingStatus', e.target.value)} className={field}><option value="all">All booking statuses</option>{BOOKING_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
  <select value={filters.paymentStatus} onChange={(e) => onChange('paymentStatus', e.target.value)} className={field}><option value="all">All payment statuses</option>{PAYMENT_STATUSES.map((status) => <option key={status}>{status}</option>)}</select>
  <select value={filters.source} onChange={(e) => onChange('source', e.target.value)} className={field}><option value="all">All sources</option><option value="direct">Direct trip</option><option value="quotation">Custom quotation</option></select>
  <label><span className="mb-1 block text-[11px] font-medium text-slate-500">From</span><input type="date" value={filters.dateFrom} onChange={(e) => onChange('dateFrom', e.target.value)} className={`${field} w-full`} /></label>
  <label><span className="mb-1 block text-[11px] font-medium text-slate-500">To</span><input type="date" value={filters.dateTo} onChange={(e) => onChange('dateTo', e.target.value)} className={`${field} w-full`} /></label>
  <select value={filters.sort} onChange={(e) => onChange('sort', e.target.value)} className={field}><option value="created_desc">Newest first</option><option value="created_asc">Oldest first</option><option value="total_desc">Highest total</option><option value="total_asc">Lowest total</option></select>
</section>;

export default AdminBookingFilters;

