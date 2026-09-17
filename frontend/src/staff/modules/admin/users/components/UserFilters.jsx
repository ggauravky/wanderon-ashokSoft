import React from 'react';
import { Search } from 'lucide-react';
import { userRoleLabel } from '../userAdminHelpers.js';

const control = 'min-h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100';

const UserFilters = ({ filters, roles, onChange }) => <section className="grid gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm md:grid-cols-[minmax(15rem,1fr)_repeat(4,minmax(9rem,auto))]"><label className="relative"><Search size={16} className="pointer-events-none absolute left-3 top-3 text-slate-400" /><input value={filters.search} onChange={(event) => onChange('search', event.target.value)} placeholder="Search name, email, or phone" className={`${control} w-full pl-9`} /></label><select value={filters.role} onChange={(event) => onChange('role', event.target.value)} className={control}><option value="all">All roles</option>{roles.map((role) => <option key={role} value={role}>{userRoleLabel(role)}</option>)}</select><select value={filters.status} onChange={(event) => onChange('status', event.target.value)} className={control}><option value="all">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><select value={filters.accountType} onChange={(event) => onChange('accountType', event.target.value)} className={control}><option value="all">All account types</option><option value="customer">Customers</option><option value="staff">Staff</option><option value="creator">Creators</option></select><select value={filters.sort} onChange={(event) => onChange('sort', event.target.value)} className={control}><option value="created_desc">Newest first</option><option value="created_asc">Oldest first</option><option value="updated_desc">Recently updated</option><option value="name_asc">Name A–Z</option></select></section>;

export default UserFilters;

