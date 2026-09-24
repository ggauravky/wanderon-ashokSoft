import OperationsStatusBadge from './OperationsStatusBadge.jsx';
import { formatOperationsMoney, formatOperationsWindow, formatStartTiming } from '../helpers/operationsFormatters.js';

export default function OperationsDepartureCard({ departure }) {
  const paymentReady = departure.payment.paidBookings === departure.bookingCount;
  return <article className="rounded-xl border border-slate-200 bg-white p-4 md:hidden">
    <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-slate-950">{departure.title}</p><p className="mt-0.5 text-xs text-slate-500">{departure.destination || 'Destination not recorded'}</p></div><OperationsStatusBadge value={departure.operationalPhase} /></div>
    <div className="mt-4 grid grid-cols-2 gap-3 text-xs"><div><p className="text-slate-400">Type</p><p className="mt-1 font-semibold text-slate-700">{departure.type}</p></div><div><p className="text-slate-400">Timing</p><p className="mt-1 font-semibold text-slate-700">{formatStartTiming(departure)}</p></div><div className="col-span-2"><p className="text-slate-400">Travel window</p><p className="mt-1 font-semibold text-slate-700">{formatOperationsWindow(departure)}</p></div><div><p className="text-slate-400">Load</p><p className="mt-1 font-semibold text-slate-700">{departure.bookingCount} bookings · {departure.travelerCount} travelers</p></div><div><p className="text-slate-400">Payment</p><p className={`mt-1 font-semibold ${paymentReady ? 'text-emerald-700' : 'text-amber-700'}`}>{paymentReady ? 'Fully paid' : `${departure.payment.outstandingBookings} pending · ${formatOperationsMoney(departure.payment.outstandingAmount)}`}</p></div></div>
  </article>;
}
