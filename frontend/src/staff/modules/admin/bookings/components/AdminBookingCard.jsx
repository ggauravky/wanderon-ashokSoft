import React from 'react';
import { ArrowRight, CalendarDays, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import PaymentStatusBadge from './PaymentStatusBadge.jsx';
import { formatBookingMoney, getAdminBookingRouteId } from '../bookingAdminHelpers.js';

const AdminBookingCard = ({ booking }) => <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-xs font-semibold text-emerald-700">{booking.bookingId}</p><h3 className="mt-1 text-base font-semibold text-slate-950">{booking.tripSnapshot?.title || 'Trip not provided'}</h3></div><BookingStatusBadge status={booking.bookingStatus} /></div><div className="mt-4 grid gap-2 text-sm text-slate-600"><p className="flex items-center gap-2"><UserRound size={15} className="text-slate-400" />{booking.customer?.name || 'Traveler not provided'}</p><p className="flex items-center gap-2"><CalendarDays size={15} className="text-slate-400" />{booking.tripSnapshot?.batchDate || 'Travel date not provided'}</p></div><div className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3"><div><p className="text-xs text-slate-400">Total</p><p className="font-semibold text-slate-950">{formatBookingMoney(booking.pricing?.finalAmount, booking.pricing?.currency)}</p></div><div><p className="text-xs text-slate-400">Payment</p><PaymentStatusBadge status={booking.paymentStatus} /></div></div><Link to={`/staff/admin/bookings/${getAdminBookingRouteId(booking)}`} className="mt-4 flex min-h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50">Open booking <ArrowRight size={15} /></Link></article>;

export default AdminBookingCard;
