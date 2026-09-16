import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, CreditCard, Calendar, Users, MapPin, Phone, Mail,
  CheckCircle2, Clock, ExternalLink, Copy, Check, FileText,
  ShieldCheck, AlertCircle, ArrowRight
} from 'lucide-react';
import { getBookingByIdApi } from '../services/api.js';

export default function BookingDetailsModal({
  isOpen,
  onClose,
  bookingCode,
  bookingData = null,
  quotationData = null
}) {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(bookingData);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedCheckout, setCopiedCheckout] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    if (bookingData) {
      setBooking(bookingData);
      return;
    }

    if (bookingCode) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const res = await getBookingByIdApi(bookingCode);
          if (res.booking) {
            setBooking(res.booking);
          } else if (res) {
            setBooking(res);
          }
        } catch (err) {
          console.warn('Could not fetch booking by code directly, using available fallback context:', err.message);
          // Fallback minimal object from props
          setBooking({
            bookingId: bookingCode,
            customer: quotationData?.customerSnapshot,
            tripSnapshot: quotationData?.tripRequirements,
            pricing: quotationData?.pricing,
            paymentStatus: 'UNPAID',
            bookingStatus: 'CONFIRMED'
          });
        } finally {
          setLoading(false);
        }
      };
      fetchBooking();
    }
  }, [isOpen, bookingCode, bookingData, quotationData]);

  if (!isOpen) return null;

  const currentBookingId = booking?.bookingId || bookingCode || 'WLX-BOOKING';
  const customer = booking?.customer || quotationData?.customerSnapshot || {};
  const trip = booking?.tripSnapshot || quotationData?.tripRequirements || {};
  const pricing = booking?.pricing || quotationData?.pricing || {};
  const payment = booking?.payment || { status: booking?.paymentStatus || 'UNPAID' };

  const finalAmount = Number(pricing.finalAmount || pricing.finalTotal || booking?.totalAmount || 0);
  const paidAmount = Number(booking?.paidAmount || (payment.status === 'PAID' ? finalAmount : pricing.depositRequired || 0));
  const outstandingAmount = Math.max(0, finalAmount - paidAmount);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(currentBookingId);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyCheckout = () => {
    const checkoutUrl = `${window.location.origin}/checkout?bookingId=${currentBookingId}`;
    navigator.clipboard.writeText(checkoutUrl);
    setCopiedCheckout(true);
    setTimeout(() => setCopiedCheckout(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black">
              <CreditCard size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900">Booking Order</h2>
                <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  {currentBookingId}
                  <button 
                    onClick={handleCopyCode} 
                    className="hover:text-emerald-950 p-0.5 cursor-pointer"
                    title="Copy Booking ID"
                  >
                    {copiedCode ? <Check size={11} className="text-emerald-700" /> : <Copy size={11} />}
                  </button>
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Authoritative Commercial Booking Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-600">
          {loading ? (
            <div className="py-12 text-center text-slate-400 animate-pulse font-medium">
              Loading confirmed booking details...
            </div>
          ) : (
            <>
              {/* Linked Quotation Banner */}
              {(quotationData || booking?.sourceQuotationId) && (
                <div className="bg-indigo-50/80 border border-indigo-100 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText size={16} className="text-indigo-600 shrink-0" />
                    <div>
                      <div className="text-[11px] font-black text-indigo-900">
                        Originating Quotation Reference
                      </div>
                      <div className="font-mono text-xs font-bold text-indigo-700">
                        {quotationData?.quotationNumber || 'Source Quotation'}
                      </div>
                    </div>
                  </div>
                  {quotationData?._id && (
                    <button
                      onClick={() => {
                        onClose();
                        navigate(`/staff/sales/quotations/${quotationData._id}`);
                      }}
                      className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-[11px] font-black flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                    >
                      View Quotation <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              )}

              {/* Status Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Booking Status</span>
                  <div className="mt-1 flex items-center gap-1 font-black text-slate-900">
                    <CheckCircle2 size={13} className="text-emerald-600" />
                    {booking?.bookingStatus || 'CONFIRMED'}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Payment Status</span>
                  <div className="mt-1 font-black">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase ${
                      payment.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                      payment.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' :
                      'bg-slate-200 text-slate-800'
                    }`}>
                      {payment.status || 'UNPAID'}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Total Order</span>
                  <div className="mt-1 font-black text-slate-900 text-sm">
                    ₹{finalAmount.toLocaleString()}
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                  <span className="text-[10px] uppercase tracking-wider font-black text-slate-400">Outstanding</span>
                  <div className={`mt-1 font-black text-sm ${outstandingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                    ₹{outstandingAmount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Traveler & Trip Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Customer Card */}
                <div className="border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Primary Traveler</div>
                  <div className="text-sm font-black text-slate-900">{customer.name || 'Traveler'}</div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Mail size={13} className="text-slate-400" />
                    <span>{customer.email || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone size={13} className="text-slate-400" />
                    <span>{customer.phone || 'N/A'}</span>
                  </div>
                  {customer.phone && (
                    <a
                      href={`https://wa.me/${customer.phone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 mt-1"
                    >
                      Open WhatsApp Chat <ExternalLink size={10} />
                    </a>
                  )}
                </div>

                {/* Trip Card */}
                <div className="border border-slate-200/80 rounded-2xl p-4 space-y-2">
                  <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Trip Package</div>
                  <div className="text-sm font-black text-slate-900">{trip.title || 'Expedition'}</div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{trip.destination || trip.location || 'Destination'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={13} className="text-slate-400" />
                    <span>{trip.batchDate || trip.startDate ? new Date(trip.startDate).toLocaleDateString('en-IN') : 'Scheduled Date'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Users size={13} className="text-slate-400" />
                    <span>{trip.totalTravelers || 2} Travelers ({trip.duration || '5D/4N'})</span>
                  </div>
                </div>
              </div>

              {/* Financial Snapshot */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 font-medium">
                <div className="flex justify-between items-center text-slate-600">
                  <span>Gross Order Value</span>
                  <span className="font-bold text-slate-900">₹{finalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Paid Amount</span>
                  <span className="font-bold text-emerald-600">₹{paidAmount.toLocaleString()}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-sm font-black">
                  <span className="text-slate-900">Remaining Balance</span>
                  <span className={outstandingAmount > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                    ₹{outstandingAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCheckout}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedCheckout ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copiedCheckout ? 'Link Copied' : 'Copy Checkout Link'}
            </button>

            <a
              href={`/checkout?bookingId=${currentBookingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink size={13} /> Open Checkout
            </a>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
