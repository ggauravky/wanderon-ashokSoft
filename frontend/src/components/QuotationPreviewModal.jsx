import React, { useRef, useState } from 'react';
import {
  Eye, Download, Printer, Share2, X, ExternalLink,
  ShieldCheck, FileText, Send, Sparkles, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import QuotationDocument from './QuotationDocument';
import ShareQuotationModal from './ShareQuotationModal';
import { exportElementToPdf, printElementDirectly } from '../utils/pdfGenerator';

export default function QuotationPreviewModal({
  isOpen = false,
  onClose = () => {},
  quotation = null,
  onSendQuotation = null
}) {
  const printDocRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);

  if (!isOpen || !quotation) return null;

  const handleExportPdf = async () => {
    if (!printDocRef.current) return;
    try {
      setIsExporting(true);
      await exportElementToPdf(
        printDocRef.current,
        {
          filename: `WanderLuxe-Proposal-${quotation.quotationNumber || 'Document'}.pdf`
        }
      );
    } catch (e) {
      alert('Error generating PDF proposal.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    if (!printDocRef.current) return;
    printElementDirectly(printDocRef.current);
  };

  const publicUrl = quotation.publicShare?.token
    ? `/quotation/${quotation.publicShare.token}`
    : '#';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          className="bg-slate-100 rounded-3xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden relative"
        >
          {/* Top Preview Action Bar */}
          <div className="bg-slate-900 text-white px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Eye size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Official Proposal Document Preview
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {quotation.quotationNumber || 'DRAFT'} (v{quotation.version || 1})
                  </span>
                </div>
                <h3 className="text-sm font-black text-white truncate max-w-md">
                  {quotation.tripRequirements?.title}
                </h3>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Share2 size={13} /> Share Link & WhatsApp
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={isExporting}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                <Download size={13} /> {isExporting ? 'Generating PDF...' : 'Download PDF'}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer size={13} /> Print
              </button>

              {onSendQuotation && quotation.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => onSendQuotation(quotation)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
                >
                  <Send size={13} /> Dispatch to Traveler
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Document Render Body */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 flex justify-center bg-slate-200/80">
            <QuotationDocument
              ref={printDocRef}
              quotation={quotation}
              isCustomerView={true}
            />
          </div>

          {/* Share Modal Trigger */}
          <ShareQuotationModal
            isOpen={showShareModal}
            onClose={() => setShowShareModal(false)}
            quotation={quotation}
            onExportPdf={handleExportPdf}
            onPrint={handlePrint}
          />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
