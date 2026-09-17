import React from 'react';
import { formatBookingDate } from '../bookingAdminHelpers.js';

const BookingActivitySection = ({ booking }) => {
  const events = [
    ['Created', booking.createdAt, booking.createdBy?.name || booking.createdBy?.email],
    ['Payment recorded', booking.payment?.paidAt, booking.payment?.razorpayPaymentId],
    ['Quotation converted', booking.quotationSnapshot?.convertedAt, booking.quotationSnapshot?.quotationNumber],
    ['Cancelled', booking.cancelledAt, booking.cancelledBy?.name || booking.cancellationReason],
    ['Inventory released', booking.inventoryReleasedAt, booking.batchId],
    ['Updated', booking.updatedAt, booking.updatedBy?.name || booking.updatedBy?.email]
  ].filter(([, date]) => date);
  return <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-semibold text-slate-950">Audit / history</h2><div className="mt-4 space-y-0">{events.map(([label, date, detail], index) => <div key={`${label}-${date}`} className="grid grid-cols-[14px_1fr] gap-3"><div className="flex flex-col items-center"><span className="mt-1 h-2.5 w-2.5 rounded-full bg-emerald-600" />{index < events.length - 1 && <span className="min-h-10 w-px flex-1 bg-slate-200" />}</div><div className="pb-4"><p className="text-sm font-semibold text-slate-900">{label}</p><p className="text-xs text-slate-500">{formatBookingDate(date, true)}{detail ? ` · ${detail}` : ''}</p></div></div>)}</div>{booking.cancellationReason && <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><span className="font-semibold">Cancellation reason:</span> {booking.cancellationReason}</div>}</section>;
};

export default BookingActivitySection;

