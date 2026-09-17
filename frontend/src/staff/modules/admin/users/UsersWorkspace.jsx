import React, { useCallback, useEffect, useState } from 'react';
import { AlertCircle, ChevronLeft, ChevronRight, Loader2, Plus, RefreshCw, UserRound, UserRoundCheck, UserRoundX, Users } from 'lucide-react';
import { createAdminStaffUserApi, getAdminUsersApi } from '../../../../services/api.js';
import { useAuth } from '../../../../contexts/AuthContext.jsx';
import UserFilters from './components/UserFilters.jsx';
import UsersTable from './components/UsersTable.jsx';
import UserCard from './components/UserCard.jsx';
import CreateStaffModal from './components/CreateStaffModal.jsx';

const initialFilters = { search: '', role: 'all', status: 'all', accountType: 'all', sort: 'created_desc' };

const UsersWorkspace = () => {
  const { user: actor } = useAuth();
  const [filters, setFilters] = useState(initialFilters);
  const [querySearch, setQuerySearch] = useState('');
  const [page, setPage] = useState(1);
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [counts, setCounts] = useState({ customers: 0, staff: 0, creators: 0, inactive: 0 });
  const [pagination, setPagination] = useState({ page: 1, pages: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState('');

  useEffect(() => { const timer = setTimeout(() => { setPage(1); setQuerySearch(filters.search.trim()); }, 300); return () => clearTimeout(timer); }, [filters.search]);
  const load = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const result = await getAdminUsersApi({ envelope: true, search: querySearch, role: filters.role, status: filters.status, accountType: filters.accountType, sort: filters.sort, page, limit: 25 });
      setUsers(result.users || []); setRoles(result.roles || []); setCounts(result.counts || {}); setPagination(result.pagination || { page: 1, pages: 0, total: 0 });
    } catch (loadError) { setError(loadError.message || 'Unable to load users.'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [filters.accountType, filters.role, filters.sort, filters.status, page, querySearch]);
  useEffect(() => { load(); }, [load]);
  const changeFilter = (key, value) => { setFilters((current) => ({ ...current, [key]: value })); if (key !== 'search') setPage(1); };
  const createStaff = async (form) => {
    setCreateBusy(true); setCreateError('');
    try { const created = await createAdminStaffUserApi(form); setCreateOpen(false); setNotice(`${created.name} was created as a Staff account.`); await load(true); }
    catch (saveError) { setCreateError(saveError.message || 'Unable to create Staff account.'); }
    finally { setCreateBusy(false); }
  };
  const metrics = [{ label: 'Customers', value: counts.customers || 0, icon: UserRound }, { label: 'Staff', value: counts.staff || 0, icon: Users }, { label: 'Creators', value: counts.creators || 0, icon: UserRoundCheck }, { label: 'Inactive', value: counts.inactive || 0, icon: UserRoundX }];

  return <div className="space-y-5"><header className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-700">Administration</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Users &amp; Roles</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Manage customer, Staff, and creator identities from the single MongoDB User model.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => load(true)} disabled={refreshing} className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700"><RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />Refresh</button><button type="button" onClick={() => { setCreateError(''); setCreateOpen(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white"><Plus size={15} />Create Staff</button></div></header><section className="grid grid-cols-2 gap-3 lg:grid-cols-4">{metrics.map(({ label, value, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">{label}</p><Icon size={16} className="text-slate-400" /></div><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p></article>)}</section><UserFilters filters={filters} roles={roles} onChange={changeFilter} />{notice && <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}{error ? <section className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center"><AlertCircle size={24} className="mx-auto text-rose-600" /><h2 className="mt-3 font-semibold text-rose-900">Unable to load users.</h2><p className="mt-1 text-sm text-rose-700">{error}</p><button type="button" onClick={() => load()} className="mt-4 min-h-10 rounded-lg bg-rose-700 px-4 text-sm font-semibold text-white">Retry</button></section> : loading ? <section className="flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={18} className="mr-2 animate-spin" />Loading users…</section> : users.length === 0 ? <section className="rounded-xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center"><Users size={28} className="mx-auto text-slate-300" /><h2 className="mt-3 font-semibold text-slate-900">No users found.</h2><p className="mt-1 text-sm text-slate-500">Adjust the server-side filters or search term.</p></section> : <><UsersTable users={users} /><div className="grid gap-3 lg:hidden">{users.map((user) => <UserCard key={user._id} user={user} />)}</div></>}{!loading && pagination.pages > 0 && <footer className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"><p className="text-slate-500">{pagination.total} user{pagination.total === 1 ? '' : 's'} · Page {pagination.page} of {pagination.pages}</p><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40"><ChevronLeft size={15} />Previous</button><button type="button" disabled={page >= pagination.pages} onClick={() => setPage((value) => value + 1)} className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-slate-200 px-3 font-semibold text-slate-700 disabled:opacity-40">Next<ChevronRight size={15} /></button></div></footer>}<CreateStaffModal open={createOpen} actor={actor} busy={createBusy} error={createError} onClose={() => setCreateOpen(false)} onConfirm={createStaff} /></div>;
};

export default UsersWorkspace;

