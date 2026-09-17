import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import PaymentStatusBadge from './PaymentStatusBadge.jsx';
import { formatBookingDate, formatBookingMoney, getAdminBookingRouteId, getBookingSourceLabel } from '../bookingAdminHelpers.js';

const AdminBookingTable = ({ bookings }) => <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white xl:block"><table className="w-full min-w-[1320px] text-left"><thead className="border-b border-slate-200 bg-slate-50"><tr>{['Booking', 'Traveler', 'Trip', 'Source', 'Total', 'Paid', 'Payment', 'Booking status', 'Travel date', 'Created', ''].map((label) => <th key={label} className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{bookings.map((booking) => <tr key={getAdminBookingRouteId(booking)} className="align-top hover:bg-slate-50/70">
  <td className="px-4 py-4 font-mono text-xs font-semibold text-emerald-700">{booking.bookingId || '—'}</td>
  <td className="px-4 py-4"><p className="max-w-40 truncate text-sm font-semibold text-slate-900">{booking.customer?.name || 'Not provided'}</p><p className="mt-1 max-w-40 truncate text-xs text-slate-500">{booking.customer?.email || '—'}</p></td>
  <td className="px-4 py-4"><p className="max-w-48 truncate text-sm font-medium text-slate-800">{booking.tripSnapshot?.title || 'Not provided'}</p><p className="mt-1 text-xs text-slate-500">{booking.tripSnapshot?.destination || '—'}</p></td>
  <td className="px-4 py-4 text-xs font-medium text-slate-600">{getBookingSourceLabel(booking)}</td>
  <td className="px-4 py-4 text-sm font-semibold text-slate-900">{formatBookingMoney(booking.pricing?.finalAmount, booking.pricing?.currency)}</td>
  <td className="px-4 py-4 text-sm text-slate-700">{formatBookingMoney(booking.pricing?.amountPaid, booking.pricing?.currency)}</td>
  <td className="px-4 py-4"><PaymentStatusBadge status={booking.paymentStatus} /></td><td className="px-4 py-4"><BookingStatusBadge status={booking.bookingStatus} /></td>
  <td className="px-4 py-4 text-xs text-slate-600">{booking.tripSnapshot?.batchDate || '—'}</td><td className="px-4 py-4 text-xs text-slate-500">{formatBookingDate(booking.createdAt, true)}</td>
  <td className="px-4 py-4"><Link to={`/staff/admin/bookings/${getAdminBookingRouteId(booking)}`} className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50">Open <ArrowRight size={14} /></Link></td>
</tr>)}</tbody></table></div>;

export default AdminBookingTable;

