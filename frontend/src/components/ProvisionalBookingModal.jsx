import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Printer, ShieldCheck, AlertCircle, 
  Loader2, CheckCircle2, Calendar, MapPin, Users, 
  Clock, ArrowRight, Lock, CreditCard, Sparkles, BedDouble
} from 'lucide-react';
import jsPDF from 'jspdf';
import * as apiService from '../services/api.js';

const { getProvisionalLetterApi } = apiService;

export const ProvisionalBookingModal = ({ 
  isOpen, 
  onClose, 
  bookingId, 
  initialBookingData = null,
  onPayBalance = null
}) => {
  const documentRef = useRef(null);

  const [letterData, setLetterData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setLetterData(null);
      setError('');
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError('');

        let data = null;
        if (bookingId) {
          try {
            data = await getProvisionalLetterApi(bookingId);
          } catch (apiErr) {
            console.warn('Provisional letter API fetch fallback to snapshot data:', apiErr.message);
          }
        }

        if (!data && initialBookingData) {
          const b = initialBookingData;
          const finalAmount = Number(b.pricing?.finalAmount) || 18500;
          const amountPaid = Number(b.pricing?.amountPaid) || Math.round(finalAmount * 0.1);
          const amountOutstanding = Number(b.pricing?.amountOutstanding) || (finalAmount - amountPaid);

          data = {
            bookingId: b.bookingId || b.id || 'WLX-2026-PROVISIONAL',
            bookingStatus: b.bookingStatus || 'PROVISIONALLY_CONFIRMED',
            paymentStatus: b.paymentStatus || 'PARTIALLY_PAID',
            confirmedAt: b.payment?.paidAt || b.createdAt || new Date().toISOString(),
            trip: {
              id: b.tripId || '1',
              title: b.tripSnapshot?.title || b.tripTitle || 'Himalayan Expedition',
              destination: b.tripSnapshot?.destination || b.destination || b.tripSnapshot?.location || 'India',
              duration: b.tripSnapshot?.duration || b.duration || '5D/4N',
              batchDate: b.tripSnapshot?.batchDate || b.batchDate || '15 Sep - 20 Sep 2026',
              pickupPoint: b.tripSnapshot?.pickupPoint || b.pickupPoint || 'Airport Arrival Terminal',
              image: b.tripSnapshot?.image || b.image
            },
            leadTraveler: {
              name: b.customer?.name || b.leadTraveler?.name || 'Valued Explorer',
              email: b.customer?.email || b.leadTraveler?.email || 'traveler@wanderluxe.in',
              phone: b.customer?.phone || b.leadTraveler?.phone || '+91 9876543210',
              age: b.customer?.age || b.leadTraveler?.age || 24,
              gender: b.customer?.gender || b.leadTraveler?.gender || 'Adult'
            },
            coTravelers: b.travelers || b.coTravelers || [],
            numberOfTravelers: b.numberOfTravelers || b.travelersCount || 1,
            occupancy: b.occupancy || 'Double Sharing',
            totalCost: finalAmount,
            amountPaid,
            amountOutstanding,
            balanceDueDate: b.pricing?.balanceDueDate || new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
            depositPercent: b.paymentPlan?.depositPercent || 10,
            payments: b.payments || []
          };
        }

        if (!data) {
          throw new Error('Could not load provisional booking details.');
        }

        setLetterData(data);
      } catch (err) {
        setError(err.message || 'Failed to load provisional confirmation.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOpen, bookingId, initialBookingData]);

  const handleDownloadPdf = async () => {
    if (!documentRef.current || isGeneratingPdf) return;
    try {
      setIsGeneratingPdf(true);
      const element = documentRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`WanderLuxe_Provisional_Letter_${letterData?.bookingId || 'WLX'}.pdf`);
    } catch (pdfErr) {
      console.error('PDF Generation Error:', pdfErr);
      alert('Could not export PDF. Please use browser print option.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 300);
  };

  if (!isOpen) return null;

  const formattedDueDate = letterData?.balanceDueDate 
    ? new Date(letterData.balanceDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : '6 Days before departure';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 print:p-0 print:bg-white">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none my-auto">
        
        {/* Modal Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Provisional Booking Confirmation
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !!error || isPrinting}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
              title="Print Document"
            >
              <Printer size={16} />
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={loading || !!error || isGeneratingPdf}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isGeneratingPdf ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
              <span>Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-6 md:p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:p-0">
          
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
              <p className="text-xs font-bold text-slate-500">Generating Official Provisional Confirmation...</p>
            </div>
          ) : error ? (
            <div className="p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle size={24} />
              </div>
              <h3 className="text-base font-black text-slate-900">Document Unavailable</h3>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : (
            <div ref={documentRef} className="bg-white p-2 space-y-6 text-slate-800">
              
              {/* Document Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b-2 border-slate-900 gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-black tracking-tight text-slate-950">WANDER<span className="text-emerald-600">LUXE</span></span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 border-l border-slate-300 pl-2">EXPEDITIONS</span>
                  </div>
                  <h1 className="text-sm font-black text-slate-900 uppercase tracking-wider mt-1">
                    PROVISIONAL BOOKING CONFIRMATION
                  </h1>
                </div>

                <div className="sm:text-right">
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Booking Reference</span>
                  <span className="text-sm font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-0.5 rounded-md inline-block">
                    {letterData.bookingId}
                  </span>
                </div>
              </div>

              {/* Notice Banner */}
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-900">
                <ShieldCheck size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black block text-amber-950">10% Deposit Verified • Provisional Seat Reserved</span>
                  <span className="font-medium text-amber-800">
                    Your seat is temporarily reserved. Your official boarding pass and captain QR code will become available immediately once the outstanding balance is paid.
                  </span>
                </div>
              </div>

              {/* Trip & Batch Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Expedition</span>
                  <span className="font-black text-slate-900 block truncate">{letterData.trip.title}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Departure Dates</span>
                  <span className="font-black text-slate-900 block">{letterData.trip.batchDate}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Duration & Room</span>
                  <span className="font-black text-emerald-700 block">{letterData.trip.duration} • {letterData.occupancy}</span>
                </div>
                <div className="col-span-2 sm:col-span-3 pt-2 border-t border-slate-200 text-slate-600">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Designated Pickup Hub</span>
                  <span className="font-bold text-slate-900">{letterData.trip.pickupPoint}</span>
                </div>
              </div>

              {/* Passenger Manifest */}
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-slate-700 tracking-wider block">
                  Passenger Roster ({letterData.numberOfTravelers} Pax)
                </span>
                
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center font-bold text-slate-900">
                    <span>1. {letterData.leadTraveler.name} <span className="text-[10px] text-emerald-700">(Lead Contact)</span></span>
                    <span className="text-slate-500 font-normal">{letterData.leadTraveler.email} • {letterData.leadTraveler.phone}</span>
                  </div>
                  {letterData.coTravelers?.map((ct, idx) => (
                    <div key={idx} className="flex justify-between items-center text-slate-700 pt-1 border-t border-slate-200/60">
                      <span>{idx + 2}. {ct.name}</span>
                      <span className="text-slate-500">{ct.gender}, {ct.age} yrs</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial & Balance Matrix */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs text-slate-300">
                  <span>Total Expedition Cost:</span>
                  <span className="text-sm font-bold text-white">₹{letterData.totalCost.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-emerald-300 font-bold pt-1.5 border-t border-slate-700">
                  <span>Amount Paid Today (10% Deposit):</span>
                  <span>₹{letterData.amountPaid.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-black text-amber-300 pt-1.5 border-t border-slate-700">
                  <span>Outstanding Balance (90%):</span>
                  <span className="text-base font-black">₹{letterData.amountOutstanding.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/80">
                  <span>Balance Due Deadline:</span>
                  <span className="font-black text-amber-400 uppercase tracking-wide">{formattedDueDate}</span>
                </div>
              </div>

              {/* Pay Balance Action Banner (Print Hidden) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <div className="text-[11px] text-slate-500">
                  Have questions? Contact 24/7 Expedition Desk: <strong className="text-slate-800">+91 85420 36499</strong>
                </div>

                {letterData.amountOutstanding > 0 && onPayBalance && (
                  <button
                    onClick={() => {
                      onClose();
                      onPayBalance(letterData);
                    }}
                    className="w-full sm:w-auto px-5 py-3 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md shadow-emerald-500/25 flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <CreditCard size={14} />
                    <span>Pay Remaining ₹{letterData.amountOutstanding.toLocaleString()}</span>
                  </button>
                )}
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ProvisionalBookingModal;
