import React, { useRef, useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import DocumentDialog from './DocumentDialog.jsx';
import BookingConfirmationDocument from './BookingConfirmationDocument.jsx';
import { downloadBookingPdf, printBookingDocument } from '../../utils/bookingPdf.js';

export default function BookingConfirmationModal({ booking, onClose }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const documentRef = useRef(null);

  if (!booking) return null;

  const isProvisional = booking.bookingStatus !== 'CONFIRMED' || booking.paymentStatus !== 'PAID';
  const modalTitle = isProvisional ? 'Provisional Booking Confirmation' : 'Booking Confirmation';
  const pdfFilename = `WanderLuxe_${isProvisional ? 'Provisional' : 'Booking'}_Confirmation_${booking.bookingId || 'WLX'}.pdf`;

  const handleDownload = async () => {
    if (!documentRef.current || busy) return;
    setBusy(true);
    setError('');
    try {
      await downloadBookingPdf(documentRef.current, pdfFilename);
    } catch (err) {
      console.error('PDF Generation Error:', err);
      setError('Unable to generate this booking document. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const handlePrint = () => {
    if (!documentRef.current) return;
    try {
      printBookingDocument(documentRef.current);
    } catch (err) {
      console.error('Print Error:', err);
      setError('Unable to print this document.');
    }
  };

  return (
    <DocumentDialog
      title={modalTitle}
      onClose={onClose}
      footer={
        <>
          <button
            onClick={handlePrint}
            className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Printer size={15} /> Print
          </button>
          <button
            onClick={handleDownload}
            disabled={busy}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
          >
            {busy ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            <span>{busy ? 'Generating PDF...' : 'Download PDF'}</span>
          </button>
        </>
      }
    >
      {error && (
        <p role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4">
          {error}
        </p>
      )}
      <BookingConfirmationDocument booking={booking} documentRef={documentRef} />
    </DocumentDialog>
  );
}
