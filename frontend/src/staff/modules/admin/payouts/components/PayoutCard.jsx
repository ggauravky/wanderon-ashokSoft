import React from 'react';
import { Link } from 'react-router-dom';
import { payoutDate, payoutMoney, payoutPeriod } from '../payoutHelpers.js';
import PayoutStatusBadge from './PayoutStatusBadge.jsx';

const PayoutCard = ({ payout }) => <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs text-slate-500">{payout.reference || payout._id.slice(-8)}</p><h3 className="mt-1 font-semibold text-slate-950">{payout.creatorUserId?.name || payout.influencerName}</h3></div><PayoutStatusBadge status={payout.status} /></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Amount</dt><dd className="mt-1 font-semibold">{payoutMoney(payout.amount, payout.currency)}</dd></div><div><dt className="text-xs text-slate-500">Updated</dt><dd className="mt-1">{payoutDate(payout.updatedAt)}</dd></div><div className="col-span-2"><dt className="text-xs text-slate-500">Period</dt><dd className="mt-1">{payoutPeriod(payout)}</dd></div></dl><Link to={`/staff/admin/payouts/${payout._id}`} className="mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-lg border border-slate-200 text-sm font-semibold text-slate-700">View payout</Link></article>;
export default PayoutCard;

