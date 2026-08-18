import { useState, useEffect, useMemo } from 'react';
import { 
  getTimeOfDayContext, getDayOfWeekContext, getActiveOccasionContext, 
  calculateContextualRecommendations 
} from '../utils/travelContextEngine.js';
import { getCurrentSeason, getDestinationWeather } from '../utils/weatherSeasonEngine.js';
import { getRecentlyViewedTrips, getWishlistIds, getSavedAIItineraries } from '../utils/userHistory.js';
import { UPCOMING_TRIPS } from '../constants/mockData.js';

export const useTravelContext = (customTrips) => {
  const tripsPool = customTrips || UPCOMING_TRIPS;

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
    return tripsPool.filter((t) => t.duration.includes('2N/3D') || t.duration.includes('3N/4D'));
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
    getWeatherFor
  };
};

export default useTravelContext;
