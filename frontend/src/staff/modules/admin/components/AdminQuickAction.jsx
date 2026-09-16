import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const AdminQuickAction = ({ to, label, description, icon: Icon }) => <Link to={to} className="group flex min-h-24 items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-emerald-200 hover:bg-emerald-50"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white group-hover:text-emerald-700"><Icon size={17} /></span><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-900 group-hover:text-emerald-900">{label}<ArrowRight size={15} className="shrink-0 text-slate-400 group-hover:text-emerald-700" /></span><span className="mt-1 block text-xs leading-5 text-slate-500">{description}</span></span></Link>;

export default AdminQuickAction;
