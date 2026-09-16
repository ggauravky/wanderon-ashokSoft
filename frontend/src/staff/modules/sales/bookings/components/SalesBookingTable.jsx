import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import { formatBookingDate, formatBookingMoney, getBookingRouteId, getQuotationNumber } from '../bookingHelpers.js';

const SalesBookingTable = ({ bookings }) => (
  <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white xl:block">
    <table className="w-full min-w-[1120px] border-collapse text-left"><thead className="border-b border-slate-200 bg-slate-50/80"><tr>{['Booking', 'Traveler', 'Trip', 'Quotation', 'Amount', 'Payment', 'Booking status', 'Created', 'Action'].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">{bookings.map((booking) => <tr key={getBookingRouteId(booking)} className="align-top hover:bg-slate-50/70"><td className="px-4 py-4 font-mono text-xs font-semibold text-slate-900">{booking.bookingId}</td><td className="px-4 py-4"><p className="max-w-40 truncate text-sm font-semibold text-slate-900">{booking.customer?.name || 'Not provided'}</p><p className="mt-1 max-w-40 truncate text-xs text-slate-500">{booking.customer?.email || '—'}</p><p className="text-xs text-slate-400">{booking.customer?.phone || '—'}</p></td><td className="px-4 py-4"><p className="max-w-44 text-sm font-medium text-slate-800">{booking.tripSnapshot?.title || 'Not provided'}</p><p className="mt-1 text-xs text-slate-500">{booking.tripSnapshot?.destination || '—'}</p><p className="mt-1 text-xs text-slate-400">{booking.tripSnapshot?.batchDate || 'Date not provided'}</p></td><td className="px-4 py-4 font-mono text-xs text-slate-600">{getQuotationNumber(booking)}</td><td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatBookingMoney(booking.pricing?.finalAmount)}</td><td className="px-4 py-4"><BookingStatusBadge status={booking.paymentStatus} /></td><td className="px-4 py-4"><BookingStatusBadge status={booking.bookingStatus} /></td><td className="px-4 py-4 text-xs text-slate-500">{formatBookingDate(booking.createdAt, true)}</td><td className="px-4 py-4"><Link to={`/staff/sales/bookings/${getBookingRouteId(booking)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open <ArrowRight size={14} aria-hidden="true" /></Link></td></tr>)}</tbody>
    </table>
  </div>
);

export default SalesBookingTable;
