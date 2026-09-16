import React from 'react';
import { Search } from 'lucide-react';
import { QUOTATION_STATUSES } from '../quotationHelpers.js';

const inputClass = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const QuotationFilters = ({ search, status, dateFrom, dateTo, onSearchChange, onStatusChange, onDateFromChange, onDateToChange }) => (
  <section className="grid gap-2 rounded-xl border border-slate-200 bg-white p-3 lg:grid-cols-[minmax(16rem,1fr)_12rem_10rem_10rem]" aria-label="Quotation filters">
    <label className="relative block">
      <span className="sr-only">Search quotations</span>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
      <input type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search quotation, traveler, phone, trip…" className={`${inputClass} w-full pl-9`} />
    </label>
    <label><span className="sr-only">Quotation status</span><select value={status} onChange={(event) => onStatusChange(event.target.value)} className={`${inputClass} w-full`}><option value="all">All statuses</option>{QUOTATION_STATUSES.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
    <label><span className="sr-only">Created from</span><input type="date" value={dateFrom} onChange={(event) => onDateFromChange(event.target.value)} className={`${inputClass} w-full`} title="Created from" /></label>
    <label><span className="sr-only">Created until</span><input type="date" value={dateTo} onChange={(event) => onDateToChange(event.target.value)} className={`${inputClass} w-full`} title="Created until" /></label>
  </section>
);

export default QuotationFilters;
