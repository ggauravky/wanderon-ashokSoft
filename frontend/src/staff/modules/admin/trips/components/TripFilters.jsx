import React from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

const TripFilters = ({ filters, onChange, destinations, categories }) => (
  <div className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] md:grid-cols-2 xl:grid-cols-[minmax(260px,1fr)_180px_200px_180px]">
    <label className="relative">
      <span className="sr-only">Search trips</span>
      <Search size={16} className="absolute left-3 top-3 text-slate-400" />
      <input value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Search title, slug or destination" className="min-h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-emerald-500" />
    </label>
    <label className="relative">
      <SlidersHorizontal size={15} className="absolute left-3 top-3 text-slate-400" />
      <select value={filters.status} onChange={(event) => onChange('status', event.target.value)} className="min-h-10 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-emerald-500">
        <option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="inactive">Inactive</option>
      </select>
    </label>
    <select value={filters.destination} onChange={(event) => onChange('destination', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
      <option value="all">All destinations</option>{destinations.map((value) => <option key={value}>{value}</option>)}
    </select>
    <select value={filters.category} onChange={(event) => onChange('category', event.target.value)} className="min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-emerald-500">
      <option value="all">All categories</option>{categories.map((value) => <option key={value}>{value}</option>)}
    </select>
  </div>
);

export default TripFilters;

