import React from 'react';
import { ArrowUpRight, Headphones, Megaphone, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const ICONS = {
  admin: ShieldCheck,
  sales: Headphones,
  management: Megaphone
};

const StaffWorkspaceCard = ({ module }) => {
  const Icon = ICONS[module.icon] || ShieldCheck;

  return (
    <Link
      to={module.path}
      className="group flex min-h-44 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_10px_28px_rgba(15,23,42,0.08)] focus-visible:ring-offset-slate-50"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
          <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <ArrowUpRight
          size={18}
          strokeWidth={1.8}
          className="text-slate-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-slate-700"
          aria-hidden="true"
        />
      </div>
      <div className="mt-5">
        <h3 className="text-base font-semibold tracking-tight text-slate-950">{module.cardLabel || module.label}</h3>
        <p className="mt-1.5 text-sm leading-6 text-slate-600">{module.description}</p>
      </div>
    </Link>
  );
};

export default StaffWorkspaceCard;
