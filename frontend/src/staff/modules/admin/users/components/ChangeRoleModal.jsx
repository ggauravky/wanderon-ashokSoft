import React, { useEffect, useState } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { userRoleLabel } from '../userAdminHelpers.js';

const ChangeRoleModal = ({ user, roles, actor, busy, onClose, onConfirm }) => {
  const [role, setRole] = useState(user?.role || 'user');
  const [confirmed, setConfirmed] = useState(false);
  useEffect(() => { setRole(user?.role || 'user'); setConfirmed(false); }, [user]);
  if (!user) return null;
  const selfDemotion = String(user._id) === String(actor?._id || actor?.id) && ['admin', 'super_admin'].includes(user.role) && !['admin', 'super_admin'].includes(role);
  const canAssignSuper = user.protections?.actorCanManageSuperAdmin || actor?.role === 'super_admin';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-2xl"><header className="flex items-start justify-between border-b border-slate-200 p-5"><div><h2 className="font-semibold text-slate-950">Change account role</h2><p className="mt-1 text-xs text-slate-500">{user.name} · {user.email}</p></div><button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={17} /></button></header><div className="space-y-4 p-5"><label className="block text-sm font-medium text-slate-700">Role<select value={role} onChange={(event) => setRole(event.target.value)} className="mt-1.5 min-h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-emerald-500">{roles.map((value) => <option key={value} value={value} disabled={value === 'super_admin' && !canAssignSuper}>{userRoleLabel(value)}</option>)}</select></label><div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900"><ShieldAlert size={16} className="mb-1" />Role changes affect future authorization immediately because protected requests reload the MongoDB user.</div>{selfDemotion && <label className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-0.5" /><span>I understand this removes my own active Admin access.</span></label>}</div><footer className="flex justify-end gap-2 border-t border-slate-200 p-4"><button type="button" onClick={onClose} className="min-h-10 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700">Cancel</button><button type="button" disabled={busy || role === user.role || (selfDemotion && !confirmed)} onClick={() => onConfirm(role, { confirmSelfChange: confirmed })} className="min-h-10 rounded-lg bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Saving…' : 'Change role'}</button></footer></div></div>;
};

export default ChangeRoleModal;
