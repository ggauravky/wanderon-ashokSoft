import React from 'react';
import { Search } from 'lucide-react';
import { MEDIA_TYPES, humanizeMediaValue } from '../mediaHelpers.js';

const field = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const MediaFilters = ({ filters, facets, onChange }) => (
  <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_11rem_13rem_13rem_13rem_11rem]">
    <label className="relative"><span className="sr-only">Search media</span><Search size={16} className="absolute left-3 top-3 text-slate-400" /><input value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Search title, alt text, destination…" className={`${field} w-full pl-9`} /></label>
    <select value={filters.type} onChange={(event) => onChange('type', event.target.value)} className={field}><option value="all">All types</option>{MEDIA_TYPES.map((value) => <option key={value} value={value}>{humanizeMediaValue(value)}</option>)}</select>
    <select value={filters.destination} onChange={(event) => onChange('destination', event.target.value)} className={field}><option value="all">All destinations</option>{(facets.destinations || []).map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.category} onChange={(event) => onChange('category', event.target.value)} className={field}><option value="all">All categories</option>{(facets.categories || []).map((value) => <option key={value}>{value}</option>)}</select>
    <select value={filters.source} onChange={(event) => onChange('source', event.target.value)} className={field}><option value="all">All sources</option>{(facets.sources || []).map((value) => <option key={value}>{humanizeMediaValue(value)}</option>)}</select>
    <select value={filters.active} onChange={(event) => onChange('active', event.target.value)} className={field}><option value="true">Active</option><option value="false">Archived</option><option value="all">All states</option></select>
  </section>
);

export default MediaFilters;

