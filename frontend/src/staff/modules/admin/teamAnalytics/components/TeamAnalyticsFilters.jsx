import React from 'react';
import { CATEGORIES, RANGES } from '../teamAnalyticsHelpers.js';

const control = 'min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 disabled:bg-slate-50 disabled:text-slate-400';

const TeamAnalyticsFilters = ({ category, memberId, members, range, from, to, loadingMembers, onCategory, onMember, onRange, onFrom, onTo }) => (
  <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-3" aria-label="Team analytics filters">
    <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Category</span><select className={control} value={category} onChange={(event) => onCategory(event.target.value)}><option value="">Select category</option>{CATEGORIES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Member</span><select className={control} value={memberId} onChange={(event) => onMember(event.target.value)} disabled={!category || loadingMembers}><option value="">{loadingMembers ? 'Loading members…' : 'Select member'}</option>{members.map((member) => <option key={member._id} value={member._id}>{member.name} · {member.email}{member.isActive === false ? ' (Inactive)' : ''}</option>)}</select></label>
    <label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Date range</span><select className={control} value={range} onChange={(event) => onRange(event.target.value)}>{RANGES.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    {range === 'custom' && <><label className="md:col-start-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">From</span><input className={control} type="date" value={from} onChange={(event) => onFrom(event.target.value)}/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">To</span><input className={control} type="date" min={from} value={to} onChange={(event) => onTo(event.target.value)}/></label></>}
  </section>
);

export default TeamAnalyticsFilters;
