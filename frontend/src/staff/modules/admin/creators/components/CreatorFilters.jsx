import React from 'react';
import { Search } from 'lucide-react';

const control = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const CreatorFilters = ({ filters, onChange }) => <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(15rem,1fr)_12rem_12rem]"><label className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Search applicant, email, or profile" className={`${control} w-full pl-9`} /></label><select value={filters.status} onChange={(event) => onChange('status', event.target.value)} className={control}><option value="all">All statuses</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select><select value={filters.sort} onChange={(event) => onChange('sort', event.target.value)} className={control}><option value="applied_desc">Newest applications</option><option value="applied_asc">Oldest applications</option><option value="updated_desc">Recently reviewed</option><option value="name_asc">Name A–Z</option></select></section>;

export default CreatorFilters;

