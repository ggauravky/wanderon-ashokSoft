import React from 'react';
import { BarChart3, BadgePercent, Image, Megaphone, Plane } from 'lucide-react';

const MANAGEMENT_AREAS = [
  ['campaigns', 'Campaigns', 'Campaign planning and lifecycle tools will be connected here.', Megaphone],
  ['trip-promotions', 'Trip Promotions', 'Promotion controls will be added when their data authority is defined.', Plane],
  ['content-banners', 'Content & Banners', 'Public content placement tools are not connected in this phase.', Image],
  ['offers', 'Offers', 'Offer configuration will be introduced as a dedicated module.', BadgePercent],
  ['analytics', 'Analytics', 'Verified attribution reporting will be connected in a later phase.', BarChart3]
];

const ManagementWorkspace = () => (
  <div className="space-y-6">
    <section className="rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-7">
      <p className="text-sm font-semibold text-emerald-700">Management</p>
      <h2 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">Management workspace</h2>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
        This department foundation is ready for real campaign, promotion, content, offer, and attribution modules. No demo data is connected.
      </p>
    </section>

    <section aria-labelledby="management-areas-title">
      <div className="mb-4">
        <h2 id="management-areas-title" className="text-lg font-semibold tracking-tight text-slate-950">
          Department areas
        </h2>
        <p className="mt-1 text-sm text-slate-500">Structural destinations for future verified modules</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {MANAGEMENT_AREAS.map(([id, label, description, Icon]) => (
          <article key={id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Icon size={20} strokeWidth={1.8} aria-hidden="true" />
            </span>
            <h3 className="mt-5 text-base font-semibold tracking-tight text-slate-950">{label}</h3>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">{description}</p>
            <p className="mt-4 text-xs font-medium text-slate-400">Not connected yet</p>
          </article>
        ))}
      </div>
    </section>
  </div>
);

export default ManagementWorkspace;
