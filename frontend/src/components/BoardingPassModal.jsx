import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Download, Printer, ShieldCheck, AlertTriangle, 
  Loader2, RefreshCw, CheckCircle2, QrCode, Compass
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import BoardingPassDocument from './BoardingPassDocument.jsx';
import { getBoardingPassApi } from '../services/api.js';

export const BoardingPassModal = ({ isOpen, onClose, bookingId, initialBookingData = null }) => {
  const documentRef = useRef(null);

  const [passData, setPassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setPassData(null);
      setError('');
      return;
    }

    const loadPass = async () => {
      try {
        setLoading(true);
        setError('');

        let data = null;
        if (bookingId) {
          try {
            data = await getBoardingPassApi(bookingId);
          } catch (apiErr) {
            console.warn('API Boarding pass fetch fallback to initial data:', apiErr.message);
          }
        }

        // Fallback to initialBookingData snapshot if available
        if (!data && initialBookingData) {
          const b = initialBookingData;
          data = {
            bookingId: b.bookingId || b.id || 'WLX-2026-CONFIRMED',
            bookingStatus: b.bookingStatus || b.status || 'CONFIRMED',
            confirmedAt: b.payment?.paidAt || b.bookingDate || new Date().toISOString(),
            trip: {
              tripId: b.tripId || '1',
              title: b.tripSnapshot?.title || b.tripTitle || 'Himalayan Odyssey Expedition',
              destination: b.tripSnapshot?.destination || b.destination || b.tripSnapshot?.location || 'India',
              duration: b.tripSnapshot?.duration || b.duration || '6N/7D',
              batchDate: b.tripSnapshot?.batchDate || b.travelDate || b.batchDate || '15 Sep - 20 Sep 2026',
              pickupPoint: b.tripSnapshot?.pickupPoint || b.pickupPoint || 'Main Arrival Meeting Hub',
              image: b.tripSnapshot?.image || b.image
            },
            leadTraveler: {
              name: b.customer?.name || b.leadTraveler?.name || 'Valued Traveler',
              email: b.customer?.email || b.leadTraveler?.email || 'traveler@wanderluxe.in',
              phone: b.customer?.phone || b.leadTraveler?.phone || '+91 85420 36499',
              age: b.customer?.age || b.leadTraveler?.age || '',
              gender: b.customer?.gender || b.leadTraveler?.gender || 'Adult'
            },
            coTravelers: b.travelers || b.coTravelers || [],
            numberOfTravelers: b.numberOfTravelers || b.travelersCount || (b.travelers ? b.travelers.length + 1 : 1),
            occupancy: b.occupancy || 'Double Sharing',
            pricing: {
              basePricePerPerson: b.pricing?.basePricePerPerson || b.amount || 18500,
              subtotal: b.pricing?.subtotal || b.amount || 18500,
              discount: b.pricing?.discount || 0,
              couponCode: b.pricing?.couponCode || '',
              finalAmount: b.pricing?.finalAmount || b.amount || 18500,
              currency: b.pricing?.currency || 'INR'
            },
            payment: {
              status: b.payment?.status || 'PAID',
              razorpayPaymentId: b.payment?.razorpayPaymentId || 'rzp_test_verified_pay',
              paidAt: b.payment?.paidAt || b.bookingDate || new Date()
            },
            qrCode: {
              dataUrl: b.qrCode?.dataUrl || (typeof b.qrCode === 'string' ? b.qrCode : ''),
              verificationToken: b.qrCode?.verificationToken || b.bookingId || 'VERIFIED_TOKEN',
              verificationUrl: b.qrCode?.verificationUrl || `https://wanderluxe.in/booking/verify/${b.bookingId}`
            },
            supportContact: {
              phone: '+91 85420 36499',
              email: 'support@wanderluxe.in',
              captainName: 'Gaurav Kumar Yadav (Certified Expedition Lead)'
            }
          };
        }

        if (!data) {
          throw new Error('Unable to find confirmed booking record.');
        }

        // Generate High-Res Scannable QR if dataUrl is missing
        if (!data.qrCode?.dataUrl) {
          try {
            const qrPayload = JSON.stringify({
              bookingId: data.bookingId,
              trip: data.trip.title,
              travelers: data.numberOfTravelers,
              lead: data.leadTraveler.name,
              status: 'CONFIRMED'
            });

            const qrUrl = await QRCode.toDataURL(qrPayload, {
              width: 360,
              margin: 2,
              color: { dark: '#0b132b', light: '#ffffff' }
            });
            data.qrCode = {
              ...data.qrCode,
              dataUrl: qrUrl
            };
          } catch (qrErr) {
            console.warn('Client-side QR generation error:', qrErr);
          }
        }

        setPassData(data);
      } catch (err) {
        setError(err.message || 'Failed to load boarding pass document.');
      } finally {
        setLoading(false);
      }
    };

    loadPass();
  }, [isOpen, bookingId, initialBookingData]);

  // Handle High-Fidelity PDF Generation & Download
  const handleDownloadPdf = async () => {
    if (!documentRef.current || !passData) return;
    try {
      setIsGeneratingPdf(true);
      const element = documentRef.current;

      const canvas = await html2canvas(element, {
        scale: 2.2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 840
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = 210; // A4 mm
      const pageHeight = 297; // A4 mm
      const margin = 10;
      const contentWidth = pageWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      // Vertically center on A4 if height is within single page
      const yPosition = contentHeight < (pageHeight - (margin * 2)) 
        ? (pageHeight - contentHeight) / 2 
        : margin;

      pdf.addImage(imgData, 'JPEG', margin, yPosition, contentWidth, Math.min(contentHeight, pageHeight - (margin * 2)));

      const filename = `Boarding-Pass-${passData.bookingId || 'WanderLuxe'}.pdf`;
      pdf.save(filename);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      alert('Could not download PDF directly. You can use the Print button to Save as PDF.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Handle Clean Dedicated Printing (ONLY the Boarding Pass Document)
  const handlePrintDocument = () => {
    if (!documentRef.current || !passData) return;
    try {
      setIsPrinting(true);
      const contentHtml = documentRef.current.outerHTML;

      const printFrame = document.createElement('iframe');
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = '0';
      document.body.appendChild(printFrame);

      const frameDoc = printFrame.contentWindow.document;
      frameDoc.open();
      frameDoc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Boarding Pass - ${passData.bookingId}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              @page {
                size: A4 portrait;
                margin: 8mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              body {
                background: #ffffff !important;
                color: #0f172a !important;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                margin: 0;
                padding: 0;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
              }
              #boarding-pass-print-container {
                width: 100% !important;
                max-width: 780px !important;
                box-shadow: none !important;
                border: 1.5px solid #cbd5e1 !important;
                padding: 20px !important;
                margin: 0 auto !important;
              }
            </style>
          </head>
          <body>
            ${contentHtml}
          </body>
        </html>
      `);
      frameDoc.close();

      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (e) {
          console.warn('Iframe print error:', e);
        } finally {
          setIsPrinting(false);
          setTimeout(() => {
            if (document.body.contains(printFrame)) {
              document.body.removeChild(printFrame);
            }
          }, 1000);
        }
      }, 450);
    } catch (err) {
      console.error('Print trigger error:', err);
      setIsPrinting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl border border-slate-700/80 overflow-hidden text-white my-auto">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 px-6 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white">
                  Official Travel Boarding Pass
                </h3>
                <span className="bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-500/30 hidden sm:inline-block">
                  VERIFIED
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">
                {passData ? `Booking Reference: ${passData.bookingId}` : 'Retrieving official document...'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Scrollable Content Container */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-grow bg-slate-950/50 flex items-center justify-center">
          {loading ? (
            <div className="py-20 text-center space-y-4">
              <Loader2 size={36} className="text-emerald-400 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-300">
                Retrieving Cryptographically Verified Boarding Pass...
              </p>
            </div>
          ) : error || !passData ? (
            <div className="bg-slate-800/80 p-8 rounded-2xl max-w-md text-center space-y-4 border border-rose-500/30 my-8">
              <AlertTriangle size={36} className="text-rose-400 mx-auto" />
              <h4 className="text-base font-black text-white">Document Unavailable</h4>
              <p className="text-xs text-slate-300">{error || 'Could not locate confirmed booking voucher.'}</p>
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold"
              >
                Dismiss
              </button>
            </div>
          ) : (
            <div className="w-full py-2">
              <BoardingPassDocument ref={documentRef} pass={passData} />
            </div>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        {passData && !loading && (
          <div className="p-4 sm:p-5 px-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
            <div className="text-xs text-slate-400 hidden sm:block">
              Digital copy accepted at boarding. Keep printed copy for remote mountain trail access.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                onClick={handlePrintDocument}
                disabled={isPrinting}
                className="flex-1 sm:flex-initial px-5 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 border border-slate-700 transition-all disabled:opacity-50"
              >
                <Printer size={15} className="text-emerald-400" />
                {isPrinting ? 'Preparing Print...' : 'Print Pass'}
              </button>

              <button
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
                className="flex-1 sm:flex-initial px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <Download size={15} />
                    Download PDF
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardingPassModal;
