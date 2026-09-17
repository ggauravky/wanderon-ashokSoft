import React from 'react';
import { Search } from 'lucide-react';

const field = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';
const PageFilters = ({ filters, onChange }) => <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(16rem,1fr)_13rem_12rem]"><label className="relative"><span className="sr-only">Search pages</span><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={filters.search} onChange={(e) => onChange('search', e.target.value)} placeholder="Search title, slug, category…" className={`${field} w-full pl-9`} /></label><select value={filters.status} onChange={(e) => onChange('status', e.target.value)} className={field}><option value="all">All publishing states</option><option value="published">Published</option><option value="draft">Draft / unpublished</option></select><select value={filters.sort} onChange={(e) => onChange('sort', e.target.value)} className={field}><option value="updated_desc">Recently updated</option><option value="updated_asc">Oldest updated</option><option value="title_asc">Title A–Z</option><option value="title_desc">Title Z–A</option></select></section>;

export default PageFilters;

