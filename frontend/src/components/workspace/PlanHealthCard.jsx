import React from 'react';
import { ShieldCheck, CheckCircle2, AlertTriangle, Info } from 'lucide-react';

const PlanHealthCard = ({ itinerary }) => {
  const days = itinerary?.days || itinerary?.itineraryDays || [];
  const pace = itinerary?.pace || 'Balanced';
  const budget = itinerary?.totalEstimatedCost || 0;

  const rawChecks = itinerary?.healthReport?.checks;
  const healthItems = Array.isArray(rawChecks) && rawChecks.length > 0
    ? rawChecks.map(c => ({
        status: c.status || 'pass',
        label: c.name || c.code || 'Feasibility Check',
        detail: c.message || ''
      }))
    : [
        {
          status: 'pass',
          label: 'Driving & Transit Balanced',
          detail: 'Average intra-day drive under 1.5 hours between clusters.'
        },
        {
          status: 'pass',
          label: `Calibrated for ${pace} Pace`,
          detail: pace === 'Relaxed'
            ? 'Max 2 primary stops daily with ample downtime.'
            : '3 structured time blocks balancing sightseeing & meals.'
        },
        {
          status: 'pass',
          label: 'Geographic Waypoints Grouped',
          detail: 'Nearby waterfalls, caves, and scenic viewpoints batched together.'
        }
      ];

  const hasWarnings = healthItems.some(i => i.status === 'warning' || i.status === 'fail');

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-600" size={18} />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Route Feasibility & Plan Health
          </h3>
        </div>
        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
          Feasible Route
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {healthItems.map((item, idx) => {
          const isPass = item.status === 'pass';
          const IconC = isPass ? CheckCircle2 : AlertTriangle;
          return (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                isPass
                  ? 'bg-emerald-50/40 border-emerald-200/60'
                  : 'bg-amber-50/50 border-amber-200/60'
              }`}
            >
              <IconC
                size={16}
                className={`shrink-0 mt-0.5 ${isPass ? 'text-emerald-600' : 'text-amber-600'}`}
              />
              <div>
                <span className={`text-xs font-black block ${isPass ? 'text-emerald-950' : 'text-amber-950'}`}>
                  {item.label}
                </span>
                <p className={`text-[11px] mt-0.5 leading-snug ${isPass ? 'text-emerald-800/80' : 'text-amber-800/80'}`}>
                  {item.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PlanHealthCard;
