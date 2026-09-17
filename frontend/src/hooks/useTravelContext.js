import { useState, useEffect, useMemo } from 'react';
import { 
  getTimeOfDayContext, getDayOfWeekContext, getActiveOccasionContext, 
  calculateContextualRecommendations 
} from '../utils/travelContextEngine.js';
import { getCurrentSeason, getDestinationWeather } from '../utils/weatherSeasonEngine.js';
import { getRecentlyViewedTrips, getWishlistIds, getSavedAIItineraries } from '../utils/userHistory.js';
import { API_BASE_URL } from '../services/apiConfig.js';

export const useTravelContext = (customTrips) => {
  const [liveTrips, setLiveTrips] = useState([]);

  useEffect(() => {
    const fetchLiveCatalog = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/trips`);
        if (res.ok) {
          const json = await res.json();
          setLiveTrips(Array.isArray(json.data) ? json.data.map((trip) => ({ ...trip, availableBatches: Array.isArray(trip.batches) ? trip.batches : [] })) : []);
        }
      } catch (e) {
        setLiveTrips([]);
      }
    };
    fetchLiveCatalog();
  }, []);

  // Operational/bookable inventory is API-only. Editorial knowledge remains in its own service.
  const tripsPool = customTrips || liveTrips;

  // Active Context States
  const [now, setNow] = useState(new Date());
  const [userPreferences, setUserPreferences] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('wanderluxe_user_preferences') || '{}');
    } catch (e) {
      return {};
    }
  });

  // Keep date updated periodically
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const timeContext = useMemo(() => getTimeOfDayContext(now), [now]);
  const dayContext = useMemo(() => getDayOfWeekContext(now), [now]);
  const season = useMemo(() => getCurrentSeason(now), [now]);
  const occasion = useMemo(() => getActiveOccasionContext(now), [now]);

  const recentlyViewed = useMemo(() => getRecentlyViewedTrips(), []);
  const wishlistIds = useMemo(() => getWishlistIds(), []);
  const savedAIPlans = useMemo(() => getSavedAIItineraries(), []);

  // Contextual Recommendations computed deterministically
  const recommendedTrips = useMemo(() => {
    return calculateContextualRecommendations(tripsPool, userPreferences);
  }, [tripsPool, userPreferences]);

  // Weekend-specific getaways (2-3 days)
  const weekendGetaways = useMemo(() => {
    return tripsPool.filter((t) => String(t.duration || '').includes('2N/3D') || String(t.duration || '').includes('3N/4D'));
  }, [tripsPool]);

  // Season-specific picks
  const seasonalPicks = useMemo(() => {
    return recommendedTrips.filter((t) => t.explainableBadge === 'Best This Season');
  }, [recommendedTrips]);

  const updatePreferences = (newPrefs) => {
    const merged = { ...userPreferences, ...newPrefs };
    setUserPreferences(merged);
    try {
      localStorage.setItem('wanderluxe_user_preferences', JSON.stringify(merged));
    } catch (e) {
      console.warn('Could not save preferences:', e.message);
    }
  };

  const getWeatherFor = (location) => {
    return getDestinationWeather(location);
  };

  return {
    now,
    timeContext,
    dayContext,
    season,
    occasion,
    userPreferences,
    updatePreferences,
    recommendedTrips,
    weekendGetaways,
    seasonalPicks,
    recentlyViewed,
    wishlistIds,
    savedAIPlans,
    getWeatherFor,
    tripsPool,
    allTrips: tripsPool
  };
};

export default useTravelContext;
