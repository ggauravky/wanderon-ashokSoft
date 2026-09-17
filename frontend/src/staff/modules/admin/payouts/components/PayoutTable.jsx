import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { payoutDate, payoutMoney, payoutPeriod } from '../payoutHelpers.js';
import PayoutStatusBadge from './PayoutStatusBadge.jsx';

const PayoutTable = ({ payouts }) => <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:block"><table className="w-full text-left text-sm"><thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500"><tr>{['Payout', 'Creator', 'Period', 'Amount', 'Status', 'Updated', 'Action'].map((label) => <th key={label} className="px-4 py-3 font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{payouts.map((payout) => <tr key={payout._id} className="hover:bg-slate-50/70"><td className="px-4 py-4 font-mono text-xs font-semibold text-slate-700">{payout.reference || payout.providerReference || payout._id.slice(-8)}</td><td className="px-4 py-4"><p className="font-semibold text-slate-900">{payout.creatorUserId?.name || payout.influencerName}</p><p className="text-xs text-slate-500">{payout.creatorUserId?.email || payout.influencerEmail}</p></td><td className="px-4 py-4 text-slate-600">{payoutPeriod(payout)}</td><td className="px-4 py-4 font-semibold text-slate-950">{payoutMoney(payout.amount, payout.currency)}</td><td className="px-4 py-4"><PayoutStatusBadge status={payout.status} /></td><td className="px-4 py-4 text-slate-500">{payoutDate(payout.updatedAt)}</td><td className="px-4 py-4"><Link to={`/staff/admin/payouts/${payout._id}`} className="inline-flex items-center gap-1 font-semibold text-emerald-700">View <ArrowRight size={14} /></Link></td></tr>)}</tbody></table></div>;
export default PayoutTable;

