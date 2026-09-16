import React from 'react';
import { slugify } from '../tripHelpers';

const inputClass = 'min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500';
const Field = ({ label, children }) => <label className="space-y-1.5 text-sm font-medium text-slate-700"><span>{label}</span>{children}</label>;

const TripBasicInfoForm = ({ value, onChange, slugTouched, onSlugTouched }) => {
  const set = (field, next) => onChange({ ...value, [field]: next });
  return <div className="grid gap-4 md:grid-cols-2">
    <Field label="Title"><input className={inputClass} value={value.title} onChange={(event) => { const title = event.target.value; onChange({ ...value, title, ...(!slugTouched ? { slug: slugify(title) } : {}) }); }} /></Field>
    <Field label="Slug"><input className={inputClass} value={value.slug} onChange={(event) => { onSlugTouched(true); set('slug', slugify(event.target.value)); }} /></Field>
    <Field label="Location"><input className={inputClass} value={value.location} onChange={(event) => set('location', event.target.value)} /></Field>
    <Field label="Destination"><input className={inputClass} value={value.destination} onChange={(event) => set('destination', event.target.value)} /></Field>
    <Field label="Region"><input className={inputClass} value={value.region} onChange={(event) => set('region', event.target.value)} /></Field>
    <Field label="Duration"><input className={inputClass} value={value.duration} onChange={(event) => set('duration', event.target.value)} placeholder="e.g. 5D/4N" /></Field>
    <Field label="Days"><input type="number" min="0" className={inputClass} value={value.days} onChange={(event) => set('days', event.target.value)} /></Field>
    <Field label="Nights"><input type="number" min="0" className={inputClass} value={value.nights} onChange={(event) => set('nights', event.target.value)} /></Field>
    {['category', 'mood', 'difficulty', 'groupType'].map((field) => <Field key={field} label={field === 'groupType' ? 'Group type' : field[0].toUpperCase() + field.slice(1)}><input className={inputClass} value={value[field]} onChange={(event) => set(field, event.target.value)} /></Field>)}
    <Field label="Tags (comma separated)"><input className={inputClass} value={(value.tags || []).join(', ')} onChange={(event) => set('tags', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></Field>
    <Field label="Best months (comma separated)"><input className={inputClass} value={(value.bestMonths || []).join(', ')} onChange={(event) => set('bestMonths', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></Field>
  </div>;
};

export default TripBasicInfoForm;

