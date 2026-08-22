import React, { useState, useEffect } from 'react';
import { 
  X, Share2, Copy, Check, Lock, Globe, 
  Sparkles, Download, MessageCircle, ExternalLink, ShieldCheck,
  ToggleLeft, ToggleRight, Loader2, FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toggleShareItineraryApi, saveAIItineraryApi } from '../services/api';

const ShareItineraryModal = ({ 
  isOpen, 
  onClose, 
  itinerary, 
  onDownloadPdf,
  onItineraryUpdated 
}) => {
  if (!isOpen || !itinerary) return null;

  const [copied, setCopied] = useState(false);
  const [isPublic, setIsPublic] = useState(itinerary.isPublic || false);
  const [shareToken, setShareToken] = useState(itinerary.shareToken || null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const baseUrl = window.location.origin;

  // Initialize or enable share token on modal open
  useEffect(() => {
    const ensureShareEnabled = async () => {
      if (!isOpen) return;

      const planId = itinerary._id || (String(itinerary.id).length === 24 ? itinerary.id : null);

      if (planId) {
        if (!shareToken || !isPublic) {
          try {
            setIsUpdating(true);
            const res = await toggleShareItineraryApi(planId, true);
            setIsPublic(true);
            if (res.shareToken) {
              setShareToken(res.shareToken);
              if (onItineraryUpdated) {
                onItineraryUpdated({ ...itinerary, isPublic: true, shareToken: res.shareToken });
              }
            }
          } catch (err) {
            console.warn('Share auto-enable notice:', err.message);
          } finally {
            setIsUpdating(false);
          }
        }
      }
    };

    ensureShareEnabled();
  }, [isOpen, itinerary._id, itinerary.id]);

  const shareableUrl = shareToken 
    ? `${baseUrl}/itinerary/shared/${shareToken}`
    : `${baseUrl}/destinations?search=${encodeURIComponent(itinerary.destination || 'India')}`;

  const handleTogglePublic = async () => {
    const planId = itinerary._id || (String(itinerary.id).length === 24 ? itinerary.id : null);
    if (!planId) {
      setStatusMessage('Please save the itinerary to your profile first to create a public link.');
      return;
    }

    try {
      setIsUpdating(true);
      const newStatus = !isPublic;
      const res = await toggleShareItineraryApi(planId, newStatus);
      setIsPublic(res.isPublic);
      if (res.shareToken) {
        setShareToken(res.shareToken);
      }
      if (onItineraryUpdated) {
        onItineraryUpdated({ ...itinerary, isPublic: res.isPublic, shareToken: res.shareToken || shareToken });
      }
      setStatusMessage(newStatus ? 'Public sharing enabled.' : 'Sharing disabled. Link is now private.');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (e) {
      setStatusMessage('Could not update share settings. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareableUrl);
      setCopied(true);
      setStatusMessage('Secure link copied to clipboard!');
      setTimeout(() => {
        setCopied(false);
        setStatusMessage('');
      }, 2500);
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
      <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
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
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Share Travel Itinerary
              </h3>
              <p className="text-xs text-slate-400 font-medium truncate max-w-[250px]">
                {itinerary.title}
              </p>
            </div>
          </div>

          {/* Quick Sharing Channels */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {/* WhatsApp Share */}
            <button
              onClick={handleWhatsAppShare}
              className="p-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 border border-emerald-200 shadow-2xs"
            >
              <MessageCircle size={17} className="text-emerald-600" />
              <span>WhatsApp</span>
            </button>

            {/* Native Web Share */}
            <button
              onClick={handleNativeShare}
              className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <Share2 size={16} />
              <span>Share Link</span>
            </button>
          </div>

          {/* Public Link & Privacy Control */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 mb-4 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                {isPublic ? <Globe size={14} className="text-emerald-600" /> : <Lock size={14} className="text-slate-400" />}
                <span>{isPublic ? 'Public Read-Only Link' : 'Private (Link Disabled)'}</span>
              </div>
              <button
                onClick={handleTogglePublic}
                disabled={isUpdating}
                className="text-[11px] font-black text-emerald-600 hover:text-emerald-700 underline"
              >
                {isUpdating ? 'Updating...' : (isPublic ? 'Stop Sharing' : 'Enable Link')}
              </button>
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1 shrink-0 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {statusMessage && (
              <p className="text-[11px] text-emerald-700 font-medium text-center">
                {statusMessage}
              </p>
            )}
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
              <FileText size={14} /> Download Official PDF Document
            </button>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <ShieldCheck size={12} className="text-emerald-500" /> Safe & Privacy Protected
            </span>
            <span>WanderLuxe Intelligence</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ShareItineraryModal;
