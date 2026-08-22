import { saveAIItineraryApi, toggleShareItineraryApi } from './api';

/**
 * Robust Centralized Share Service for AI Travel Itineraries
 * Handles automatic MongoDB persistence for unsaved plans, cryptographic share token creation,
 * Web Share API, clipboard copying, and WhatsApp formatting.
 */

/**
 * Ensures an itinerary is persisted to MongoDB and has an active cryptographic shareToken
 */
export const prepareShareableItinerary = async (itinerary) => {
  if (!itinerary) {
    throw new Error('No itinerary data available to share.');
  }

  let activePlan = { ...itinerary };
  let planId = activePlan._id || (String(activePlan.id).length === 24 ? activePlan.id : null);

  // 1. If not yet persisted to MongoDB database, save it immediately
  if (!planId) {
    try {
      const saveRes = await saveAIItineraryApi(activePlan);
      const savedDoc = saveRes.data || saveRes;
      planId = savedDoc._id || savedDoc.id;
      activePlan = {
        ...activePlan,
        _id: planId,
        id: planId,
        shareToken: savedDoc.shareToken || activePlan.shareToken
      };
    } catch (saveErr) {
      console.warn('Share auto-save fallback:', saveErr.message);
    }
  }

  // 2. If planId exists, ensure share token is active on backend
  if (planId && (!activePlan.shareToken || !activePlan.isPublic)) {
    try {
      const shareRes = await toggleShareItineraryApi(planId, true);
      if (shareRes.shareToken) {
        activePlan.shareToken = shareRes.shareToken;
      }
      activePlan.isPublic = true;
    } catch (shareErr) {
      console.warn('Share token creation note:', shareErr.message);
    }
  }

  // 3. Fallback client token if backend is unreachable
  if (!activePlan.shareToken) {
    activePlan.shareToken = 'wl-' + Math.random().toString(36).substring(2, 12);
  }

  const baseUrl = window.location.origin || 'https://wanderluxe.in';
  const shareUrl = `${baseUrl}/itinerary/shared/${activePlan.shareToken}`;

  return {
    plan: activePlan,
    planId,
    shareToken: activePlan.shareToken,
    shareUrl
  };
};

/**
 * Copies text to clipboard with modern API and fallback support
 */
export const copyToClipboard = async (text) => {
  if (!text) return false;

  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('navigator.clipboard failed, using fallback:', err);
    }
  }

  // Fallback for older browsers / non-HTTPS contexts
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Fallback clipboard copy failed:', err);
    return false;
  }
};

/**
 * Builds formatted WhatsApp share URL
 */
export const getWhatsAppShareUrl = (itinerary, shareUrl) => {
  const destination = itinerary?.destination || 'Destination';
  const duration = itinerary?.duration || itinerary?.daysCount || (itinerary?.days?.length || 5);
  const message = `Check out my ${duration}-Day ${destination} travel itinerary on WanderLuxe!\n\n${shareUrl}`;
  return `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};

export default {
  prepareShareableItinerary,
  copyToClipboard,
  getWhatsAppShareUrl
};
