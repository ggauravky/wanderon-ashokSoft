import React from 'react';

const AdminOverviewSection = ({ id, title, description, action, children }) => (
  <section aria-labelledby={id}>
    <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 id={id} className="text-base font-semibold text-slate-950">{title}</h2>{description && <p className="mt-1 text-sm text-slate-500">{description}</p>}</div>{action}</div>
    {children}
  </section>
);

export default AdminOverviewSection;
