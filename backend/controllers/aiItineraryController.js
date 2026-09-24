import { GoogleGenerativeAI } from '@google/generative-ai';
import crypto from 'crypto';
import mongoose from 'mongoose';
import Itinerary from '../models/Itinerary.js';
import Trip from '../models/Trip.js';
import { 
  getDestinationBySlug, 
  getSeasonContext, 
  getDestinationWeather, 
  buildAITravelContext,
  normalizeDestinationSlug
} from '../services/travelKnowledgeService.js';
import { resolveItineraryMedia, batchResolveItineraryMedia } from '../services/mediaResolverService.js';
import { auditAndSanitizeItinerary } from '../services/itineraryFeasibilityEngine.js';
import { generateCopilotProposal } from '../services/itineraryCopilotService.js';
import { signItineraryHandoffToken } from '../services/itineraryHandoffService.js';

const asText = (value, max = 160) => (typeof value === 'string' ? value.trim().replace(/<[^>]*>?/gm, '').slice(0, max) : '');
const asList = (value, maxItems = 12, maxLength = 80) => (
  Array.isArray(value)
    ? value.map((item) => asText(item, maxLength)).filter(Boolean).slice(0, maxItems)
    : []
);
const asDateOrNull = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};
const asNumberOrNull = (value, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(max, Math.max(min, numeric));
};

function sanitizePlannerContext(input = {}) {
  const raw = input.plannerContext && typeof input.plannerContext === 'object' ? input.plannerContext : input;
  const travelers = raw.travelersBreakdown || raw.travelers || {};
  return {
    origin: asText(raw.origin, 100),
    startDate: asDateOrNull(raw.startDate),
    endDate: asDateOrNull(raw.endDate),
    datesFlexible: raw.datesFlexible !== false,
    flexibleMonth: asText(raw.flexibleMonth, 80),
    travelersBreakdown: {
      adults: asNumberOrNull(travelers.adults, { min: 0, max: 30 }) || 0,
      children: asNumberOrNull(travelers.children, { min: 0, max: 30 }) || 0,
      infants: asNumberOrNull(travelers.infants, { min: 0, max: 30 }) || 0,
      seniors: asNumberOrNull(travelers.seniors, { min: 0, max: 30 }) || 0
    },
    tripType: asText(raw.tripType, 80),
    paceRhythm: asText(raw.paceRhythm, 100),
    acclimatization: asText(raw.acclimatization, 100),
    interests: asList(raw.interests),
    stayPreference: asText(raw.stayPreference, 100),
    roomStyle: asText(raw.roomStyle, 100),
    dietaryPreference: asText(raw.dietaryPreference, 100),
    hotelRating: asNumberOrNull(raw.hotelRating, { min: 0, max: 5 }),
    budgetTier: asText(raw.budgetTier, 80),
    budgetAmount: asNumberOrNull(raw.budgetAmount, { min: 0, max: 10000000 }),
    transportPreference: asText(raw.transportPreference || raw.transitPreference || raw.transitMode, 120),
    mobilityConstraints: asList(raw.mobilityConstraints),
    mustInclude: asList(raw.mustInclude),
    avoid: asList(raw.avoid),
    customPreferences: asText(raw.customPreferences, 1000)
  };
}

/**
 * Safely enrich an itinerary with 3-image nature gallery if cover or gallery is missing
 */
async function enrichItineraryMediaIfNeeded(doc) {
  if (!doc || !Array.isArray(doc.days) || doc.days.length === 0) return doc;
  const needsResolution = doc.days.some(d => !d.coverMedia?.url || !Array.isArray(d.galleryMedia) || d.galleryMedia.length === 0);
  if (needsResolution) {
    const enrichedDays = await batchResolveItineraryMedia(doc.days, doc.destination, doc.title);
    doc.days = enrichedDays;
    if (typeof doc.save === 'function') {
      try {
        await doc.save();
      } catch (err) {
        console.warn('Silently saving enriched itinerary media error:', err.message);
      }
    }
  }
  return doc;
}

/**
 * Normalizes raw output into safe, complete structured JSON using Central Knowledge
 */
function normalizeGeneratedItinerary(raw, reqData, destinationMeta) {
  const destination = destinationMeta.name || reqData.destination || 'Unknown Destination';
  const duration = Math.max(3, Math.min(Number(reqData.days) || 5, 10));
  const travelers = Number(reqData.travelers) || 2;
  const mood = reqData.mood || 'Adventure';
  const budgetLevel = reqData.budgetLevel || 'Moderate';
  const pace = reqData.pace || 'Balanced';

  let title = raw?.title || `${duration}-Day ${mood} Itinerary for ${destination}`;
  let tagline = raw?.tagline || raw?.summary || destinationMeta.summary;
  let bestTimeToVisit = raw?.bestTimeToVisit || (destinationMeta.bestMonths ? destinationMeta.bestMonths.join(', ') : 'October to May');

  let days = [];
  if (Array.isArray(raw?.days) && raw.days.length > 0) {
    days = raw.days.map((d, i) => ({
      day: i + 1,
      title: d.title || `Day ${i + 1}: Discover ${destination}`,
      morning: Array.isArray(d.morning)
        ? d.morning.map(a => typeof a === 'string' ? { time: '09:00 AM', activity: a, location: destination, description: a, estimatedCost: 'Estimated', travelTime: '1 hr' } : a)
        : (typeof d.morning === 'string' ? [{ time: '09:00 AM', activity: d.morning, location: destination, description: d.morning, estimatedCost: 'Estimated', travelTime: '1 hr' }] : []),
      afternoon: Array.isArray(d.afternoon)
        ? d.afternoon.map(a => typeof a === 'string' ? { time: '02:00 PM', activity: a, location: destination, description: a, estimatedCost: 'Estimated', travelTime: '1 hr' } : a)
        : (typeof d.afternoon === 'string' ? [{ time: '02:00 PM', activity: d.afternoon, location: destination, description: d.afternoon, estimatedCost: 'Estimated', travelTime: '1 hr' }] : []),
      evening: Array.isArray(d.evening)
        ? d.evening.map(a => typeof a === 'string' ? { time: '06:30 PM', activity: a, location: destination, description: a, estimatedCost: 'Estimated', travelTime: '1 hr' } : a)
        : (typeof d.evening === 'string' ? [{ time: '06:30 PM', activity: d.evening, location: destination, description: d.evening, estimatedCost: 'Estimated', travelTime: '1 hr' }] : []),
      stay: d.stay || `${destination} Verified Heritage Stay / Boutique Resort`,
      dailyCost: d.dailyCost || (destinationMeta.defaultDailyCost?.[budgetLevel.toLowerCase()] || '₹4,000 - ₹5,500'),
      tips: Array.isArray(d.tips) ? d.tips : (d.tips ? [d.tips] : ['Keep essentials handy.'])
    }));
  } else {
    // Generate structured days from canonical attractions calibrated to interests & pace
    const userInterests = Array.isArray(reqData.interests) ? reqData.interests : [];
    let attractions = [...(destinationMeta.attractions || [])];

    if (userInterests.length > 0 && attractions.length > 0) {
      const isCulture = userInterests.some(i => typeof i === 'string' && /culture|heritage|food|history/i.test(i));
      const isNature = userInterests.some(i => typeof i === 'string' && /nature|photography|wildlife|view/i.test(i));
      const isAdventure = userInterests.some(i => typeof i === 'string' && /adventure|trek/i.test(i));

      attractions.sort((a, b) => {
        const aText = `${a.name} ${a.location || ''}`.toLowerCase();
        const bText = `${b.name} ${b.location || ''}`.toLowerCase();
        let aScore = 0;
        let bScore = 0;

        if (isCulture) {
          if (/monastery|temple|palace|fort|heritage|museum|bazar|market|village|craft/i.test(aText)) aScore += 4;
          if (/monastery|temple|palace|fort|heritage|museum|bazar|market|village|craft/i.test(bText)) bScore += 4;
        }
        if (isNature) {
          if (/waterfall|falls|lake|river|valley|view|peak|point|sanctuary|canyon|root bridge/i.test(aText)) aScore += 4;
          if (/waterfall|falls|lake|river|valley|view|peak|point|sanctuary|canyon|root bridge/i.test(bText)) bScore += 4;
        }
        if (isAdventure) {
          if (/trek|hike|cave|rafting|bridge|pass/i.test(aText)) aScore += 4;
          if (/trek|hike|cave|rafting|bridge|pass/i.test(bText)) bScore += 4;
        }
        return bScore - aScore;
      });
    }

    for (let i = 0; i < duration; i++) {
      const att1 = attractions[(i * 2) % attractions.length] || { name: `${destination} Scenic Trail`, location: destination };
      const att2 = attractions[(i * 2 + 1) % attractions.length] || { name: `${destination} Cultural Center`, location: destination };
      const att3 = attractions[(i * 2 + 2) % attractions.length] || { name: `${destination} Nature Overlook`, location: destination };

      if (pace === 'Relaxed') {
        days.push({
          day: i + 1,
          title: `Day ${i + 1}: Leisurely Discovery of ${att1.name}`,
          morning: [{ time: '09:45 AM', activity: `${att1.name} Scenic Walk & Leisure Tour`, location: att1.location || destination, description: `Gentle morning sightseeing at ${att1.name} with ample time to absorb the views.`, estimatedCost: '₹300 - ₹500', travelTime: '45 mins' }],
          afternoon: [{ time: '02:00 PM', activity: `${destination} Panoramic Cafe Downtime`, location: att1.location || destination, description: `Relaxed cafe terrace lunch and peaceful scenic downtime.`, estimatedCost: '₹400 - ₹700', travelTime: '15 mins' }],
          evening: [{ time: '06:00 PM', activity: `Quiet Sunset Stroll & Regional Dinner`, location: destination, description: 'Leisurely evening stroll and authentic local cuisine.', estimatedCost: '₹400 - ₹800', travelTime: 'Walking' }],
          stay: `${destination} Boutique Hotel or Homestay`,
          dailyCost: destinationMeta.defaultDailyCost?.[budgetLevel.toLowerCase()] || '₹4,000 - ₹5,500',
          tips: ['Take it slow and soak in the serene atmosphere without rushing.']
        });
      } else if (pace === 'Action-Packed') {
        days.push({
          day: i + 1,
          title: `Day ${i + 1}: ${att1.name}, ${att2.name} & Adventure Circuit`,
          morning: [
            { time: '07:30 AM', activity: `${att1.name} Sunrise Discovery & Trail`, location: att1.location || destination, description: `Early morning active exploration of ${att1.name}.`, estimatedCost: '₹400 - ₹700', travelTime: '1 hr' }
          ],
          afternoon: [
            { time: '12:00 PM', activity: `${att2.name} Exploration`, location: att2.location || destination, description: `Guided discovery and photo expedition around ${att2.location || destination}.`, estimatedCost: '₹400 - ₹600', travelTime: '45 mins' },
            { time: '03:30 PM', activity: `${att3.name} Adventure & Activity Excursion`, location: att3.location || destination, description: `High energy exploration of ${att3.name}.`, estimatedCost: '₹500 - ₹800', travelTime: '30 mins' }
          ],
          evening: [
            { time: '07:00 PM', activity: `Night Market Walk & Cultural Street Dining`, location: destination, description: 'Vibrant local bazaar walk, craft shopping, and street food.', estimatedCost: '₹500 - ₹900', travelTime: 'Walking' }
          ],
          stay: `${destination} Adventure Lodge or Central Hotel`,
          dailyCost: destinationMeta.defaultDailyCost?.[budgetLevel.toLowerCase()] || '₹4,000 - ₹5,500',
          tips: ['Start early to maximize daylight across all scheduled stops.']
        });
      } else {
        // Balanced
        days.push({
          day: i + 1,
          title: `Day ${i + 1}: ${att1.name} & ${att2.name}`,
          morning: [{ time: '09:00 AM', activity: `${att1.name} Guided Tour`, location: att1.location || destination, description: `Explore ${att1.name} during morning hours.`, estimatedCost: '₹300 - ₹600', travelTime: '1.5 hrs' }],
          afternoon: [{ time: '01:30 PM', activity: `${att2.name} Excursion`, location: att2.location || destination, description: `Scenic sightseeing and regional lunch around ${att2.location || destination}.`, estimatedCost: '₹400 - ₹700', travelTime: '1 hr' }],
          evening: [{ time: '06:00 PM', activity: `Sunset Walk & Local Cafe`, location: destination, description: 'Relaxed evening cafe visit and cultural photography.', estimatedCost: '₹400 - ₹800', travelTime: 'Walking' }],
          stay: `${destination} Boutique Hotel or Homestay`,
          dailyCost: destinationMeta.defaultDailyCost?.[budgetLevel.toLowerCase()] || '₹4,000 - ₹5,500',
          tips: destinationMeta.aiContext?.planningHints || ['Enjoy a relaxed travel pace and explore local markets.']
        });
      }
    }
  }

  const perDayCost = budgetLevel === 'Luxury' ? 8500 : budgetLevel === 'Budget' ? 2800 : 4500;
  const totalEstimatedCost = raw?.totalEstimatedCost || (perDayCost * duration * travelers);

  const packingList = Array.isArray(raw?.packingSuggestions || raw?.packingList) && (raw.packingSuggestions || raw.packingList).length > 0
    ? (raw.packingSuggestions || raw.packingList)
    : (destinationMeta.packingTags || ['Waterproof rain jacket', 'Sturdy trail walking shoes', 'Power bank', 'Reusable hydration flask']);

  const staySuggestions = Array.isArray(raw?.staySuggestions) ? raw.staySuggestions : [
    `${destination} Boutique Resort & Spa`,
    `${destination} Riverside Alpine Cottages`,
    `Local Verified Homestay Community`
  ];

  const foodSuggestions = Array.isArray(raw?.foodSuggestions) && raw.foodSuggestions.length > 0
    ? raw.foodSuggestions
    : (destinationMeta.food || ['Authentic Regional Cuisine', 'Local Artisan Bakeries', 'Mountain Herbal Teas']);

  const localTips = Array.isArray(raw?.localTips) && raw.localTips.length > 0
    ? raw.localTips
    : (destinationMeta.aiContext?.travelNotes || ['Always carry small cash currency as remote mountain areas may lack network.', 'Respect local community traditions.']);

  let stayCost = Math.round(totalEstimatedCost * 0.45);
  let transportCost = Math.round(totalEstimatedCost * 0.22);
  let foodCost = Math.round(totalEstimatedCost * 0.18);
  let activityCost = Math.round(totalEstimatedCost * 0.10);

  if (raw?.budgetBreakdown) {
    if (raw.budgetBreakdown.stay) stayCost = parseInt(String(raw.budgetBreakdown.stay).replace(/[^\d]/g, ''), 10) || stayCost;
    if (raw.budgetBreakdown.transport) transportCost = parseInt(String(raw.budgetBreakdown.transport).replace(/[^\d]/g, ''), 10) || transportCost;
    if (raw.budgetBreakdown.food) foodCost = parseInt(String(raw.budgetBreakdown.food).replace(/[^\d]/g, ''), 10) || foodCost;
    if (raw.budgetBreakdown.activities) activityCost = parseInt(String(raw.budgetBreakdown.activities).replace(/[^\d]/g, ''), 10) || activityCost;
  }
  const bufferCost = Math.max(0, totalEstimatedCost - (stayCost + transportCost + foodCost + activityCost));

  const budgetBreakdown = {
    stay: `₹${stayCost.toLocaleString()}`,
    transport: `₹${transportCost.toLocaleString()}`,
    food: `₹${foodCost.toLocaleString()}`,
    activities: `₹${activityCost.toLocaleString()}`,
    buffer: `₹${bufferCost.toLocaleString()}`,
    estimatedTotal: `₹${totalEstimatedCost.toLocaleString()}`
  };

  return {
    title,
    tagline,
    destination,
    duration,
    travelers,
    travelStyle: mood,
    pace,
    budgetLevel,
    totalEstimatedCost,
    currency: 'INR',
    bestTimeToVisit,
    days,
    staySuggestions,
    foodSuggestions,
    packingList,
    localTips,
    budgetBreakdown,
    disclaimer: 'Estimates and daily plans are generated by WanderLuxe Travel Intelligence. Actual travel permits, entrance fees, and meal prices may vary by season.'
  };
}

/**
 * @desc Generate an AI Travel Itinerary using Google Gemini or Central Travel Intelligence
 * @route POST /api/ai/generate
 * @access Public
 */
export const generateItineraryController = async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid request body.' });
    }

    let {
      destination = 'Meghalaya',
      days,
      duration = 5,
      travelers = 2,
      mood = 'Adventure',
      travelStyle = 'Adventure',
      budgetLevel = 'Moderate',
      budgetAmount = null,
      pace = 'Balanced',
      origin = '',
      customPreferences = '',
      interests = [],
      travelersBreakdown = null,
      mobilityConstraints = [],
      dietary = [],
      mustInclude = [],
      avoid = []
    } = req.body;
    const plannerContext = sanitizePlannerContext(req.body);

    // Strict Input Validation & Threat Defense
    if (!destination || typeof destination !== 'string' || destination.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Destination must be a valid location name (at least 2 characters).' });
    }
    if (destination.length > 100) {
      return res.status(400).json({ success: false, message: 'Destination name exceeds maximum length of 100 characters.' });
    }
    destination = destination.trim().replace(/<[^>]*>?/gm, '');

    const requestedDays = days !== undefined ? days : duration;
    const daysNum = Math.round(Number(requestedDays));
    if (isNaN(daysNum) || daysNum < 3 || daysNum > 10) {
      return res.status(400).json({ success: false, message: 'Trip duration must be between 3 and 10 days.' });
    }

    const travelersNum = Math.round(Number(travelers));
    if (isNaN(travelersNum) || travelersNum < 1 || travelersNum > 30) {
      return res.status(400).json({ success: false, message: 'Traveler count must be between 1 and 30.' });
    }

    const validPaces = ['Relaxed', 'Balanced', 'Action-Packed'];
    pace = validPaces.includes(pace) ? pace : 'Balanced';

    const validBudgets = ['Budget', 'Moderate', 'Luxury'];
    budgetLevel = validBudgets.includes(budgetLevel) ? budgetLevel : 'Moderate';

    if (typeof customPreferences !== 'string') {
      customPreferences = '';
    } else {
      if (customPreferences.length > 1000) {
        customPreferences = customPreferences.slice(0, 1000);
      }
      customPreferences = customPreferences.replace(/<[^>]*>?/gm, '');
    }

    if (typeof origin === 'string') {
      origin = origin.slice(0, 100).replace(/<[^>]*>?/gm, '');
    } else {
      origin = '';
    }

    const destinationMeta = getDestinationBySlug(destination);
    const season = getSeasonContext();
    const weather = getDestinationWeather(destination);

    // 1. Try finding matching real catalog trip from MongoDB
    let matchedCatalogTrip = null;
    try {
      const q = destinationMeta.slug.replace(/-/g, ' ');
      const trip = await Trip.findOne({
        $or: [
          { destination: { $regex: q, $options: 'i' } },
          { location: { $regex: q, $options: 'i' } },
          { title: { $regex: q, $options: 'i' } }
        ]
      });
      if (trip) {
        matchedCatalogTrip = {
          id: trip.id || trip._id,
          title: trip.title,
          price: trip.price,
          image: trip.image,
          duration: trip.duration
        };
      }
    } catch (dbErr) {
      // Ignored
    }

    // 2. Build compact, structured AI travel context (< 3KB)
    const structuredContext = buildAITravelContext({
      destination,
      duration: daysNum,
      travelers: travelersNum,
      style: mood,
      pace,
      budget: budgetLevel,
      interests: Array.isArray(interests) ? interests : [],
      customPreferences,
      matchedTrip: matchedCatalogTrip
    });
    structuredContext.plannerContext = {
      origin,
      travelersBreakdown: plannerContext.travelersBreakdown,
      budgetAmount,
      dietaryPreference: plannerContext.dietaryPreference,
      stayPreference: plannerContext.stayPreference,
      transportPreference: plannerContext.transportPreference,
      mobilityConstraints,
      mustInclude,
      avoid
    };

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY;

    let generatedRaw = null;
    let source = 'template-engine';

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
          model: 'gemini-1.5-flash',
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.4
          }
        });

        const prompt = `You are an elite travel architect at WanderLuxe.
Synthesize a realistic day-by-day travel plan using the following structured knowledge:

${JSON.stringify(structuredContext, null, 2)}

CRITICAL RULES:
1. Pacing must follow ${pace}. Group geographically close attractions together.
2. Tailor daily attractions, sights, and activities specifically to traveler interests: ${JSON.stringify(interests || [])}.
3. Structure every single day with morning, afternoon, and evening slots.
4. Every slot must have: { time, activity, location, description, estimatedCost, travelTime }.
5. Calculate estimated budget in INR.
6. Return ONLY valid, complete JSON strictly adhering to schema.

JSON SCHEMA:
{
  "title": "A captivating title for the trip",
  "tagline": "Short evocative 1-sentence summary",
  "bestTimeToVisit": "Months e.g. Oct to May",
  "totalEstimatedCost": 28000,
  "days": [
    {
      "day": 1,
      "title": "Day 1 Title",
      "morning": [
        { "time": "09:00 AM", "activity": "Activity Name", "location": "Exact Location", "description": "Crisp description", "estimatedCost": "₹500", "travelTime": "30 mins" }
      ],
      "afternoon": [
        { "time": "01:30 PM", "activity": "Activity Name", "location": "Exact Location", "description": "Crisp description", "estimatedCost": "₹400", "travelTime": "15 mins" }
      ],
      "evening": [
        { "time": "06:00 PM", "activity": "Activity Name", "location": "Exact Location", "description": "Crisp description", "estimatedCost": "₹600", "travelTime": "Walking" }
      ],
      "stay": "Recommended Hotel or Homestay Name",
      "dailyCost": "₹3,500 - ₹4,500",
      "tips": ["Practical local advice for this day"]
    }
  ],
  "staySuggestions": ["Hotel 1", "Resort 2", "Homestay 3"],
  "foodSuggestions": ["Dish 1", "Dish 2", "Beverage 3"],
  "packingSuggestions": ["Essential 1", "Essential 2", "Essential 3"],
  "localTips": ["Tip 1", "Tip 2", "Tip 3"],
  "budgetBreakdown": {
    "stay": "₹12,000",
    "food": "₹6,000",
    "transport": "₹5,000",
    "activities": "₹3,000",
    "estimatedTotal": "₹26,000"
  }
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        generatedRaw = JSON.parse(text);
        source = 'gemini-ai';
      } catch (geminiError) {
        console.warn('Gemini API synthesis fallback to template intelligence:', geminiError.message);
      }
    }

    // Normalize generated result with complete defaults
    const normalized = normalizeGeneratedItinerary(generatedRaw, {
      destination,
      days: daysNum,
      travelers: travelersNum,
      mood,
      budgetLevel,
      pace,
      interests
    }, destinationMeta);

    // Enrich days with real database-driven location media
    const usedAssetIds = [];
    if (Array.isArray(normalized.days)) {
      for (const day of normalized.days) {
        const locationCandidate = day.morning?.[0]?.location || day.locationName || destination;
        const activityNames = [
          ...(day.morning || []).map(a => a.activity || a.name || ''),
          ...(day.afternoon || []).map(a => a.activity || a.name || ''),
          ...(day.evening || []).map(a => a.activity || a.name || '')
        ].filter(Boolean);

        try {
          const mediaResult = await resolveItineraryMedia({
            locationName: locationCandidate,
            destination,
            dayTitle: day.title,
            dayActivities: activityNames,
            dayNumber: day.day,
            excludeAssetIds: usedAssetIds,
            tripType: mood
          });

          day.locationName = locationCandidate;
          day.coverMedia = mediaResult.coverMedia;
          day.coverMediaAssetId = mediaResult.mediaAssetId;
          day.galleryMedia = mediaResult.galleryMedia || [];
          day.galleryMediaAssetIds = mediaResult.galleryMediaAssetIds || [];
          day.gallery = mediaResult.gallery || (mediaResult.coverMedia ? [mediaResult.coverMedia] : []);
          day.mediaSelectionMode = 'AUTO';
          if (mediaResult.mediaAssetId) {
            usedAssetIds.push(String(mediaResult.mediaAssetId));
          }
          if (Array.isArray(mediaResult.galleryMediaAssetIds)) {
            mediaResult.galleryMediaAssetIds.forEach(id => usedAssetIds.push(String(id)));
          }
        } catch (mediaErr) {
          console.warn(`Media resolution error for day ${day.day}:`, mediaErr.message);
        }
      }
    }

    // Run deterministic feasibility and physical travel audit
    const { sanitizedItinerary, healthReport } = auditAndSanitizeItinerary(normalized, req.body);

    const responsePayload = {
      id: 'ai-plan-' + Date.now(),
      createdAt: new Date().toISOString(),
      source,
      weather,
      seasonContext: season.name,
      ...sanitizedItinerary,
      plannerContext,
      healthReport,
      matchedCatalogTrip
    };

    res.json({
      success: true,
      data: responsePayload
    });
  } catch (error) {
    console.error('AI Itinerary Generation Controller Error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate itinerary. Please try again.'
    });
  }
};



/**
 * @desc Process AI Copilot plan refinement requests and return structured diffs
 * @route POST /api/ai/edit-plan
 * @access Public / Authenticated
 */
export const editPlanController = async (req, res) => {
  try {
    const { itinerary, refinement } = req.body;
    if (!itinerary) {
      return res.status(400).json({ success: false, message: 'Itinerary payload is required.' });
    }
    let proposal = generateCopilotProposal(itinerary, refinement);
    if (proposal && proposal.days) {
      const { sanitizedItinerary, healthReport } = auditAndSanitizeItinerary(proposal, req.body);
      proposal = { ...proposal, ...sanitizedItinerary, healthReport };
    }
    return res.json({ success: true, data: proposal });
  } catch (error) {
    console.error('Edit Plan Controller Error:', error);
    res.status(500).json({ success: false, message: 'Failed to process copilot refinement.' });
  }
};

/**
 * @desc Save OR Update generated AI itinerary to MongoDB (Prevents Duplicates)
 * @route POST /api/ai/save
 * @access Private (or Session-backed)
 */
export const saveItineraryController = async (req, res) => {
  try {
    const itineraryData = req.body;
    if (!itineraryData || !itineraryData.title || !itineraryData.destination) {
      return res.status(400).json({ success: false, message: 'Invalid itinerary data provided.' });
    }

    const userId = req.user?._id && req.user._id !== 'usr_admin' && req.user._id !== 'usr_influencer'
      ? req.user._id
      : null;
    const userEmail = req.user?.email || '';

    const targetId = itineraryData._id || (mongoose.Types.ObjectId.isValid(itineraryData.id) ? itineraryData.id : null);

    let finalDays = itineraryData.days || itineraryData.itineraryDays || [];
    const plannerContext = sanitizePlannerContext(itineraryData);
    const needsResolution = finalDays.some(d => !d.coverMedia?.url || !Array.isArray(d.galleryMedia) || d.galleryMedia.length === 0);
    if (needsResolution) {
      finalDays = await batchResolveItineraryMedia(finalDays, itineraryData.destination, itineraryData.title);
    }

    // 1. If document already has an _id, update existing document instead of creating a duplicate
    if (targetId) {
      let existingDoc = await Itinerary.findById(targetId);
      if (existingDoc) {
        if (!req.user) return res.status(403).json({ success: false, message: 'Sign in to update a saved itinerary.' });
        // Ownership check
        if ((existingDoc.user && existingDoc.user.toString() !== userId?.toString()) || (!existingDoc.user && (!existingDoc.userEmail || existingDoc.userEmail !== userEmail))) {
          return res.status(403).json({ success: false, message: 'Not authorized to update this itinerary.' });
        }

        existingDoc.title = itineraryData.title;
        existingDoc.tagline = itineraryData.tagline || existingDoc.tagline;
        existingDoc.destination = itineraryData.destination;
        existingDoc.destinationSlug = normalizeDestinationSlug(itineraryData.destination);
        existingDoc.duration = itineraryData.duration || itineraryData.daysCount || existingDoc.duration;
        existingDoc.travelers = itineraryData.travelers || existingDoc.travelers;
        existingDoc.travelStyle = itineraryData.travelStyle || itineraryData.mood || existingDoc.travelStyle;
        existingDoc.pace = itineraryData.pace || existingDoc.pace;
        existingDoc.budgetLevel = itineraryData.budgetLevel || existingDoc.budgetLevel;
        existingDoc.totalEstimatedCost = itineraryData.totalEstimatedCost || existingDoc.totalEstimatedCost;
        existingDoc.weather = itineraryData.weather || existingDoc.weather;
        existingDoc.bestTimeToVisit = itineraryData.bestTimeToVisit || existingDoc.bestTimeToVisit;
        existingDoc.days = finalDays;
        existingDoc.staySuggestions = itineraryData.staySuggestions || existingDoc.staySuggestions;
        existingDoc.foodSuggestions = itineraryData.foodSuggestions || existingDoc.foodSuggestions;
        existingDoc.packingList = itineraryData.packingList || itineraryData.packingSuggestions || existingDoc.packingList;
        existingDoc.localTips = itineraryData.localTips || existingDoc.localTips;
        existingDoc.budgetBreakdown = itineraryData.budgetBreakdown || existingDoc.budgetBreakdown;
        existingDoc.plannerContext = plannerContext || existingDoc.plannerContext || {};
        if (itineraryData.matchedCatalogTrip || itineraryData.matchedTrip) {
          existingDoc.matchedTrip = itineraryData.matchedCatalogTrip || itineraryData.matchedTrip;
        }
        existingDoc.source = 'customized';

        await existingDoc.save();

        return res.json({
          success: true,
          message: 'Itinerary updated successfully.',
          data: existingDoc
        });
      }
    }

    // 2. Create new Itinerary document with stable MongoDB _id
    const newDoc = new Itinerary({
      user: userId,
      userEmail,
      title: itineraryData.title,
      tagline: itineraryData.tagline || '',
      destination: itineraryData.destination,
      destinationSlug: normalizeDestinationSlug(itineraryData.destination),
      duration: itineraryData.duration || itineraryData.daysCount || 5,
      travelers: itineraryData.travelers || 2,
      travelStyle: itineraryData.travelStyle || itineraryData.mood || 'Adventure',
      pace: itineraryData.pace || 'Balanced',
      budgetLevel: itineraryData.budgetLevel || 'Moderate',
      totalEstimatedCost: itineraryData.totalEstimatedCost || 0,
      weather: itineraryData.weather || {},
      bestTimeToVisit: itineraryData.bestTimeToVisit || '',
      days: finalDays,
      staySuggestions: itineraryData.staySuggestions || [],
      foodSuggestions: itineraryData.foodSuggestions || [],
      packingList: itineraryData.packingList || itineraryData.packingSuggestions || [],
      localTips: itineraryData.localTips || [],
      budgetBreakdown: itineraryData.budgetBreakdown || {},
      plannerContext,
      matchedTrip: itineraryData.matchedCatalogTrip || itineraryData.matchedTrip || null,
      source: itineraryData.source || 'gemini-ai',
      isPublic: false
    });

    await newDoc.save();

    res.status(201).json({
      success: true,
      message: 'AI Itinerary saved successfully to your travel profile.',
      data: { ...newDoc.toObject(), handoffToken: userId ? undefined : signItineraryHandoffToken(newDoc._id) }
    });
  } catch (error) {
    console.error('Save Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Could not save itinerary to database: ' + error.message });
  }
};

/**
 * @desc Update a saved itinerary by ID
 * @route PUT /api/ai/itinerary/:id
 * @access Private
 */
export const updateItineraryController = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const doc = await Itinerary.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    // Ownership check
    const userEmail = req.user?.email || '';
    const userId = req.user?._id?.toString();
    if (doc.user?.toString() !== userId && !(userEmail && doc.userEmail === userEmail) && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this itinerary.' });
    }

    if (updateData.title) doc.title = updateData.title;
    if (updateData.tagline) doc.tagline = updateData.tagline;
    if (updateData.days) {
      let finalDays = updateData.days;
      const needsResolution = finalDays.some(d => !d.coverMedia?.url || !Array.isArray(d.galleryMedia) || d.galleryMedia.length === 0);
      if (needsResolution) {
        finalDays = await batchResolveItineraryMedia(finalDays, doc.destination, doc.title);
      }
      doc.days = finalDays;
    }
    if (updateData.travelers) doc.travelers = updateData.travelers;
    if (updateData.travelStyle) doc.travelStyle = updateData.travelStyle;
    if (updateData.pace) doc.pace = updateData.pace;
    if (updateData.budgetLevel) doc.budgetLevel = updateData.budgetLevel;
    if (updateData.totalEstimatedCost) doc.totalEstimatedCost = updateData.totalEstimatedCost;
    if (updateData.staySuggestions) doc.staySuggestions = updateData.staySuggestions;
    if (updateData.foodSuggestions) doc.foodSuggestions = updateData.foodSuggestions;
    if (updateData.packingList) doc.packingList = updateData.packingList;
    if (updateData.localTips) doc.localTips = updateData.localTips;
    if (updateData.budgetBreakdown) doc.budgetBreakdown = updateData.budgetBreakdown;
    if (updateData.plannerContext) doc.plannerContext = sanitizePlannerContext(updateData);
    doc.source = 'customized';

    await doc.save();

    res.json({
      success: true,
      message: 'Itinerary updated successfully.',
      data: doc
    });
  } catch (error) {
    console.error('Update Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update itinerary.' });
  }
};

/**
 * @desc Get single itinerary by ID
 * @route GET /api/ai/itinerary/:id
 * @access Private (or Public if shared)
 */
export const getItineraryByIdController = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Itinerary.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    // Ownership check
    if (!doc.isPublic) {
      if (!req.user) {
        return res.status(401).json({ success: false, message: 'Authentication required to view private itinerary.' });
      }
      const userEmail = req.user?.email || '';
      const userId = req.user?._id?.toString();
      if (doc.user?.toString() !== userId && !(userEmail && doc.userEmail === userEmail) && req.user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Not authorized to view this private itinerary.' });
      }
    }

    await enrichItineraryMediaIfNeeded(doc);

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error('Get Itinerary By ID Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve itinerary.' });
  }
};

/**
 * @desc Get all saved itineraries for the logged-in user
 * @route GET /api/ai/my-itineraries
 * @access Private
 */
export const getMyItinerariesController = async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Sign in to view saved itineraries.' });
    const userEmail = req.user?.email || '';
    const userId = req.user?._id;

    let filter = null;
    if (['admin', 'super_admin'].includes(req.user?.role)) {
      filter = {}; // Admin has master visibility into all saved AI itineraries
    } else if (userId && userId !== 'usr_admin' && userId !== 'usr_influencer') {
      filter = { $or: [{ user: userId }, { userEmail }] };
    } else if (userEmail) {
      filter = { userEmail };
    }
    if (!filter) return res.status(403).json({ success: false, message: 'Saved itineraries are unavailable for this account.' });

    const docs = await Itinerary.find(filter).sort({ createdAt: -1 });

    // Auto-enrich any legacy itineraries with complete 3-image galleries
    for (const doc of docs) {
      await enrichItineraryMediaIfNeeded(doc);
    }

    res.json({
      success: true,
      count: docs.length,
      data: docs
    });
  } catch (error) {
    console.error('Get My Itineraries Error:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve saved itineraries.' });
  }
};

/**
 * @desc Delete a saved itinerary
 * @route DELETE /api/ai/itinerary/:id
 * @access Private
 */
export const deleteItineraryController = async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await Itinerary.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    // Ownership check
    const userEmail = req.user?.email || '';
    const userId = req.user?._id?.toString();
    if (doc.user?.toString() !== userId && !(userEmail && doc.userEmail === userEmail) && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this itinerary.' });
    }

    await Itinerary.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Itinerary deleted successfully.'
    });
  } catch (error) {
    console.error('Delete Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete itinerary.' });
  }
};

/**
 * @desc Enable/Disable public sharing for an itinerary & create unique cryptographic share token
 * @route POST /api/ai/itinerary/:id/share
 * @access Private
 */
export const toggleShareItineraryController = async (req, res) => {
  try {
    const { id } = req.params;
    const { enable = true } = req.body;

    const doc = await Itinerary.findById(id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Itinerary not found.' });
    }

    // Ownership check
    const userEmail = req.user?.email || '';
    const userId = req.user?._id?.toString();
    if (doc.user?.toString() !== userId && !(userEmail && doc.userEmail === userEmail) && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to modify share settings for this itinerary.' });
    }

    if (enable) {
      if (!doc.shareToken) {
        doc.shareToken = crypto.randomBytes(12).toString('hex');
      }
      doc.isPublic = true;
    } else {
      doc.isPublic = false;
    }

    await doc.save();

    res.json({
      success: true,
      message: enable ? 'Itinerary sharing enabled.' : 'Itinerary sharing disabled.',
      shareToken: doc.shareToken,
      isPublic: doc.isPublic
    });
  } catch (error) {
    console.error('Toggle Share Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update share settings.' });
  }
};

/**
 * @desc Public Read-Only endpoint for a shared itinerary (Zero sensitive data exposed)
 * @route GET /api/ai/shared/:shareToken
 * @access Public
 */
export const getPublicSharedItineraryController = async (req, res) => {
  try {
    const { shareToken } = req.params;
    if (!shareToken) {
      return res.status(400).json({ success: false, message: 'Share token is required.' });
    }

    const doc = await Itinerary.findOne({ shareToken, isPublic: true })
      .select('-user -userEmail -__v');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'This shared travel itinerary does not exist, or sharing has been disabled by the creator.'
      });
    }

    await enrichItineraryMediaIfNeeded(doc);

    res.json({
      success: true,
      data: doc
    });
  } catch (error) {
    console.error('Get Public Shared Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Failed to load shared itinerary.' });
  }
};

/**
 * @desc Regenerate a single specific day in an itinerary
 * @route POST /api/ai/regenerate-day
 * @access Public
 */
export const regenerateDayController = async (req, res) => {
  try {
    const { destination, dayNumber = 1, mood = 'Adventure', pace = 'Balanced', adjustmentType = 'refresh' } = req.body;
    const destMeta = getDestinationBySlug(destination);
    const attractions = destMeta.attractions || [];

    const offset = (Number(dayNumber) * 2 + (adjustmentType === 'cheaper' ? 1 : 0)) % attractions.length;
    const att1 = attractions[offset] || { name: `${destMeta.name} Scenic Point`, location: destMeta.name };
    const att2 = attractions[(offset + 1) % attractions.length] || { name: `${destMeta.name} Cultural Exploration`, location: destMeta.name };

    const locationCandidate = att1.location || att1.name || destMeta.name;
    let coverMedia = null;
    let coverMediaAssetId = null;
    let galleryMedia = [];
    let galleryMediaAssetIds = [];
    let gallery = [];

    try {
      const mediaResult = await resolveItineraryMedia({
        locationName: locationCandidate,
        destination: destMeta.name,
        dayTitle: `Day ${dayNumber}: ${att1.name} & ${att2.name}`,
        dayActivities: [att1.name, att2.name],
        dayNumber: Number(dayNumber),
        tripType: mood
      });
      coverMedia = mediaResult.coverMedia;
      coverMediaAssetId = mediaResult.mediaAssetId;
      galleryMedia = mediaResult.galleryMedia || [];
      galleryMediaAssetIds = mediaResult.galleryMediaAssetIds || [];
      gallery = mediaResult.gallery || (coverMedia ? [coverMedia] : []);
    } catch (mediaErr) {
      console.warn('Regenerate day media resolution error:', mediaErr.message);
    }

    const regeneratedDay = {
      day: Number(dayNumber),
      title: `Day ${dayNumber}: ${att1.name} & ${att2.name}`,
      locationName: locationCandidate,
      coverMedia: coverMedia || {
        url: '',
        altText: `${locationCandidate}, ${destMeta.name}`,
        caption: `Day ${dayNumber} Experience`,
        width: 1200,
        height: 800,
        resolutionSource: 'fallback'
      },
      coverMediaAssetId,
      galleryMedia,
      galleryMediaAssetIds,
      gallery: gallery.length > 0 ? gallery : (coverMedia ? [coverMedia] : []),
      mediaSelectionMode: 'AUTO',
      morning: [{ time: '09:00 AM', activity: `${att1.name} Excursion`, location: att1.location || destMeta.name, description: `Enjoy morning discovery at ${att1.name}.`, estimatedCost: '₹300 - ₹500', travelTime: '1 hr' }],
      afternoon: [{ time: '01:30 PM', activity: `${att2.name} Exploration`, location: att2.location || destMeta.name, description: `Explore ${att2.name} followed by regional lunch.`, estimatedCost: '₹400 - ₹600', travelTime: '1 hr' }],
      evening: [{ time: '06:00 PM', activity: 'Sunset View & Local Cafe', location: destMeta.name, description: 'Evening leisure, photography, and local dining.', estimatedCost: '₹400 - ₹700', travelTime: 'Walking' }],
      stay: `${destMeta.name} Boutique Stay / Resort`,
      dailyCost: '₹3,500 - ₹4,800',
      tips: destMeta.aiContext?.planningHints || ['Enjoy a relaxed pace.']
    };

    res.json({
      success: true,
      data: regeneratedDay
    });
  } catch (error) {
    console.error('Regenerate Day Error:', error);
    res.status(500).json({ success: false, message: 'Failed to regenerate day.' });
  }
};
