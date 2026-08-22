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

/**
 * Normalizes raw output into safe, complete structured JSON using Central Knowledge
 */
function normalizeGeneratedItinerary(raw, reqData, destinationMeta) {
  const destination = destinationMeta.name || reqData.destination || 'Meghalaya';
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
    // Generate structured days from canonical attractions
    const attractions = destinationMeta.attractions || [];
    for (let i = 0; i < duration; i++) {
      const att1 = attractions[(i * 2) % attractions.length] || { name: `${destination} Scenic Trail`, location: destination };
      const att2 = attractions[(i * 2 + 1) % attractions.length] || { name: `${destination} Cultural Center`, location: destination };

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

  const budgetBreakdown = raw?.budgetBreakdown || {
    stay: `₹${Math.round(totalEstimatedCost * 0.45).toLocaleString()}`,
    food: `₹${Math.round(totalEstimatedCost * 0.25).toLocaleString()}`,
    transport: `₹${Math.round(totalEstimatedCost * 0.20).toLocaleString()}`,
    activities: `₹${Math.round(totalEstimatedCost * 0.10).toLocaleString()}`,
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
    const {
      destination = 'Meghalaya',
      days = 5,
      travelers = 2,
      mood = 'Adventure',
      budgetLevel = 'Moderate',
      pace = 'Balanced',
      customPreferences = ''
    } = req.body;

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
      duration: days,
      travelers,
      style: mood,
      pace,
      budget: budgetLevel,
      customPreferences,
      matchedTrip: matchedCatalogTrip
    });

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
2. Structure every single day with morning, afternoon, and evening slots.
3. Every slot must have: { time, activity, location, description, estimatedCost, travelTime }.
4. Calculate estimated budget in INR.
5. Return ONLY valid, complete JSON strictly adhering to schema.

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
      days,
      travelers,
      mood,
      budgetLevel,
      pace
    }, destinationMeta);

    const responsePayload = {
      id: 'ai-plan-' + Date.now(),
      createdAt: new Date().toISOString(),
      source,
      weather,
      seasonContext: season.name,
      ...normalized,
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

    // 1. If document already has an _id, update existing document instead of creating a duplicate
    if (targetId) {
      let existingDoc = await Itinerary.findById(targetId);
      if (existingDoc) {
        // Ownership check
        if (existingDoc.user && existingDoc.user.toString() !== userId?.toString() && existingDoc.userEmail !== userEmail && req.user?.role !== 'admin') {
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
        existingDoc.days = itineraryData.days || itineraryData.itineraryDays || existingDoc.days;
        existingDoc.staySuggestions = itineraryData.staySuggestions || existingDoc.staySuggestions;
        existingDoc.foodSuggestions = itineraryData.foodSuggestions || existingDoc.foodSuggestions;
        existingDoc.packingList = itineraryData.packingList || itineraryData.packingSuggestions || existingDoc.packingList;
        existingDoc.localTips = itineraryData.localTips || existingDoc.localTips;
        existingDoc.budgetBreakdown = itineraryData.budgetBreakdown || existingDoc.budgetBreakdown;
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
      days: itineraryData.days || itineraryData.itineraryDays || [],
      staySuggestions: itineraryData.staySuggestions || [],
      foodSuggestions: itineraryData.foodSuggestions || [],
      packingList: itineraryData.packingList || itineraryData.packingSuggestions || [],
      localTips: itineraryData.localTips || [],
      budgetBreakdown: itineraryData.budgetBreakdown || {},
      matchedTrip: itineraryData.matchedCatalogTrip || itineraryData.matchedTrip || null,
      source: itineraryData.source || 'gemini-ai',
      isPublic: false
    });

    await newDoc.save();

    res.status(201).json({
      success: true,
      message: 'AI Itinerary saved successfully to your travel profile.',
      data: newDoc
    });
  } catch (error) {
    console.error('Save Itinerary Error:', error);
    res.status(500).json({ success: false, message: 'Could not save itinerary to database.' });
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
    if (doc.user?.toString() !== userId && doc.userEmail !== userEmail && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this itinerary.' });
    }

    if (updateData.title) doc.title = updateData.title;
    if (updateData.tagline) doc.tagline = updateData.tagline;
    if (updateData.days) doc.days = updateData.days;
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

    // If public, allow read
    if (doc.isPublic) {
      return res.json({ success: true, data: doc });
    }

    // Ownership check
    const userEmail = req.user?.email || '';
    const userId = req.user?._id?.toString();
    if (doc.user?.toString() !== userId && doc.userEmail !== userEmail && req.user?.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view this private itinerary.' });
    }

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
    const userEmail = req.user?.email || '';
    const userId = req.user?._id;

    let filter = {};
    if (userId && userId !== 'usr_admin' && userId !== 'usr_influencer') {
      filter = { $or: [{ user: userId }, { userEmail }] };
    } else if (userEmail) {
      filter = { userEmail };
    }

    const docs = await Itinerary.find(filter).sort({ createdAt: -1 });

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
    if (doc.user?.toString() !== userId && doc.userEmail !== userEmail && req.user?.role !== 'admin') {
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
    if (doc.user?.toString() !== userId && doc.userEmail !== userEmail && req.user?.role !== 'admin') {
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

    const regeneratedDay = {
      day: Number(dayNumber),
      title: `Day ${dayNumber}: ${att1.name} & ${att2.name}`,
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
