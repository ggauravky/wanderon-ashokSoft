import React from 'react';
import BookingStatusBadge from './BookingStatusBadge.jsx';
import PaymentStatusBadge from './PaymentStatusBadge.jsx';
import { formatBookingDate, formatBookingMoney, getAmountRemaining } from '../bookingAdminHelpers.js';

const Metric = ({ label, children }) => <div className="rounded-lg border border-slate-200 bg-slate-50 p-3"><p className="text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">{label}</p><div className="mt-1 text-sm font-semibold text-slate-900">{children}</div></div>;
const BookingSummary = ({ booking }) => <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-950">Booking summary</h2><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><Metric label="Booking status"><BookingStatusBadge status={booking.bookingStatus} /></Metric><Metric label="Payment status"><PaymentStatusBadge status={booking.paymentStatus} /></Metric><Metric label="Created">{formatBookingDate(booking.createdAt, true)}</Metric><Metric label="Updated">{formatBookingDate(booking.updatedAt, true)}</Metric></div><div className="mt-4 grid gap-3 sm:grid-cols-3"><Metric label="Total">{formatBookingMoney(booking.pricing?.finalAmount, booking.pricing?.currency)}</Metric><Metric label="Paid">{formatBookingMoney(booking.pricing?.amountPaid, booking.pricing?.currency)}</Metric><Metric label="Remaining">{formatBookingMoney(getAmountRemaining(booking), booking.pricing?.currency)}</Metric></div></section>;

export default BookingSummary;

