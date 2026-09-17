export const payoutStatusLabel = (status) => ({ REQUESTED: 'Pending', UNDER_REVIEW: 'Approved', PROCESSING: 'Marked processed', PAID: 'Paid (legacy)', FAILED: 'Failed', CANCELLED: 'Rejected' }[status] || status || 'Unknown');
export const payoutMoney = (amount, currency = 'INR') => new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(Number(amount || 0));
export const payoutDate = (value) => value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
export const payoutPeriod = (payout) => payout.periodStart || payout.periodEnd ? `${payoutDate(payout.periodStart)} – ${payoutDate(payout.periodEnd)}` : 'Not specified';

