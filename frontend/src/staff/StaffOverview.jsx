import React from 'react';
import { BriefcaseBusiness, ShieldCheck } from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import StaffWorkspaceCard from './components/StaffWorkspaceCard';

const StaffOverview = () => {
  const { user, roleLabel, visibleModules } = useOutletContext();
  const workspaces = visibleModules.filter((module) => module.id !== 'overview' && !module.navigationOnly);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-7 sm:py-7">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-emerald-700">Welcome back</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
              {user?.name || 'WanderLuxe staff member'}
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">
              Open a department workspace available to your staff role. Every internal team now enters through this unified control center.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 sm:w-auto sm:min-w-56">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-emerald-300">
              <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500">Current role</p>
              <p className="truncate text-sm font-semibold text-slate-900">{roleLabel}</p>
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="available-workspaces-title">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
            <BriefcaseBusiness size={18} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div>
            <h2 id="available-workspaces-title" className="text-lg font-semibold tracking-tight text-slate-950">
              Your workspaces
            </h2>
            <p className="text-sm text-slate-500">Available for your current staff role</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {workspaces.map((module) => (
            <StaffWorkspaceCard key={module.id} module={module} />
          ))}
        </div>
      </section>

      <p className="flex items-start gap-2 border-t border-slate-200 pt-5 text-xs leading-5 text-slate-500">
        <ShieldCheck className="mt-0.5 shrink-0" size={15} strokeWidth={1.8} aria-hidden="true" />
        Navigation reflects workspace visibility only. Server authorization remains authoritative for every business action.
      </p>
    </div>
  );
};

export default StaffOverview;
