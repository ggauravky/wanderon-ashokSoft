// ================================================================
// DYNAMIC WEATHER & SEASONAL PERSONALIZATION ENGINE
// Consumes Central Travel Knowledge Base
// ================================================================

import { 
  getSeasonContext as getCentralSeasonContext, 
  getDestinationWeather as getCentralDestinationWeather,
  getDestinations
} from '../services/travelKnowledgeService.js';

/**
 * Get current season metadata based on active date
 */
export const getCurrentSeason = (date = new Date()) => {
  return getCentralSeasonContext(date);
};

/**
 * Destination-specific real-time contextual weather data
 */
export const getDestinationWeather = (locationString = '') => {
  return getCentralDestinationWeather(locationString);
};

/**
 * Dynamic Trending Score Calculation based on authentic data points & season match
 */
export const calculateTrendingTrips = (trips = []) => {
  const currentSeason = getCurrentSeason();

  return [...trips].map((trip) => {
    let score = (Number(trip.rating) || 4.5) * 20; // 0-100 base from rating
    score += Math.min(Number(trip.reviews) || 0, 500) * 0.1; // reviews popularity weight

    // Season match bonus from central knowledge
    const tags = (trip.tags || []).map((t) => String(t).toLowerCase());
    const isSeasonMatch = (currentSeason.recommendedTypes || []).some((type) =>
      tags.includes(String(type).toLowerCase())
    );
    if (isSeasonMatch) {
      score += 25;
    }

    // Availability urgency bonus
    const hasFillingFast = Array.isArray(trip.availableBatches) && trip.availableBatches.some(
      (b) => b && (b.status === 'Filling Fast' || b.status === 'Almost Full' || (b.seatsLeft && b.seatsLeft <= 4))
    );
    if (hasFillingFast) {
      score += 15;
    }

    return {
      ...trip,
      trendingScore: Math.round(score),
      isSeasonalPick: isSeasonMatch,
      seasonalBadge: isSeasonMatch ? `${currentSeason.name.split(' ')[0]} Pick` : 'Trending',
      weather: getDestinationWeather(trip.location || trip.destination)
    };
  }).sort((a, b) => b.trendingScore - a.trendingScore);
};

export default {
  getCurrentSeason,
  getDestinationWeather,
  calculateTrendingTrips
};
