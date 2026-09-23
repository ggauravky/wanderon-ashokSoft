import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ShieldCheck, MapPin, Calendar, Clock, Users, Phone, Mail, CheckCircle2 } from 'lucide-react';
import { customerSupport } from '../../config/support.js';

const money = (value) =>
  value === null || value === undefined || !Number.isFinite(Number(value))
    ? '—'
    : new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(value));

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

export default function BookingConfirmationDocument({ booking, documentRef }) {
  const [qr, setQr] = useState('');

  const isProvisional = booking?.bookingStatus !== 'CONFIRMED' || booking?.paymentStatus !== 'PAID';
  const trip = booking?.tripSnapshot || {};
  const customer = booking?.customer || {};
  const pricing = booking?.pricing || {};
  const travelers = Array.isArray(booking?.travelers) ? booking.travelers : [];
  const payments = Array.isArray(booking?.payments) ? booking.payments.filter((p) => p.paymentId && p.verifiedAt) : [];

  useEffect(() => {
    let active = true;
    const url = booking?.qrCode?.verificationUrl;
    if (url) {
      QRCode.toDataURL(url, {
        width: 320,
        margin: 2,
        color: { dark: '#091224', light: '#ffffff' }
      }).then((data) => {
        if (active) setQr(data);
      }).catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [booking?.qrCode?.verificationUrl]);

  if (!booking) return null;

  return (
    <article
      ref={documentRef}
      id="booking-confirmation-document"
      className="bg-white text-slate-900 mx-auto max-w-[760px] p-7 sm:p-10 shadow-sm border border-slate-200 rounded-2xl"
      style={{ minHeight: 960 }}
    >
      {/* Header Bar */}
      <div className={`border-b-4 pb-6 flex flex-col sm:flex-row justify-between items-start gap-4 ${isProvisional ? 'border-amber-500' : 'border-emerald-600'}`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black tracking-widest text-emerald-700 text-xl">WANDER<span className="text-slate-950">LUXE</span></span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 border-l border-slate-300 pl-2">EXPEDITIONS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-4">
            {isProvisional ? 'Provisional Booking Confirmation' : 'Booking Confirmation'}
          </h1>
          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
              isProvisional ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
            }`}>
              <ShieldCheck size={14} />
              {isProvisional ? 'Deposit Verified · Seat Reserved' : 'Payment Verified · Booking Confirmed'}
            </span>
          </div>
        </div>

        <div className="sm:text-right text-xs leading-6 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-slate-500 font-bold uppercase text-[10px] tracking-wider">Booking Reference</div>
          <div className="text-base font-mono font-black text-slate-900">{booking.bookingId || '—'}</div>
          <div className="text-slate-500 mt-1">Date: <strong className="text-slate-800">{formatDate(booking.createdAt || booking.updatedAt)}</strong></div>
        </div>
      </div>

      {/* Traveler & Expedition Sections */}
      <div className="grid sm:grid-cols-2 gap-8 py-6 border-b border-slate-100">
        <section>
          <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <Users size={14} className="text-emerald-600" /> Lead Passenger & Contact
          </h2>
          <p className="font-bold text-base text-slate-900">{customer.name || '—'}</p>
          <p className="text-sm text-slate-600 mt-0.5">{customer.email || '—'}</p>
          <p className="text-sm text-slate-600">{customer.phone || '—'}</p>
          <div className="mt-3 text-xs text-slate-500">
            <span>Party Size: <strong className="text-slate-800">{booking.numberOfTravelers ?? 1} Traveler(s)</strong></span>
            <span className="mx-2">•</span>
            <span>Room: <strong className="text-slate-800">{booking.occupancy || 'Double Sharing'}</strong></span>
          </div>
        </section>

        <section>
          <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3 flex items-center gap-1.5">
            <MapPin size={14} className="text-emerald-600" /> Expedition Specs
          </h2>
          <p className="font-bold text-base text-slate-900">{trip.title || '—'}</p>
          <p className="text-sm text-slate-600 mt-0.5">{trip.destination || trip.location || '—'}</p>
          <div className="mt-2 space-y-1 text-xs text-slate-600">
            <div>Departure: <strong className="text-slate-800">{trip.batchDate || 'To be confirmed'}</strong></div>
            <div>Duration: <strong className="text-slate-800">{trip.duration || '—'}</strong></div>
            <div>Pickup Hub: <strong className="text-slate-800">{trip.pickupPoint || 'To be confirmed'}</strong></div>
          </div>
        </section>
      </div>

      {/* Co-Travelers if any */}
      {travelers.length > 0 && (
        <section className="py-4 border-b border-slate-100 text-xs">
          <h3 className="font-bold uppercase tracking-wider text-slate-400 mb-2">
            Co-Travelers Manifest ({travelers.length})
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {travelers.map((t, idx) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                <span className="font-bold text-slate-800">{idx + 2}. {t.name || 'Traveler'}</span>
                <span className="text-slate-500">{t.gender || '—'}, {t.age ? `${t.age} Yrs` : '—'}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pricing & Financial Summary */}
      <section className="py-6 border-b border-slate-100">
        <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3">
          Reservation & Financial Schedule
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Total Expedition Value</span>
            <span className="text-lg font-black text-slate-900 mt-1 block">{money(pricing.finalAmount)}</span>
          </div>

          <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 block uppercase">Amount Paid to Date</span>
            <span className="text-lg font-black text-emerald-900 mt-1 block">{money(pricing.amountPaid)}</span>
          </div>

          <div className={`p-4 rounded-xl border ${isProvisional ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
            <span className={`text-[11px] font-bold block uppercase ${isProvisional ? 'text-amber-800' : 'text-slate-500'}`}>
              Remaining Balance
            </span>
            <span className={`text-lg font-black mt-1 block ${isProvisional ? 'text-amber-900' : 'text-slate-900'}`}>
              {money(pricing.amountOutstanding)}
            </span>
            {isProvisional && pricing.balanceDueDate && (
              <span className="text-[10px] text-amber-800 font-bold block mt-1">
                Due: {formatDate(pricing.balanceDueDate)}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Verified Payment History */}
      <section className="py-6 border-b border-slate-100">
        <h2 className="font-bold uppercase tracking-wider text-xs text-slate-400 mb-3">
          Verified Payment Transactions
        </h2>
        {payments.length > 0 ? (
          <div className="divide-y divide-slate-100 text-xs">
            {payments.map((p, idx) => (
              <div key={p.paymentId || idx} className="py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-emerald-600" />
                  <span className="font-bold text-slate-800">{p.type || 'PAYMENT'}</span>
                  <span className="text-slate-500">Ref: {p.paymentId}</span>
                </div>
                <div className="text-right">
                  <strong className="text-slate-900 font-black">{money(p.amount)}</strong>
                  <span className="text-slate-400 ml-2">{formatDate(p.verifiedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-500">No verified payment transactions recorded.</p>
        )}
      </section>

      {/* QR & Verification Notice */}
      <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="max-w-md text-xs text-slate-600 space-y-2">
          <p className="font-bold text-slate-900">
            {isProvisional
              ? 'This document confirms a provisional reservation. The official Boarding Pass remains locked until full balance payment.'
              : 'This document confirms your verified reservation. Your official Boarding Pass is available separately for check-in.'}
          </p>
          <p className="text-slate-500">
            Scan the verification QR code using a smartphone camera to inspect the live status of this booking in the WanderLuxe system.
          </p>
          <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            Support: <strong className="text-slate-700">{customerSupport.phone}</strong> • {customerSupport.email}
          </p>
        </div>

        {qr && (
          <div className="text-center shrink-0 bg-white p-2 rounded-xl border border-slate-200">
            <img src={qr} alt="Booking Verification QR" width="130" height="130" className="mx-auto" />
            <span className="text-[9px] font-black uppercase text-slate-800 tracking-wider block mt-1">
              BOOKING VERIFICATION QR
            </span>
          </div>
        )}
      </div>
    </article>
  );
}
