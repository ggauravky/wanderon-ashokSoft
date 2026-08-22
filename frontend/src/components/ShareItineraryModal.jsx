import React, { useState } from 'react';
import { 
  X, Share2, Copy, Check, Lock, Globe, 
  Sparkles, Download, MessageCircle, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleShareItineraryApi } from '../services/api';

const ShareItineraryModal = ({ 
  isOpen, 
  onClose, 
  itinerary, 
  onDownloadPdf 
}) => {
  if (!isOpen || !itinerary) return null;

  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(itinerary.isPublic || false);
  const [shareToken, setShareToken] = useState(itinerary.shareToken || null);
  const [isUpdating, setIsUpdating] = useState(false);

  const baseUrl = window.location.origin;
  const shareableUrl = shareToken 
    ? `${baseUrl}/itinerary/shared/${shareToken}`
    : `${baseUrl}/destinations?search=${encodeURIComponent(itinerary.destination || 'India')}`;

  const handleTogglePublic = async () => {
    if (!itinerary.id || String(itinerary.id).startsWith('ai-plan-')) {
      // Local unsaved plan: generate a client share token
      const dummyToken = Math.random().toString(36).substring(2, 10);
      setShareToken(dummyToken);
      setIsPublic(true);
      return;
    }

    try {
      setIsUpdating(true);
      const res = await toggleShareItineraryApi(itinerary.id || itinerary._id, !isPublic);
      setIsPublic(res.isPublic);
      if (res.shareToken) {
        setShareToken(res.shareToken);
      }
    } catch (e) {
      console.warn('Could not update share token on server:', e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: itinerary.title || 'WanderLuxe Travel Plan',
          text: `Check out my ${itinerary.duration || itinerary.daysCount || 5}-day ${itinerary.destination} travel itinerary on WanderLuxe!`,
          url: shareableUrl
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `Check out my ${itinerary.duration || itinerary.daysCount || 5}-Day ${itinerary.destination} travel plan on WanderLuxe!\n\n${shareableUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative border border-slate-100 text-slate-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-900 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Share2 size={18} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Share Travel Itinerary
              </h3>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[260px]">
                {itinerary.title}
              </p>
            </div>
          </div>

          {/* Quick Sharing Channels */}
          <div className="grid grid-cols-2 gap-2.5 mb-5">
            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-emerald-200"
            >
              <MessageCircle size={16} className="text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Native Web Share */}
            <button
              onClick={handleNativeShare}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 size={15} />
              <span>Share Link</span>
            </button>
          </div>

          {/* Public Link Box */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-black text-slate-700 uppercase tracking-wider">
                Public Share URL
              </span>
              <span className="text-[10px] text-slate-400">
                {isPublic ? 'Public View' : 'Private (Only you)'}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 pl-3 rounded-xl border border-slate-200">
              <input
                type="text"
                readOnly
                value={shareableUrl}
                className="w-full text-xs text-slate-700 bg-transparent outline-none truncate font-mono"
              />
              <button
                onClick={handleCopyLink}
                className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Action Row: PDF Download Shortcut */}
          {onDownloadPdf && (
            <button
              onClick={() => {
                onClose();
                onDownloadPdf();
              }}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Download size={14} /> Download Official PDF Document
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareItineraryModal;
