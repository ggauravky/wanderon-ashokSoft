import React from 'react';
import { CheckCircle2, Download, FileText, Ticket, ArrowRight, ShieldCheck } from 'lucide-react';
import DocumentDialog from './DocumentDialog.jsx';

const money = (value) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function PaymentSuccessModal({
  booking,
  payment: paymentProp,
  paymentEvent,
  isOpen = true,
  onClose,
  onReceipt,
  onViewReceipt,
  onConfirmation,
  onViewBookingConfirmation,
  onBoarding,
  onViewBoardingPass,
  onBookings
}) {
  const payment = paymentProp || paymentEvent;
  const handleReceipt = onReceipt || (onViewReceipt ? () => onViewReceipt(booking, payment) : null);
  const handleConfirmation = onConfirmation || (onViewBookingConfirmation ? () => onViewBookingConfirmation(booking) : null);
  const handleBoarding = onBoarding || (onViewBoardingPass ? () => onViewBoardingPass(booking) : null);

  if (!isOpen || !booking || !payment) return null;

  const isFullOrBalance = (booking.bookingStatus === 'CONFIRMED' && booking.paymentStatus === 'PAID') || payment.type === 'FULL' || payment.type === 'BALANCE';
  const isDeposit = payment.type === 'DEPOSIT';

  let title = 'Payment Successful';
  let subtitle = 'Your WanderLuxe journey is confirmed.';
  let typeLabel = 'Full Payment';

  if (isDeposit) {
    title = 'Deposit Received';
    subtitle = 'Your seat has been provisionally reserved.';
    typeLabel = 'Booking Deposit';
  } else if (payment.type === 'BALANCE') {
    title = 'Balance Payment Successful';
    subtitle = 'Your booking is now fully confirmed.';
    typeLabel = 'Final Balance';
  }

  const outstanding = booking.pricing?.amountOutstanding;
  const dueDateStr = booking.pricing?.balanceDueDate
    ? new Date(booking.pricing.balanceDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <DocumentDialog
      title="Payment Confirmation"
      onClose={onClose}
      footer={
        <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={onBookings}
            className="w-full sm:w-auto text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3"
          >
            Go to My Bookings
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
          >
            View Booking
          </button>
        </div>
      }
    >
      <div className="bg-white rounded-3xl max-w-xl mx-auto p-6 sm:p-8 border border-slate-200 text-center shadow-sm">
        {/* Animated Success Badge */}
        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-emerald-500/30">
          <CheckCircle2 size={36} className="animate-in zoom-in duration-300" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black uppercase tracking-wider mb-2">
          <ShieldCheck size={13} />
          {title}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
          {title}
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-1 font-medium">
          {subtitle}
        </p>

        {/* Amount Paid Callout */}
        <div className="mt-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5">
          <div className="text-[11px] uppercase font-black tracking-wider text-emerald-800">
            Verified Amount Paid
          </div>
          <div className="text-3xl sm:text-4xl font-black text-emerald-950 mt-1">
            {money(payment.amount)}
          </div>
        </div>

        {/* Verified Payment Summary */}
        <div className="mt-6 text-left text-xs bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-2.5">
          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Payment Type</span>
            <span className="font-extrabold text-slate-900">{typeLabel}</span>
          </div>

          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Booking ID</span>
            <span className="font-mono font-extrabold text-slate-900">{booking.bookingId || '—'}</span>
          </div>

          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Trip</span>
            <span className="font-extrabold text-slate-900 text-right truncate max-w-[240px]">
              {booking.tripSnapshot?.title || '—'}
            </span>
          </div>

          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Lead Traveler</span>
            <span className="font-extrabold text-slate-900">{booking.customer?.name || '—'}</span>
          </div>

          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Payment Date</span>
            <span className="font-medium text-slate-800">{formatDate(payment.verifiedAt)}</span>
          </div>

          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Razorpay Payment ID</span>
            <span className="font-mono font-medium text-slate-800 break-all">{payment.paymentId || '—'}</span>
          </div>

          <div className="flex justify-between gap-4 pb-2 border-b border-slate-200/70">
            <span className="text-slate-500 font-medium">Razorpay Order ID</span>
            <span className="font-mono font-medium text-slate-800 break-all">{payment.orderId || '—'}</span>
          </div>

          <div className="flex justify-between gap-4 pt-1">
            <span className="text-slate-500 font-medium">Verification Status</span>
            <span className="font-black text-emerald-700 flex items-center gap-1">
              <CheckCircle2 size={13} /> Verified
            </span>
          </div>
        </div>

        {/* Conditional Status Messages */}
        {isDeposit ? (
          <div className="text-amber-900 text-xs bg-amber-50 border border-amber-200 rounded-2xl p-4 mt-4 text-left">
            <div className="font-black">Remaining Balance: {money(outstanding)}</div>
            {dueDateStr && <div className="text-amber-800 font-medium mt-0.5">Due date: {dueDateStr}</div>}
            <div className="text-amber-700 text-[11px] mt-1 font-medium">
              Official Boarding Pass unlocks immediately after full balance payment.
            </div>
          </div>
        ) : isFullOrBalance ? (
          <div className="text-emerald-900 text-xs bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mt-4 text-left flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
            <div>
              <span className="font-black block">Your booking is fully confirmed.</span>
              <span className="text-emerald-700 text-[11px]">Official Boarding Pass is now unlocked and ready for check-in.</span>
            </div>
          </div>
        ) : null}

        {/* Primary Action Buttons */}
        <div className="grid sm:grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleReceipt}
            className="py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download size={15} /> Download Receipt
          </button>

          {isFullOrBalance ? (
            <button
              onClick={handleBoarding}
              className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Ticket size={15} className="text-emerald-600" /> Boarding Pass
            </button>
          ) : (
            <button
              onClick={handleConfirmation}
              className="py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-900 font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <FileText size={15} className="text-amber-600" /> Booking Confirmation
            </button>
          )}
        </div>
      </div>
    </DocumentDialog>
  );
}
