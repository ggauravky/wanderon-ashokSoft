import React, { useState } from 'react';
import {
  Share2, Copy, Check, MessageSquare, Download, Printer,
  X, ExternalLink, ShieldCheck, Mail, Sparkles, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ShareQuotationModal({
  isOpen = false,
  onClose = () => {},
  quotation = null,
  onExportPdf = () => {},
  onPrint = () => {}
}) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !quotation) return null;

  const token = quotation.publicShare?.token;
  const publicUrl = token
    ? `${window.location.origin}/quotation/${token}`
    : `${window.location.origin}/quotation/preview`;

  const customerName = quotation.customerSnapshot?.name || 'Valued Traveler';
  const tripTitle = quotation.tripRequirements?.title || 'Custom Expedition';
  const destination = quotation.tripRequirements?.destination || 'Destination';
  const finalTotal = quotation.pricing?.finalTotal
    ? `₹${Number(quotation.pricing.finalTotal).toLocaleString()}`
    : 'Custom Rate';
  const duration = quotation.tripRequirements?.duration || '5D/4N';

  // Format pre-filled luxury WhatsApp message
  const whatsappMessage = encodeURIComponent(
`✨ *Bespoke Travel Proposal — WanderLuxe Expeditions* ✨

Dear ${customerName},

Greetings from WanderLuxe! We have prepared your tailored itinerary proposal for *${tripTitle}* (${destination} • ${duration}).

💰 *Package Total:* ${finalTotal} (Incl. 5% Tour GST & 10% Advance Deposit terms)
🏨 *Selected Accommodation & Dedicated Fleet included.*

📌 *View Your Interactive Proposal & Day-by-Day Route:*
${publicUrl}

Please review the inclusions and confirm your approval directly on the link so our concierge team can lock your dates.

Warm regards,
*WanderLuxe Travel Concierge*`
  );

  const whatsappUrl = `https://wa.me/?text=${whatsappMessage}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-6 text-slate-900"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
                <Share2 size={20} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Share Quotation Proposal</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {quotation.quotationNumber || 'Proposal'} • {customerName}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Secure Link Copy Box */}
          <div className="space-y-2">
            <label className="block text-xs font-black uppercase text-slate-700">
              Secure Public Proposal Link
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={publicUrl}
                className="w-full bg-transparent text-xs font-mono font-bold text-slate-800 outline-none px-2 select-all"
              />
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
              >
                {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Multi-Channel Sharing Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 bg-emerald-50 hover:bg-emerald-100/80 text-emerald-900 rounded-2xl border border-emerald-200 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <MessageSquare size={18} />
              </div>
              <div className="text-left">
                <div className="text-xs font-black">Share via WhatsApp</div>
                <div className="text-[10px] text-emerald-700">Preformatted message</div>
              </div>
            </a>

            <button
              type="button"
              onClick={() => {
                onExportPdf();
                onClose();
              }}
              className="p-3.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 flex items-center gap-3 transition-all cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                <Download size={18} />
              </div>
              <div className="text-left">
                <div className="text-xs font-black">Download PDF</div>
                <div className="text-[10px] text-slate-500">High-DPI A4 Document</div>
              </div>
            </button>
          </div>

          {/* Quick Direct Actions */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
            >
              <ExternalLink size={13} /> Open Live Page in New Tab
            </a>

            <button
              type="button"
              onClick={() => {
                onPrint();
                onClose();
              }}
              className="text-slate-600 hover:text-slate-900 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Printer size={13} /> Direct Print
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
