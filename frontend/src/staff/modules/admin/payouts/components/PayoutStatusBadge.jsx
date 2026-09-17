import React from 'react';
import { payoutStatusLabel } from '../payoutHelpers.js';

const tones = { REQUESTED: 'bg-amber-50 text-amber-700 ring-amber-200', UNDER_REVIEW: 'bg-blue-50 text-blue-700 ring-blue-200', PROCESSING: 'bg-emerald-50 text-emerald-700 ring-emerald-200', CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200' };
const PayoutStatusBadge = ({ status }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${tones[status] || 'bg-slate-50 text-slate-700 ring-slate-200'}`}>{payoutStatusLabel(status)}</span>;
export default PayoutStatusBadge;

