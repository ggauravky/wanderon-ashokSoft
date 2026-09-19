// ================================================================
// DYNAMIC AI ITINERARY & TRAVEL PLANNER GENERATION ENGINE
// Sourced from Central Travel Knowledge Base
// ================================================================

import { UPCOMING_TRIPS } from '../constants/mockData';
import * as travelKnowledgeService from '../services/travelKnowledgeService.js';
import * as apiService from '../services/api.js';

const generateAIItineraryApi = async (...args) => (apiService.generateAIItineraryApi || apiService.default?.generateAIItineraryApi)?.(...args);

const getDestinationBySlug = (s) => (travelKnowledgeService.getDestinationBySlug || travelKnowledgeService.default?.getDestinationBySlug)?.(s);
const getSeasonContext = (d) => (travelKnowledgeService.getSeasonContext || travelKnowledgeService.default?.getSeasonContext)?.(d);
const getDestinationWeather = (l) => (travelKnowledgeService.getDestinationWeather || travelKnowledgeService.default?.getDestinationWeather)?.(l);
const buildAITravelContext = (p) => (travelKnowledgeService.buildAITravelContext || travelKnowledgeService.default?.buildAITravelContext)?.(p);

/**
 * Generate a complete, intelligent, personalized travel itinerary
 * Calls secure Backend Gemini API first, falling back to central travel knowledge
 */
export const generateAIItinerary = async ({
  destination = '',
  days = 5,
  travelers = 2,
  pace = 'Balanced',
  mood = 'Adventure',
  budgetLevel = 'Moderate',
  customPreferences = ''
}) => {
  const destMeta = getDestinationBySlug(destination);
  const weather = getDestinationWeather(destination);
  const season = getSeasonContext();

  try {
    const serverResult = await generateAIItineraryApi({
      destination,
      days: Number(days),
      travelers: Number(travelers),
      pace,
      mood,
      budgetLevel,
      customPreferences
    });

    if (serverResult && serverResult.days && serverResult.days.length > 0) {
      return {
        ...serverResult,
        daysCount: serverResult.duration || Number(days),
        itineraryDays: serverResult.days,
        weather: serverResult.weather || weather
      };
    }
  } catch (apiErr) {
    console.warn('Backend AI generation offline/fallback:', apiErr.message);
  }

  // Fallback to local intelligence generated from central knowledge base
  await new Promise((resolve) => setTimeout(resolve, 350));

  const targetDays = Math.max(1, Math.min(Number(days) || 5, 30));
  const attractions = destMeta.attractions || [];
  const galleryPool = Array.isArray(destMeta.galleryImages) ? destMeta.galleryImages : [];
  let generatedDays = [];

  for (let i = 0; i < targetDays; i++) {
    const att1 = attractions[(i * 2) % (attractions.length || 1)] || { name: `${destMeta.name} Scenic Point`, location: destMeta.name };
    const att2 = attractions[(i * 2 + 1) % (attractions.length || 1)] || { name: `${destMeta.name} Cultural Exploration`, location: destMeta.name };

    const coverUrl = att1.image || galleryPool[i % (galleryPool.length || 1)] || destMeta.heroImage || '';
    const supporting1 = att2.image || galleryPool[(i + 1) % (galleryPool.length || 1)] || '';
    const supporting2 = galleryPool[(i + 2) % (galleryPool.length || 1)] || '';

    const coverMedia = coverUrl ? {
      url: coverUrl,
      altText: `${att1.name}, ${destMeta.name}`,
      caption: att1.name,
      width: 1600,
      height: 900
    } : null;

    const galleryMedia = [
      supporting1 && supporting1 !== coverUrl ? {
        url: supporting1,
        altText: `${att2.name}, ${destMeta.name}`,
        caption: att2.name,
        width: 1600,
        height: 900
      } : null,
      supporting2 && supporting2 !== coverUrl && supporting2 !== supporting1 ? {
        url: supporting2,
        altText: `${destMeta.name} Scenic View`,
        caption: `${destMeta.name} Landscape`,
        width: 1600,
        height: 900
      } : null
    ].filter(Boolean);

    generatedDays.push({
      day: i + 1,
      title: `Day ${i + 1}: ${att1.name} & ${att2.name}`,
      locationName: att1.location || destMeta.name,
      coverMedia,
      galleryMedia,
      gallery: [coverMedia, ...galleryMedia].filter(Boolean),
      mediaSelectionMode: 'AUTO',
      morning: [{ time: '09:00 AM', activity: `${att1.name} Exploration`, location: att1.location || destMeta.name, description: `Explore ${att1.name} during clear morning hours.`, estimatedCost: '₹300 - ₹500', travelTime: '1 hr' }],
      afternoon: [{ time: '01:30 PM', activity: `${att2.name} Guided Excursion`, location: att2.location || destMeta.name, description: `Scenic tour and local lunch around ${att2.location || destMeta.name}.`, estimatedCost: '₹400 - ₹600', travelTime: '1 hr' }],
      evening: [{ time: '06:00 PM', activity: 'Sunset Stroll & Local Cafe', location: destMeta.name, description: 'Relaxed evening cafe visit and cultural photography.', estimatedCost: '₹400 - ₹800', travelTime: 'Walking' }],
      stay: `${destMeta.name} Verified Boutique Stay / Resort`,
      dailyCost: destMeta.defaultDailyCost?.[budgetLevel.toLowerCase()] || '₹4,000 - ₹5,500',
      tips: destMeta.aiContext?.planningHints || ['Enjoy a relaxed travel pace and explore local markets.']
    });
  }

  const perDayCost = budgetLevel === 'Luxury' ? 8500 : budgetLevel === 'Budget' ? 2800 : 4500;
  const totalEstimatedCost = perDayCost * targetDays * Number(travelers);

  // Match real trip from mock catalog
  const matchedTrip = UPCOMING_TRIPS.find((t) => {
    const loc = (t.location || '').toLowerCase();
    return loc.includes(destMeta.slug) || loc.includes(destMeta.name.toLowerCase());
  }) || UPCOMING_TRIPS[0];

  return {
    id: 'ai-plan-' + Date.now(),
    createdAt: new Date().toISOString(),
    destination: destMeta.name,
    title: `${targetDays}-Day ${mood} Itinerary for ${destMeta.name}`,
    tagline: destMeta.summary,
    daysCount: targetDays,
    duration: targetDays,
    travelers: Number(travelers),
    pace: pace,
    mood: mood,
    travelStyle: mood,
    budgetLevel: budgetLevel,
    totalEstimatedCost: totalEstimatedCost,
    currency: 'INR',
    weather: weather,
    seasonContext: season.name,
    bestTimeToVisit: destMeta.bestMonths ? destMeta.bestMonths.join(', ') : 'October to May',
    days: generatedDays,
    itineraryDays: generatedDays,
    packingList: destMeta.packingTags || ['Waterproof rain jacket', 'Sturdy trail shoes', 'Power bank'],
    foodSuggestions: destMeta.food || ['Authentic Regional Cuisine', 'Local Artisan Bakeries'],
    matchedCatalogTrip: matchedTrip,
    disclaimer: 'Estimates and daily plans are generated by WanderLuxe Travel Intelligence. Actual travel permits, entrance fees, and meal prices may vary by season.'
  };
};

export default {
  generateAIItinerary
};
