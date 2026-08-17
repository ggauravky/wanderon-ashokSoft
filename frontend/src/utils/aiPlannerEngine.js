// ================================================================
// DYNAMIC AI ITINERARY & TRAVEL PLANNER GENERATION ENGINE
// ================================================================

import { UPCOMING_TRIPS } from '../constants/mockData';
import { getDestinationWeather, getCurrentSeason } from './weatherSeasonEngine';

/**
 * Pre-defined rich intelligence templates for top destinations
 */
const DESTINATION_ITINERARY_TEMPLATES = {
  meghalaya: {
    title: 'Meghalaya Abode of Clouds & Living Root Bridges',
    state: 'Meghalaya, India',
    bestTime: 'October to May',
    vibe: 'Misty rainforests, crystal emerald rivers, and bio-engineered root bridges.',
    catalogTripId: 1,
    baseDays: [
      {
        day: 1,
        title: 'Arrival in Guwahati & Scenic Transfer to Shillong',
        morning: 'Pickup from Guwahati LGBI Airport (10:30 AM). Scenic drive through pine-fringed hills.',
        afternoon: 'Stop at Umiam Lake (Barapani) for watersports and tea. Check into boutique hotel in Shillong.',
        evening: 'Walk through Police Bazaar, explore local cafes (Dylan’s Cafe) and sample Khasi delicacies.',
        stay: 'Pine Hill Heritage Stay, Shillong',
        dailyCost: '₹3,500 - ₹4,500',
        tips: 'Keep light woolens handy as Shillong evenings can get cool.'
      },
      {
        day: 2,
        title: 'Shillong to Cherrapunji (Sohra) via Roaring Waterfalls',
        morning: 'Drive towards Cherrapunji. Visit Elephant Falls and Mawkdok Dympep Valley Viewpoint.',
        afternoon: 'Explore Wei Sawdong three-tiered waterfall and the majestic Nohkalikai Falls.',
        evening: 'Visit Arwah Limestone Caves with prehistoric fossils. Check into Cherrapunji cliffside resort.',
        stay: 'Polo Orchid Resort or Cherrapunji Eco Cottages',
        dailyCost: '₹4,000 - ₹5,500',
        tips: 'Wear shoes with good grip as waterfall rocks can be slippery.'
      },
      {
        day: 3,
        title: 'The Great Nongriat Rainforest Trek & Double Decker Root Bridge',
        morning: 'Descent down 3,500 stone stairs from Tyrna village through dense subtropical rainforest.',
        afternoon: 'Cross suspension wire bridges to reach the ancient Double Decker Living Root Bridge. Swim in natural turquoise pools.',
        evening: 'Relax by Rainbow Falls lagoon. Hike back up or stay in Nongriat village homestay.',
        stay: 'Serene Homestay Nongriat or Cherrapunji Resort',
        dailyCost: '₹2,500 - ₹3,500',
        tips: 'Carry plenty of hydration, energy bars, and a waterproof phone pouch.'
      },
      {
        day: 4,
        title: 'Dawki Crystal Glass River & Mawlynnong Village',
        morning: 'Drive to Mawlynnong, recognized as Asia’s Cleanest Village. Walk on flower-paved paths.',
        afternoon: 'Head to Dawki at Indo-Bangladesh border. Take a wooden boat ride on transparent Umngot River.',
        evening: 'Riverside camping at Shnongpdeng. Stargazing by the riverbank with barbecue and bonfire.',
        stay: 'Shnongpdeng Riverside Swiss Tents',
        dailyCost: '₹3,000 - ₹4,200',
        tips: 'Autumn (Oct-Apr) gives the most glass-like river transparency.'
      },
      {
        day: 5,
        title: 'Jaintia Hills Krang Suri Waterfalls & Guwahati Departure',
        morning: 'Morning cliff jumping and kayaking in Shnongpdeng. Drive to Krang Suri blue lagoon falls.',
        afternoon: 'Swim in the natural pool behind the water curtain. Begin return drive to Guwahati.',
        evening: 'Drop off at Guwahati Airport by 04:00 PM for onward flight home.',
        stay: 'Departure Flight',
        dailyCost: '₹2,000 - ₹3,000',
        tips: 'Book return flights departing after 06:00 PM.'
      }
    ],
    packingList: [
      'Sturdy trail walking shoes with rubber grip',
      'Quick-dry clothing & extra swimwear',
      'Light rain jacket / poncho',
      'Waterproof phone case',
      'Personal water bottle & electrolyte packs'
    ]
  },
  spiti: {
    title: 'Spiti Valley Cold Desert Circuit Expedition',
    state: 'Himachal Pradesh, India',
    bestTime: 'June to October',
    vibe: 'High-altitude cold desert, 1000-year-old monasteries, and starry Chandratal night skies.',
    catalogTripId: 2,
    baseDays: [
      {
        day: 1,
        title: 'Shimla to Kalpa via Kinnaur Valley',
        morning: 'Early morning departure from Shimla. Scenic drive along the roaring Sutlej River.',
        afternoon: 'Pass through the majestic Kinnaur rock-cut highway. Reach Kalpa by late afternoon.',
        evening: 'Sunset view of Kinnaur Kailash peak. Acclimatization walk around Kalpa apple orchards.',
        stay: 'Kinnaur Kailash View Homestay, Kalpa (9,700 ft)',
        dailyCost: '₹3,500 - ₹4,500',
        tips: 'Hydrate well with 3-4 liters of water to support acclimatization.'
      },
      {
        day: 2,
        title: 'Kalpa to Kaza via Nako Lake & Tabo 1000-Yr Monastery',
        morning: 'Cross into Spiti Valley. Halt at sacred Nako Lake and see the mountain reflections.',
        afternoon: 'Visit the 1000-year-old UNESCO Tabo Monastery, known as the Ajanta of the Himalayas.',
        evening: 'Drive past Dhankar Cliff Monastery to reach Kaza. Check into hotel and relax.',
        stay: 'Spiti Valley Grand Hotel, Kaza (12,500 ft)',
        dailyCost: '₹4,000 - ₹5,000',
        tips: 'Avoid intense exertion on Day 2 to let your body adapt to high altitude.'
      },
      {
        day: 3,
        title: 'Kaza Local: Key Monastery, Hikkim, Komic & Langza',
        morning: 'Visit Key Monastery perched on a conical hill. Meet Buddhist monks over butter tea.',
        afternoon: 'Post a physical postcard from Hikkim (14,567 ft - World’s Highest Post Office). Visit Komic (World’s highest motorable village).',
        evening: 'Marvel at the giant Buddha statue in Langza overlooking snow peaks. Fossil hunting walk.',
        stay: 'Spiti Valley Grand Hotel, Kaza',
        dailyCost: '₹3,500 - ₹4,500',
        tips: 'Carry cash in small denominations as remote villages have no network/ATMs.'
      },
      {
        day: 4,
        title: 'Kaza to Chandratal Moon Lake via Kunzum Pass (15,060 ft)',
        morning: 'Drive over the thrilling Kunzum Pass. Do the traditional prayer-flag circumambulation.',
        afternoon: 'Hike to the crescent-shaped Chandratal Lake. Watch turquoise waters shift colors under sunlight.',
        evening: 'Camp under the Milky Way galaxy. Unbelievable astrophotography and bonfire.',
        stay: 'Swiss Luxury Camps near Chandratal (14,100 ft)',
        dailyCost: '₹4,500 - ₹6,000',
        tips: 'Temperatures drop below freezing at night. Layer up with thermal base layers.'
      },
      {
        day: 5,
        title: 'Chandratal to Manali via Atal Tunnel & Departure',
        morning: 'Scenic morning drive along Chandra River through Batal and Gramphu.',
        afternoon: 'Cross through the engineering marvel Atal Tunnel into lush Solang Valley.',
        evening: 'Reach Manali bus stand/hotel. Farewell dinner with expedition crew.',
        stay: 'Departure or Manali Resort',
        dailyCost: '₹2,500 - ₹3,500',
        tips: 'Volvo buses to Delhi depart Manali between 05:00 PM and 07:00 PM.'
      }
    ],
    packingList: [
      'Heavy down jacket (-5°C rated) and thermal innerwear',
      'UV 400 polarized sunglasses & high SPF sunblock',
      'Hydration flask & Diamox/Altitude medicine',
      'Gloves, woolen beanie, and neck gaiter',
      'Power bank (cold weather drains batteries faster)'
    ]
  },
  bali: {
    title: 'Bali Tropical Island & Cultural Odyssey',
    state: 'Bali, Indonesia',
    bestTime: 'April to November',
    vibe: 'Emerald rice terraces, cliffside ocean temples, sunset beach clubs, and turquoise reefs.',
    catalogTripId: 3,
    baseDays: [
      {
        day: 1,
        title: 'Arrival in Denpasar & Transfer to Seminyak',
        morning: 'Arrival at Ngurah Rai International Airport (DPS). Traditional flower garland welcome.',
        afternoon: 'Private transfer to luxury pool resort in Seminyak. Unpack and relax by the pool.',
        evening: 'Sunset drinks at Potato Head Beach Club or La Plancha colorful beanbags on double six beach.',
        stay: 'Seminyak Boutique Pool Resort',
        dailyCost: '₹6,000 - ₹8,500',
        tips: 'Get an Indonesian e-SIM card at the airport for fast 4G data.'
      },
      {
        day: 2,
        title: 'Ubud Cultural Heart: Tegalalang Rice Terraces & Jungle Swing',
        morning: 'Drive to Ubud. Walk through the emerald tiers of Tegalalang Rice Terraces.',
        afternoon: 'Fly over jungle valleys on the Bali Jungle Swing. Visit Tirta Empul holy water spring temple.',
        evening: 'Stroll through Ubud Art Market and dine at an authentic Balinese organic cafe.',
        stay: 'Ubud Rainforest Villa',
        dailyCost: '₹5,000 - ₹7,000',
        tips: 'Wear shoulder-covering attire when entering temple compounds (sarongs provided at entrance).'
      },
      {
        day: 3,
        title: 'Nusa Penida Island Fastboat Excursion',
        morning: 'Early morning speed boat transfer from Sanur harbour to Nusa Penida island.',
        afternoon: 'Visit iconic Kelingking Beach (T-Rex Cliff), Broken Beach, and Angel’s Billabong natural infinity pool.',
        evening: 'Snorkeling at Crystal Bay with manta rays. Fastboat return to mainland Bali.',
        stay: 'Seminyak / Kuta Resort',
        dailyCost: '₹7,000 - ₹9,500',
        tips: 'Carry water shoes and motion-sickness tablets if prone to sea waves.'
      },
      {
        day: 4,
        title: 'Uluwatu Sunset Cliff Temple & Jimbaran Seafood Feast',
        morning: 'Leisure morning with floating breakfast in private pool villa. Traditional 2-hour Balinese massage.',
        afternoon: 'Drive to Uluwatu Temple perched 70 meters above crashing Indian Ocean waves.',
        evening: 'Watch the hypnotic sunset Kecak Fire Dance. Candlelight seafood dinner on Jimbaran beach.',
        stay: 'Luxury Beachfront Resort, Nusa Dua / Uluwatu',
        dailyCost: '₹6,500 - ₹9,000',
        tips: 'Guard loose sunglasses and phones as Uluwatu temple monkeys are very playful.'
      },
      {
        day: 5,
        title: 'Krisna Souvenir Shopping & Airport Drop',
        morning: 'Leisure breakfast. Souvenir shopping for Balinese coffee, handmade batik, and aromatics.',
        afternoon: 'Checkout and private transfer to Denpasar Airport for departure flight home.',
        evening: 'Board international departure flight with unforgettable tropical memories.',
        stay: 'International Flight',
        dailyCost: '₹2,000 - ₹4,000',
        tips: 'Reach DPS airport at least 3 hours prior to international flights.'
      }
    ],
    packingList: [
      'Breathable tropical linen & beachwear',
      'Water shoes and reef-safe sunscreen',
      'Universal power adapter (Type C/F)',
      'Dry bag for island boat transfers'
    ]
  },
  kerala: {
    title: 'Kerala Backwaters, Tea Gardens & Spice Hills',
    state: 'Kerala, India',
    bestTime: 'September to March',
    vibe: 'Floating luxury houseboats, emerald Munnar tea hills, and Kathakali cultural performances.',
    catalogTripId: 4,
    baseDays: [
      {
        day: 1,
        title: 'Cochin Arrival & Scenic Drive to Munnar Hill Station',
        morning: 'Pickup from Cochin Airport/Ernakulam Station. Scenic drive past Cheeyappara & Valara waterfalls.',
        afternoon: 'Check into mist-covered tea estate resort in Munnar. Walk through cardamom and pepper plantations.',
        evening: 'Enjoy a warm cup of freshly brewed Nilgiri tea with panoramic valley views.',
        stay: 'Munnar Tea Plantation Resort',
        dailyCost: '₹3,500 - ₹5,000',
        tips: 'The 4-hour drive to Munnar has wonderful photo viewpoints.'
      },
      {
        day: 2,
        title: 'Munnar Tea Trails & Eravikulam National Park',
        morning: 'Visit Eravikulam National Park (habitat of endangered Nilgiri Tahr mountain goat).',
        afternoon: 'Visit KDHP Tea Museum and Mattupetty Dam. Boating at Echo Point.',
        evening: 'Watch traditional Kalaripayattu martial arts and Kathakali dance performance.',
        stay: 'Munnar Tea Plantation Resort',
        dailyCost: '₹3,500 - ₹4,500',
        tips: 'Book national park entry tickets online in advance.'
      },
      {
        day: 3,
        title: 'Munnar to Thekkady (Periyar Tiger Reserve)',
        morning: 'Scenic mountain drive to Thekkady. Check into jungle resort.',
        afternoon: 'Guided spice plantation walk. Bamboo rafting or boat safari on Periyar Lake.',
        evening: 'Elephant interaction sanctuary visit and authentic Kerala Ayurvedic massage.',
        stay: 'Spice Village Resort, Thekkady',
        dailyCost: '₹4,000 - ₹5,500',
        tips: 'Buy authentic whole spices like green cardamom, cloves, and black pepper here.'
      },
      {
        day: 4,
        title: 'Thekkady to Alleppey Luxury Houseboat Cruise',
        morning: 'Drive down to Alleppey backwater jetty. Board your traditional luxury Kettuvallam houseboat at noon.',
        afternoon: 'Cruise along palm-fringed canals, paddy fields, and Vembanad Lake. Savor freshly cooked Karimeen fish curry lunch.',
        evening: 'Anchor in peaceful backwater lagoon. Dinner under the stars on the deck.',
        stay: 'Private Deluxe Alleppey Houseboat',
        dailyCost: '₹6,000 - ₹8,500',
        tips: 'All meals (Lunch, Evening Tea & Snacks, Dinner, Breakfast) are prepared by private onboard chef.'
      },
      {
        day: 5,
        title: 'Alleppey to Fort Kochi & Departure',
        morning: 'Morning breakfast on houseboat while cruising through sunrise waters. Checkout at 09:30 AM.',
        afternoon: 'Visit historic Fort Kochi, Chinese Fishing Nets, and Jewish Synagogue.',
        evening: 'Drop off at Cochin International Airport (COK) for departure.',
        stay: 'Departure Flight',
        dailyCost: '₹2,000 - ₹3,000',
        tips: 'Plan flights departing Cochin after 05:00 PM.'
      }
    ],
    packingList: [
      'Light cotton clothing & comfortable walking sandals',
      'Mosquito repellant for backwater evenings',
      'Umbrella or light rain jacket',
      'Camera with wide-angle lens for tea landscapes'
    ]
  }
};

/**
 * Generate a complete, intelligent, personalized travel itinerary
 */
export const generateAIItinerary = async ({
  destination = 'Meghalaya',
  days = 5,
  travelers = 2,
  pace = 'Balanced',
  mood = 'Adventure',
  budgetLevel = 'Moderate',
  customPreferences = ''
}) => {
  // Simulate natural AI computation latency (400ms - 600ms)
  await new Promise((resolve) => setTimeout(resolve, 500));

  const destKey = Object.keys(DESTINATION_ITINERARY_TEMPLATES).find((k) =>
    destination.toLowerCase().includes(k)
  ) || 'meghalaya';

  const template = DESTINATION_ITINERARY_TEMPLATES[destKey];
  const weather = getDestinationWeather(destination);
  const season = getCurrentSeason();

  // Slice or extend days to match user duration
  const targetDays = Math.max(3, Math.min(Number(days) || 5, 8));
  let generatedDays = [];

  for (let i = 0; i < targetDays; i++) {
    if (i < template.baseDays.length) {
      generatedDays.push({ ...template.baseDays[i], day: i + 1 });
    } else {
      const cycleIdx = i % template.baseDays.length;
      const base = template.baseDays[cycleIdx];
      generatedDays.push({
        day: i + 1,
        title: `Extended Exploration: ${base.title}`,
        morning: `Deep offbeat exploration around ${template.state}. Hidden viewpoint trails.`,
        afternoon: `Local village immersion, artisan workshop visit, and regional organic lunch.`,
        evening: `Leisure sunset cafe hopping and cultural photography.`,
        stay: base.stay,
        dailyCost: base.dailyCost,
        tips: 'Enjoy relaxed travel pace and offbeat local spots.'
      });
    }
  }

  // Calculate budget estimate based on level and duration
  const perDayCost = budgetLevel === 'Luxury' ? 8500 : budgetLevel === 'Budget' ? 2800 : 4500;
  const totalEstimatedCost = perDayCost * targetDays * Number(travelers);

  // Link to matching bookable trip in catalog
  const matchedTrip = UPCOMING_TRIPS.find((t) => t.id === template.catalogTripId) || UPCOMING_TRIPS[0];

  return {
    id: 'ai-plan-' + Date.now(),
    createdAt: new Date().toISOString(),
    destination: destination,
    title: `${targetDays}-Day ${mood} Itinerary for ${destination}`,
    tagline: template.vibe,
    daysCount: targetDays,
    travelers: travelers,
    pace: pace,
    mood: mood,
    budgetLevel: budgetLevel,
    totalEstimatedCost: totalEstimatedCost,
    currency: 'INR',
    weather: weather,
    seasonContext: season.name,
    bestTimeToVisit: template.bestTime,
    itineraryDays: generatedDays,
    packingList: template.packingList,
    matchedCatalogTrip: matchedTrip,
    disclaimer: 'Estimates and daily plans are generated by WanderLuxe Travel Intelligence. Actual travel permits, entrance fees, and meal prices may vary by season.'
  };
};
