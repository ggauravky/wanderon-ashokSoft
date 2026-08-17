// ================================================================
// TRAVELER LOCAL HISTORY & WISHLIST PERSISTENCE ENGINE
// ================================================================

const STORAGE_KEYS = {
  RECENTLY_VIEWED: 'wanderluxe_recently_viewed',
  WISHLIST: 'wanderluxe_wishlist',
  SAVED_AI_PLANS: 'wanderluxe_saved_ai_itineraries'
};

/**
 * Record a trip view
 */
export const recordTripView = (trip) => {
  if (!trip || !trip.id) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED) || '[]');
    const filtered = existing.filter((item) => item.id !== trip.id);
    const updated = [
      {
        id: trip.id,
        title: trip.title,
        location: trip.location,
        image: trip.image,
        duration: trip.duration,
        price: trip.price,
        rating: trip.rating,
        reviews: trip.reviews,
        viewedAt: new Date().toISOString()
      },
      ...filtered
    ].slice(0, 8); // Keep up to 8 recent trips

    localStorage.setItem(STORAGE_KEYS.RECENTLY_VIEWED, JSON.stringify(updated));
  } catch (e) {
    console.warn('Could not record trip view:', e.message);
  }
};

/**
 * Get recently viewed trips
 */
export const getRecentlyViewedTrips = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.RECENTLY_VIEWED) || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * Toggle Trip in Wishlist
 */
export const toggleWishlistItem = (tripId) => {
  try {
    const list = JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
    let updated;
    if (list.includes(tripId)) {
      updated = list.filter((id) => id !== tripId);
    } else {
      updated = [tripId, ...list];
    }
    localStorage.setItem(STORAGE_KEYS.WISHLIST, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

/**
 * Get Wishlist IDs
 */
export const getWishlistIds = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.WISHLIST) || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * Save Generated AI Itinerary
 */
export const saveAIItinerary = (itinerary) => {
  if (!itinerary || !itinerary.id) return;
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_AI_PLANS) || '[]');
    const filtered = existing.filter((item) => item.id !== itinerary.id);
    const updated = [itinerary, ...filtered];
    localStorage.setItem(STORAGE_KEYS.SAVED_AI_PLANS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.warn('Could not save AI itinerary:', e.message);
    return [];
  }
};

/**
 * Get Saved AI Itineraries
 */
export const getSavedAIItineraries = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_AI_PLANS) || '[]');
  } catch (e) {
    return [];
  }
};

/**
 * Delete Saved AI Itinerary
 */
export const deleteSavedAIItinerary = (itineraryId) => {
  try {
    const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.SAVED_AI_PLANS) || '[]');
    const updated = existing.filter((item) => item.id !== itineraryId);
    localStorage.setItem(STORAGE_KEYS.SAVED_AI_PLANS, JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};
