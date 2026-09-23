import React, { useEffect, useRef, useState } from 'react';
import { Download, Printer, Loader2 } from 'lucide-react';
import { getBookingReceiptApi } from '../../services/api.js';
import { downloadBookingPdf, printBookingDocument } from '../../utils/bookingPdf.js';
import DocumentDialog from './DocumentDialog.jsx';
import PaymentReceiptDocument from './PaymentReceiptDocument.jsx';

export default function PaymentReceiptModal({ bookingId, paymentId, onClose }) {
  const [receipt, setReceipt] = useState(null);
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  const documentRef = useRef(null);

  useEffect(() => {
    let active = true;
    setReceipt(null);
    setError('');

    if (bookingId && paymentId) {
      getBookingReceiptApi(bookingId, paymentId)
        .then((data) => {
          if (active) setReceipt(data);
        })
        .catch((err) => {
          if (active) setError(err.message || 'Unable to load payment receipt.');
        });
    }

    return () => {
      active = false;
    };
  }, [bookingId, paymentId]);

  const handleDownload = async () => {
    if (!documentRef.current || !receipt || working) return;
    setWorking(true);
    setError('');
    try {
      const typeStr = receipt.payment?.type ? `${receipt.payment.type.charAt(0)}${receipt.payment.type.slice(1).toLowerCase()}` : 'Payment';
      const filename = `WanderLuxe_Payment_Receipt_${receipt.bookingId || 'WLX'}_${typeStr}.pdf`;
      await downloadBookingPdf(documentRef.current, filename);
    } catch (err) {
      console.error('Receipt PDF Generation Error:', err);
      setError('Unable to generate this receipt PDF. Please try again.');
    } finally {
      setWorking(false);
    }
  };

  const handlePrint = () => {
    if (!documentRef.current) return;
    try {
      printBookingDocument(documentRef.current);
    } catch (err) {
      console.error('Print Error:', err);
      setError('Unable to print this receipt.');
    }
  };

  return (
    <DocumentDialog
      title="Payment Receipt"
      onClose={onClose}
      footer={
        receipt && (
          <>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Printer size={15} /> Print
            </button>
            <button
              disabled={working}
              onClick={handleDownload}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-emerald-600/20"
            >
              {working ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              <span>{working ? 'Preparing Receipt...' : 'Download PDF'}</span>
            </button>
          </>
        )
      }
    >
      {error && (
        <p role="alert" className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-bold mb-4">
          {error}
        </p>
      )}

      {!receipt && !error && (
        <div className="py-20 text-center space-y-3">
          <Loader2 size={32} className="text-emerald-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500">Loading verified payment receipt...</p>
        </div>
      )}

      {receipt && <PaymentReceiptDocument receipt={receipt} documentRef={documentRef} />}
    </DocumentDialog>
  );
}
