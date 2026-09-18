import React from 'react';
import { formatDateTime } from '../teamAnalyticsHelpers.js';

const MemberProfileCard = ({ data }) => {
  const member = data.member;
  return <section className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
    <div className="flex items-center gap-4"><div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-900 text-lg font-semibold text-white">{member.avatar ? <img src={member.avatar} alt="" className="h-full w-full object-cover"/> : member.name?.slice(0, 2).toUpperCase()}</div><div><h2 className="text-xl font-semibold tracking-tight text-slate-950">{member.name}</h2><p className="mt-1 text-sm text-slate-500">{member.roleLabel} · {member.email}</p><div className="mt-2 flex flex-wrap gap-2"><span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${member.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{member.isActive ? 'Active' : 'Inactive'}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{data.range.key === 'all' ? 'All time' : data.range.key}</span></div></div></div>
    <div className="sm:text-right"><p className="text-xs font-medium text-slate-500">Last tracked activity</p><p className="mt-1 text-sm font-semibold text-slate-800">{formatDateTime(data.summary?.lastActivity)}</p></div>
  </section>;
};

export default MemberProfileCard;
