import React from 'react';

const UserStatusBadge = ({ active }) => <span className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${active ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'}`}>{active ? 'Active' : 'Inactive'}</span>;

export default UserStatusBadge;

