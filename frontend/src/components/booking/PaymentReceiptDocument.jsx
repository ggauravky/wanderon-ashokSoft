import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { customerSupport } from '../../config/support.js';

const money = (value) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

const date = (value) =>
  value ? new Date(value).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const value = (text) => text || '—';

const Row = ({ label, children }) => (
  <div className="flex justify-between gap-4 py-2 border-b border-slate-100 text-xs">
    <span className="text-slate-500 font-medium">{label}</span>
    <span className="text-right font-bold text-slate-900 break-all">{children}</span>
  </div>
);

export default function PaymentReceiptDocument({ receipt, documentRef }) {
  const [qr, setQr] = useState('');

  useEffect(() => {
    let active = true;
    if (receipt?.verification?.url) {
      QRCode.toDataURL(receipt.verification.url, {
        width: 320,
        margin: 2,
        color: { dark: '#091224', light: '#ffffff' }
      }).then((url) => {
        if (active) setQr(url);
      }).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [receipt?.verification?.url]);

  if (!receipt) return null;

  const currentPaid = receipt.pricing?.amountPaidToDate;
  const isFullyPaidAtEvent = receipt.pricing?.amountOutstanding === 0;

  return (
    <article
      ref={documentRef}
      id="payment-receipt-document"
      className="bg-white text-slate-900 mx-auto max-w-[760px] p-7 sm:p-10 shadow-sm border border-slate-200 rounded-2xl"
      style={{ minHeight: 940 }}
    >
      {/* Header */}
      <div className="border-b-4 border-emerald-600 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-widest text-emerald-700 text-xl">WANDER<span className="text-slate-950">LUXE</span></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 border-l border-slate-300 pl-2">EXPEDITIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-4">Payment Receipt</h1>
          <p className="text-emerald-700 text-xs font-black uppercase tracking-wider mt-1">VERIFIED PAYMENT</p>
        </div>

        <div className="sm:text-right text-xs leading-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div>Receipt No. <strong className="font-mono text-slate-900">{value(receipt.receiptNumber)}</strong></div>
          <div>Booking Ref. <strong className="font-mono text-slate-900">{value(receipt.bookingId)}</strong></div>
          <div className="text-slate-500">Date: <strong className="text-slate-800">{date(receipt.payment?.verifiedAt)}</strong></div>
        </div>
      </div>

      {/* Customer & Trip Details */}
      <div className="grid sm:grid-cols-2 gap-8 py-6 border-b border-slate-100">
        <section>
          <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3">Received From</h2>
          <p className="font-bold text-base text-slate-900">{value(receipt.customer?.name)}</p>
          <p className="text-xs text-slate-600 mt-0.5">{value(receipt.customer?.email)}</p>
          <p className="text-xs text-slate-600">{value(receipt.customer?.phone)}</p>
        </section>

        <section>
          <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3">Journey Details</h2>
          <p className="font-bold text-base text-slate-900">{value(receipt.trip?.title)}</p>
          <p className="text-xs text-slate-600 mt-0.5">{value(receipt.trip?.destination)} • {value(receipt.trip?.batchDate)}</p>
          <p className="text-xs text-slate-600">{receipt.trip?.numberOfTravelers ?? '—'} Traveler(s)</p>
        </section>
      </div>

      {/* Highlighted Payment Card */}
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 my-6">
        <div>
          <p className="text-[11px] uppercase font-bold text-emerald-800 tracking-wider">Amount Paid Today</p>
          <p className="text-3xl font-black text-emerald-950 mt-1">{money(receipt.payment?.amount)}</p>
        </div>
        <span className="px-3.5 py-1.5 rounded-full bg-emerald-600 text-white font-black text-xs uppercase tracking-wider shadow-sm">
          PAYMENT RECEIVED
        </span>
      </div>

      {/* Transaction & Balance Grid */}
      <div className="grid sm:grid-cols-2 gap-8">
        <section>
          <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3">Transaction Details</h2>
          <Row label="Payment Type">{value(receipt.payment?.type)}</Row>
          <Row label="Payment Gateway">Razorpay</Row>
          <Row label="Razorpay Payment ID">{value(receipt.payment?.paymentId)}</Row>
          <Row label="Razorpay Order ID">{value(receipt.payment?.orderId)}</Row>
          <Row label="Status">Verified</Row>
        </section>

        <section>
          <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3">Booking Balance Matrix</h2>
          <Row label="Total Journey Value">{money(receipt.pricing?.totalAmount)}</Row>
          <Row label="Paid in this Transaction">{money(receipt.payment?.amount)}</Row>
          <Row label="Cumulative Paid to Date">{money(currentPaid)}</Row>
          <Row label="Outstanding Balance">{money(receipt.pricing?.amountOutstanding)}</Row>
        </section>
      </div>

      {/* QR & Verification Notice */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-100 pt-6">
        <div className="max-w-md text-xs text-slate-600 space-y-2">
          <p className={`font-bold ${isFullyPaidAtEvent ? 'text-emerald-700' : 'text-amber-800'}`}>
            {isFullyPaidAtEvent ? 'CONFIRMED · PAID IN FULL' : 'PROVISIONALLY RESERVED · PARTIALLY PAID'}
          </p>
          <p className="text-slate-500">
            This receipt confirms the above transaction. Scan the QR code to verify live booking status with WanderLuxe.
          </p>
          <p className="text-[11px] text-slate-400 pt-1">
            WanderLuxe Support: <strong className="text-slate-700">{customerSupport.phone}</strong> • {customerSupport.email}
          </p>
        </div>

        {qr && (
          <div className="text-center shrink-0 bg-white p-2 rounded-xl border border-slate-200">
            <img src={qr} alt="Booking verification QR" width="116" height="116" className="mx-auto" />
            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block mt-1">
              VERIFY BOOKING
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
