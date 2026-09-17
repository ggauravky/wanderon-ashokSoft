import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import UserRoleBadge from './UserRoleBadge.jsx';
import UserStatusBadge from './UserStatusBadge.jsx';
import { accountTypeLabel, formatUserDate } from '../userAdminHelpers.js';

const UserCard = ({ user }) => <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="truncate font-semibold text-slate-950">{user.name}</h2><p className="mt-1 truncate text-xs text-slate-500">{user.email}</p></div><UserStatusBadge active={user.isActive} /></div><div className="mt-4 flex flex-wrap gap-2"><UserRoleBadge role={user.role} /><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600">{accountTypeLabel(user.accountType)}</span></div><div className="mt-4 grid grid-cols-2 gap-3 border-y border-slate-100 py-3 text-xs"><p><span className="text-slate-400">Phone</span><span className="mt-1 block text-slate-700">{user.phone || 'Not available'}</span></p><p><span className="text-slate-400">Created</span><span className="mt-1 block text-slate-700">{formatUserDate(user.createdAt)}</span></p></div><Link to={`/staff/admin/users/${user._id}`} className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700">View account <ArrowRight size={14} /></Link></article>;

export default UserCard;

