import React from 'react';
import { userRoleLabel } from '../userAdminHelpers.js';

const tones = { super_admin: 'border-violet-200 bg-violet-50 text-violet-800', admin: 'border-indigo-200 bg-indigo-50 text-indigo-800', sales: 'border-sky-200 bg-sky-50 text-sky-800', marketing: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-800', operations: 'border-cyan-200 bg-cyan-50 text-cyan-800', influencer: 'border-emerald-200 bg-emerald-50 text-emerald-800', user: 'border-slate-200 bg-slate-50 text-slate-700' };

const UserRoleBadge = ({ role }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${tones[role] || tones.user}`}>{userRoleLabel(role)}</span>;

export default UserRoleBadge;

