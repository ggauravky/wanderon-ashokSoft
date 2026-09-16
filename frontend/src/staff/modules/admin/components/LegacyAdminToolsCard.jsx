import React from 'react';
import { ArrowRight, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';

const LegacyAdminToolsCard = () => <div className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-amber-200 bg-white text-amber-700"><Wrench size={17} /></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-amber-950">Existing Admin Tools</h3><p className="mt-1 text-sm leading-6 text-amber-800">Media, Pages, the full Booking CRM, creator approvals, payouts, discounts, and user administration remain available during migration. Trip management is now native.</p><Link to="/staff/admin/legacy" className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-lg bg-amber-900 px-3 text-sm font-semibold text-white hover:bg-amber-800">Open existing tools <ArrowRight size={15} /></Link></div></div></div>;

export default LegacyAdminToolsCard;
