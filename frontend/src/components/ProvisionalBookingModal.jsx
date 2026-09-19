import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Printer, ShieldCheck, AlertCircle, 
  Loader2, CheckCircle2, Calendar, MapPin, Users, 
  Clock, ArrowRight, Lock, CreditCard, Sparkles, BedDouble
} from 'lucide-react';
import QRCode from 'qrcode';
import { downloadBookingPdf, printBookingDocument } from '../utils/bookingPdf.js';
import { customerSupport } from '../config/support.js';
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
  const [qr, setQr] = useState('');

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

        const data = bookingId ? await getProvisionalLetterApi(bookingId) : null;

        if (!data) {
          throw new Error('Could not load provisional booking details.');
        }

        setLetterData(data);
        if (data.verificationUrl) setQr(await QRCode.toDataURL(data.verificationUrl, { width: 320, margin: 2 }));
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
      await downloadBookingPdf(documentRef.current, `WanderLuxe_Provisional_Confirmation_${letterData.bookingId || 'WLX'}.pdf`);
    } catch (pdfErr) {
      console.error('PDF Generation Error:', pdfErr);
      setError('Unable to generate this document. Please try again.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try { printBookingDocument(documentRef.current); } finally { setIsPrinting(false); }
  };

  if (!isOpen) return null;

  const formattedDueDate = letterData?.balanceDueDate 
    ? new Date(letterData.balanceDueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'To be confirmed';

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
                  <span className="font-black block text-amber-950">Deposit Verified • Provisional Seat Reserved</span>
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
                  <span>Amount Paid:</span>
                  <span>₹{letterData.amountPaid.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-sm font-black text-amber-300 pt-1.5 border-t border-slate-700">
                  <span>Outstanding Balance:</span>
                  <span className="text-base font-black">₹{letterData.amountOutstanding.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-400 pt-2 border-t border-slate-700/80">
                  <span>Balance Due Deadline:</span>
                  <span className="font-black text-amber-400 uppercase tracking-wide">{formattedDueDate}</span>
                </div>
              </div>

              {qr && <div className="flex items-center justify-between gap-3 border-t pt-4"><div><strong className="text-xs">BOOKING VERIFICATION QR</strong><p className="text-xs text-slate-500">Scan to check the current booking status. This is not a Boarding QR.</p></div><img src={qr} width="110" height="110" alt="Booking verification QR" /></div>}
              {/* Pay Balance Action Banner (Print Hidden) */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 print:hidden">
                <div className="text-[11px] text-slate-500">
                  Have questions? Contact WanderLuxe Support: <strong className="text-slate-800">{customerSupport.phone}</strong>
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
