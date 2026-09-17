import React from 'react';
import { Search } from 'lucide-react';

const PayoutFilters = ({ filters, creators, onChange }) => <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-5">
  <label className="relative xl:col-span-2"><span className="sr-only">Search payouts</span><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Search reference or creator" className="min-h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm" /></label>
  <select aria-label="Payout status" value={filters.status} onChange={(event) => onChange('status', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="all">All statuses</option><option value="REQUESTED">Pending</option><option value="UNDER_REVIEW">Approved</option><option value="PROCESSING">Marked processed</option><option value="CANCELLED">Rejected</option></select>
  <select aria-label="Creator" value={filters.creatorId} onChange={(event) => onChange('creatorId', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm"><option value="all">All creators</option>{creators.map((creator) => <option key={creator._id} value={creator._id}>{creator.name}</option>)}</select>
  <div className="grid grid-cols-2 gap-2"><input aria-label="From date" type="date" value={filters.from} onChange={(event) => onChange('from', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-2 text-xs" /><input aria-label="To date" type="date" value={filters.to} onChange={(event) => onChange('to', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 px-2 text-xs" /></div>
</section>;
export default PayoutFilters;

