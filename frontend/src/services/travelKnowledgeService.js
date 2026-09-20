import travelKnowledge from '../data/travelKnowledge.json';
import { UPCOMING_TRIPS } from '../constants/mockData.js';
import { 
  Mountain, Palmtree, Trees, Waves, Compass, 
  Heart, Award, Coffee, Sun, CloudRain, Luggage, 
  ShieldCheck, Ticket, BatteryCharging, HeartPulse, 
  Shirt, Layers, Smile, Hand, Smartphone, Glasses, 
  Footprints, Flashlight, Droplet, Wind, CloudSun
} from 'lucide-react';

/**
 * Lucide Icon Safe Map: Decouples JSX from JSON
 */
export const ICON_MAP = {
  Mountain,
  Palmtree,
  Trees,
  Waves,
  Compass,
  Heart,
  Award,
  Coffee,
  Sun,
  CloudRain,
  Luggage,
  ShieldCheck,
  Ticket,
  BatteryCharging,
  HeartPulse,
  Shirt,
  Layers,
  Smile,
  Hand,
  Smartphone,
  Glasses,
  Footprints,
  Flashlight,
  Droplet,
  Wind,
  CloudSun
};

/**
 * Safely resolves Lucide icon component by name string
 */
export function getLucideIcon(iconName, fallback = Compass) {
  return ICON_MAP[iconName] || fallback;
}

/**
 * Normalize any arbitrary destination/location string into canonical slug
 */
export function normalizeDestinationSlug(input = '') {
  const q = String(input || '').toLowerCase().trim();
  if (!q) return null;

  if (q.includes('meghalaya') || q.includes('shillong') || q.includes('cherrapunji') || q.includes('dawki') || q.includes('nongriat') || q.includes('guwahati') || q.includes('jowai')) {
    return 'meghalaya';
  }
  if (q.includes('spiti') || q.includes('kaza') || q.includes('tabo') || q.includes('chandratal') || q.includes('hikkim') || q.includes('komic') || q.includes('langza') || q.includes('kalpa')) {
    return 'spiti-valley';
  }
  if (q.includes('bali') || q.includes('indonesia') || q.includes('nusa penida') || q.includes('canggu') || q.includes('ubud') || q.includes('seminyak') || q.includes('gili')) {
    return 'bali';
  }
  if (q.includes('kerala') || q.includes('munnar') || q.includes('alleppey') || q.includes('varkala') || q.includes('wayanad') || q.includes('cochin') || q.includes('thekkady')) {
    return 'kerala';
  }
  if (q.includes('kashmir') || q.includes('srinagar') || q.includes('gulmarg') || q.includes('pahalgam') || q.includes('sonamarg') || q.includes('dal lake')) {
    return 'kashmir';
  }
  if (q.includes('ladakh') || q.includes('leh') || q.includes('pangong') || q.includes('nubra') || q.includes('khardung') || q.includes('zanskar') || q.includes('hanle')) {
    return 'ladakh';
  }
  if (q.includes('goa') || q.includes('panaji') || q.includes('calangute') || q.includes('palolem') || q.includes('anjuna') || q.includes('vagator') || q.includes('fontainhas')) {
    return 'goa';
  }
  if (q.includes('rajasthan') || q.includes('jaipur') || q.includes('udaipur') || q.includes('jaisalmer') || q.includes('jodhpur') || q.includes('pushkar') || q.includes('mount abu')) {
    return 'rajasthan';
  }
  if (q.includes('himachal') || q.includes('manali') || q.includes('kasol') || q.includes('jibhi') || q.includes('bir billing') || q.includes('dharamshala') || q.includes('shimla') || q.includes('tirthan')) {
    return 'himachal-pradesh';
  }
  if (q.includes('uttarakhand') || q.includes('rishikesh') || q.includes('kedarnath') || q.includes('chopta') || q.includes('auli') || q.includes('tungnath') || q.includes('dehradun') || q.includes('mussoorie') || q.includes('nainital')) {
    return 'uttarakhand';
  }

  // Fallback to closest match — or return the raw query slug for dynamic synthesis
  const matched = (travelKnowledge.destinations || []).find(d => 
    q.includes(d.id) || q.includes(d.slug) || q.includes(d.name.toLowerCase()) || q.includes(d.state.toLowerCase())
  );

  return matched ? matched.slug : q.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Get all destinations with full structured metadata
 */
export function getDestinations() {
  return travelKnowledge.destinations || [];
}

/**
 * Get specific destination metadata by slug or location name
 */
export function getDestinationBySlug(slugOrName = '') {
  const canonicalSlug = normalizeDestinationSlug(slugOrName);
  if (!canonicalSlug) return travelKnowledge.destinations?.[0] || {};
  const found = (travelKnowledge.destinations || []).find(d => d.slug === canonicalSlug);
  if (found) return found;

  // Dynamic destination synthesizer — generates a rich object for any arbitrary place
  return synthesizeDynamicDestination(slugOrName);
}

/**
 * Synthesizes a full destination metadata object for any place not in the JSON database.
 * Ensures the overview, weather, attractions, food etc. are contextually relevant.
 */
function synthesizeDynamicDestination(rawInput = '') {
  const name = rawInput.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  const slug = rawInput.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const q = rawInput.toLowerCase();

  // Environment classification
  let env = 'urban_heritage';
  let summary = `Discover the vibrant culture, iconic landmarks, and local flavors of ${name}. A curated travel experience through the best this destination has to offer.`;
  let description = `${name} offers a rich tapestry of history, art, architecture, and gastronomy. Explore iconic monuments, bustling local markets, serene parks, and world-class dining experiences that make this destination truly unforgettable.`;
  let heroImage = 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80';
  let weatherProfile = { temp: '28°C', condition: 'Pleasant & Clear', humidity: '55%', iconType: 'Sun', statusTag: 'Great Travel Window', bestMonthsText: 'Year Round', vibe: `Ideal weather for exploring ${name} at a relaxed pace.` };
  let travelStyles = ['culture', 'heritage', 'gastronomy'];
  let bestMonths = ['October', 'November', 'December', 'January', 'February', 'March'];
  let activities = ['heritage-walks', 'food-tours', 'museum-visits', 'local-market-exploration', 'sunset-viewpoints'];
  let food = [`Authentic ${name} regional cuisine`, 'Local street food specialties', 'Traditional sweets & desserts', 'Artisan café culture'];
  let packingTags = ['comfortable-shoes', 'light-layers', 'sunscreen', 'camera', 'reusable-water-bottle'];

  // Destination-aware customization
  const isCoastal = /beach|coast|sea|ocean|marina|shore|island|goa|gokarna|pondicherry|vizag|puri|kochi|mangalore/i.test(q);
  const isMountain = /mountain|himalaya|trek|pass|altitude|leh|alps|snow|glacier|peak|everest/i.test(q);
  const isDesert = /desert|dune|safari|thar|egypt|jordan|oman/i.test(q);
  const isForest = /forest|jungle|rainforest|falls|waterfall|coorg|national park|wildlife/i.test(q);

  // City-specific rich data
  const cityProfiles = {
    chennai: {
      summary: 'The cultural capital of South India — ancient Dravidian temples, the legendary Marina Beach, silk-weaving heritage of Kanchipuram, and the UNESCO rock-cut marvels of Mahabalipuram.',
      description: 'Chennai offers a magnificent blend of 7th-century Pallava architecture at Mahabalipuram, the sacred Kapaleeshwarar Temple in Mylapore, the vibrant art district of Cholamandal, and the world-famous Marina Beach promenade. Savor authentic Chettinad cuisine, filter coffee, and crispy ghee dosas.',
      heroImage: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80',
      env: 'coastal_city',
      weatherProfile: { temp: '32°C', condition: 'Tropical & Warm', humidity: '72%', iconType: 'Sun', statusTag: 'Sunny Coastal Weather', bestMonthsText: 'Nov - Feb', vibe: 'Warm tropical breezes along the Bay of Bengal coast.' },
      bestMonths: ['November', 'December', 'January', 'February'],
      travelStyles: ['culture', 'heritage', 'gastronomy', 'beach'],
      attractions: [
        { name: 'Marina Beach Promenade', location: 'Marina Beach', type: 'Coastal Landmark' },
        { name: 'Kapaleeshwarar Temple', location: 'Mylapore', type: 'Dravidian Heritage' },
        { name: 'Mahabalipuram Shore Temple', location: 'Mahabalipuram', type: 'UNESCO Site' },
        { name: 'San Thome Cathedral', location: 'Santhome', type: 'Gothic Architecture' },
        { name: 'DakshinaChitra Heritage Museum', location: 'ECR', type: 'Living Heritage' },
        { name: 'Kanchipuram Silk Weavers', location: 'Kanchipuram', type: 'Artisan Craft' },
        { name: 'Fort St. George', location: 'Chennai', type: 'Colonial History' }
      ],
      activities: ['temple-walks', 'beach-promenades', 'silk-shopping', 'filter-coffee-trail', 'heritage-photography'],
      food: ['Chettinad Spiced Curries', 'Crispy Ghee Dosa & Filter Coffee', 'Marina Beach Sundal & Murukku', 'Kanchipuram Idli'],
      packingTags: ['light-cotton-clothes', 'sunscreen', 'comfortable-sandals', 'umbrella', 'camera']
    },
    mumbai: {
      summary: 'City of Dreams — the Gateway of India, Bollywood glamour, Marine Drive\'s Queen\'s Necklace, UNESCO Elephanta Caves, and legendary street food from vada pav to pav bhaji.',
      description: 'Mumbai pulses with energy from the colonial grandeur of CST Station to the serene Elephanta Island caves. Experience Marine Drive at sunset, explore Bandra\'s cosmopolitan cafes, dive into Dharavi\'s artisan workshops, and savor the city\'s unrivaled street food culture.',
      heroImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1200&auto=format&fit=crop&q=80',
      env: 'coastal_city',
      weatherProfile: { temp: '30°C', condition: 'Humid & Warm', humidity: '75%', iconType: 'Sun', statusTag: 'Warm Coastal City', bestMonthsText: 'Oct - Mar', vibe: 'Arabian Sea breezes with vibrant city energy.' },
      bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
      travelStyles: ['culture', 'urban', 'gastronomy', 'nightlife'],
      attractions: [
        { name: 'Gateway of India', location: 'Colaba', type: 'Colonial Monument' },
        { name: 'Marine Drive Queen\'s Necklace', location: 'Marine Drive', type: 'Coastal Boulevard' },
        { name: 'Elephanta Caves', location: 'Elephanta Island', type: 'UNESCO Heritage' },
        { name: 'CST Railway Station', location: 'Fort', type: 'Gothic Revival Architecture' },
        { name: 'Bandra-Worli Sea Link', location: 'Bandra', type: 'Modern Engineering' },
        { name: 'Kala Ghoda Art District', location: 'Fort', type: 'Art & Culture' },
        { name: 'Sanjay Gandhi National Park', location: 'Borivali', type: 'Urban Nature Reserve' }
      ],
      activities: ['heritage-walks', 'street-food-tours', 'island-ferry', 'bollywood-tour', 'sea-link-drive'],
      food: ['Vada Pav', 'Pav Bhaji at Juhu Beach', 'Parsi Dhansak', 'Cutting Chai & Bun Maska'],
      packingTags: ['light-clothes', 'comfortable-walking-shoes', 'rain-jacket', 'sunglasses', 'power-bank']
    },
    delhi: {
      summary: 'Seven cities of empire — Mughal splendor at Humayun\'s Tomb, the bustling spice lanes of Chandni Chowk, India Gate\'s grand boulevard, and Qutub Minar\'s 73-meter minaret.',
      description: 'Delhi layers 3,000 years of history from the Red Fort to Lutyens\' grand imperial boulevards. Discover Mughal garden tombs, ride rickshaws through Old Delhi\'s food alleys, marvel at Akshardham\'s carved sandstone, and shop for handicrafts at Dilli Haat.',
      heroImage: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=1200&auto=format&fit=crop&q=80',
      env: 'urban_heritage',
      weatherProfile: { temp: '25°C', condition: 'Pleasant & Clear', humidity: '45%', iconType: 'Sun', statusTag: 'Perfect Heritage Weather', bestMonthsText: 'Oct - Mar', vibe: 'Crisp winter mornings ideal for monument exploration.' },
      bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
      travelStyles: ['heritage', 'culture', 'gastronomy', 'history'],
      attractions: [
        { name: 'Qutub Minar', location: 'Mehrauli', type: 'UNESCO Tower' },
        { name: 'Humayun\'s Tomb', location: 'Nizamuddin', type: 'Mughal Garden Tomb' },
        { name: 'Red Fort', location: 'Old Delhi', type: 'Mughal Citadel' },
        { name: 'India Gate', location: 'Kartavya Path', type: 'National Memorial' },
        { name: 'Chandni Chowk', location: 'Old Delhi', type: 'Historic Bazaar' },
        { name: 'Akshardham Temple', location: 'East Delhi', type: 'Modern Sacred Architecture' },
        { name: 'Lodhi Art District', location: 'Lodhi Colony', type: 'Street Art Gallery' }
      ],
      activities: ['rickshaw-heritage-rides', 'mughal-garden-walks', 'street-food-tours', 'bazaar-shopping', 'monument-photography'],
      food: ['Paranthe Wali Gali Stuffed Paranthas', 'Old Delhi Kebabs & Nihari', 'Daulat ki Chaat', 'Rajasthani Thali at Chandni Chowk'],
      packingTags: ['layered-clothing', 'comfortable-shoes', 'pollution-mask', 'sunscreen', 'camera']
    },
    varanasi: {
      summary: 'The eternal city of light — sacred Ganga Aarti at Dashashwamedh, sunrise boat rides past 84 ancient ghats, Sarnath\'s Buddhist pilgrimage, and Banarasi silk weaving heritage.',
      description: 'Varanasi is the spiritual heart of India. Experience the mesmerizing Ganga Aarti ceremony, row past cremation ghats at dawn, visit Sarnath where Buddha gave his first sermon, and watch master weavers craft gold-threaded Banarasi silk sarees.',
      heroImage: 'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?w=1200&auto=format&fit=crop&q=80',
      env: 'urban_heritage',
      weatherProfile: { temp: '24°C', condition: 'Pleasant & Warm', humidity: '50%', iconType: 'Sun', statusTag: 'Sacred Season Active', bestMonthsText: 'Oct - Mar', vibe: 'Cool mornings along the holy Ganges with spiritual energy.' },
      bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
      travelStyles: ['spiritual', 'culture', 'heritage', 'photography'],
      attractions: [
        { name: 'Dashashwamedh Ghat Aarti', location: 'Dashashwamedh', type: 'Sacred Ceremony' },
        { name: 'Sunrise Boat Ride', location: 'Assi to Manikarnika', type: 'River Experience' },
        { name: 'Kashi Vishwanath Temple', location: 'Vishwanath Gali', type: 'Ancient Temple' },
        { name: 'Sarnath Dhamek Stupa', location: 'Sarnath', type: 'Buddhist Pilgrimage' },
        { name: 'Ramnagar Fort', location: 'Ramnagar', type: 'Royal Heritage' },
        { name: 'Banarasi Silk Looms', location: 'Madanpura', type: 'Artisan Weaving' },
        { name: 'Manikarnika Ghat', location: 'Old City', type: 'Sacred Cremation Ground' }
      ],
      activities: ['ganga-aarti-ceremony', 'sunrise-boat-rides', 'silk-weaving-tours', 'street-chaat-trails', 'yoga-sessions'],
      food: ['Banarasi Paan', 'Tamatar Chaat & Kachori', 'Malaiyo (Winter Cream Dessert)', 'Thandai & Lassi'],
      packingTags: ['modest-clothing', 'comfortable-sandals', 'small-daypack', 'mosquito-repellent', 'camera']
    },
    goa: {
      summary: 'Sun, sand, and Portuguese soul — golden beaches, colonial Fontainhas quarter, spice plantations, and legendary beachside nightlife along the Arabian Sea.',
      description: 'Goa enchants with its blend of Indian and Portuguese heritage. Explore centuries-old basilicas, relax on palm-fringed beaches, dance at beachside clubs, kayak through mangrove backwaters, and feast on fresh seafood vindaloo.',
      heroImage: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&auto=format&fit=crop&q=80',
      env: 'tropical_beach',
      weatherProfile: { temp: '30°C', condition: 'Sunny & Tropical', humidity: '65%', iconType: 'Sun', statusTag: 'Beach Season Active', bestMonthsText: 'Oct - Mar', vibe: 'Perfect beach weather with warm sea breezes.' },
      bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
      travelStyles: ['beach', 'nightlife', 'culture', 'relaxation'],
      attractions: [
        { name: 'Calangute & Baga Beach', location: 'North Goa', type: 'Popular Beach' },
        { name: 'Basilica of Bom Jesus', location: 'Old Goa', type: 'UNESCO Church' },
        { name: 'Fontainhas Latin Quarter', location: 'Panaji', type: 'Portuguese Heritage' },
        { name: 'Dudhsagar Waterfall', location: 'Mollem', type: 'Scenic Waterfall' },
        { name: 'Palolem Beach', location: 'South Goa', type: 'Serene Cove' },
        { name: 'Spice Plantation Tour', location: 'Ponda', type: 'Agri-Tourism' },
        { name: 'Fort Aguada', location: 'Sinquerim', type: 'Portuguese Fort' }
      ],
      activities: ['beach-hopping', 'water-sports', 'heritage-walks', 'spice-tours', 'nightlife-crawls'],
      food: ['Goan Fish Curry & Rice', 'Prawn Balchão', 'Bebinca Layered Dessert', 'Feni & Cashew Nut Treats'],
      packingTags: ['swimwear', 'sunscreen', 'flip-flops', 'light-clothes', 'waterproof-phone-case']
    },
    rajasthan: {
      summary: 'Land of kings — majestic Rajput forts, shimmering Thar desert dunes, vibrant bazaars of Jaipur, the blue city of Jodhpur, and romantic Udaipur lake palaces.',
      description: 'Rajasthan dazzles with royal heritage from Amber Fort to Jaisalmer\'s golden sandstone havelis. Ride camels across Thar dunes under starlit skies, shop for block-printed textiles, and feast on dal baati churma in palace courtyards.',
      heroImage: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=80',
      env: 'desert',
      weatherProfile: { temp: '26°C', condition: 'Dry & Sunny', humidity: '25%', iconType: 'Sun', statusTag: 'Perfect Desert Season', bestMonthsText: 'Oct - Mar', vibe: 'Cool desert nights and warm golden days perfect for fort exploration.' },
      bestMonths: ['October', 'November', 'December', 'January', 'February', 'March'],
      travelStyles: ['heritage', 'culture', 'desert', 'photography'],
      attractions: [
        { name: 'Amber Fort', location: 'Jaipur', type: 'Rajput Fortress' },
        { name: 'Mehrangarh Fort', location: 'Jodhpur', type: 'Hilltop Citadel' },
        { name: 'City Palace Udaipur', location: 'Udaipur', type: 'Lake Palace' },
        { name: 'Jaisalmer Golden Fort', location: 'Jaisalmer', type: 'Living Fort' },
        { name: 'Hawa Mahal', location: 'Jaipur', type: 'Palace of Winds' },
        { name: 'Sam Sand Dunes', location: 'Jaisalmer', type: 'Desert Safari' },
        { name: 'Pushkar Sacred Lake', location: 'Pushkar', type: 'Pilgrimage Lake' }
      ],
      activities: ['fort-exploration', 'camel-safaris', 'textile-shopping', 'palace-dinners', 'desert-camping'],
      food: ['Dal Baati Churma', 'Laal Maas', 'Pyaaz Kachori', 'Ghevar & Mawa Kachori'],
      packingTags: ['cotton-clothing', 'sun-hat', 'dust-scarf', 'sunscreen', 'comfortable-shoes']
    }
  };

  // Check for known city profile
  const cityKey = Object.keys(cityProfiles).find(k => q.includes(k));
  if (cityKey) {
    const cp = cityProfiles[cityKey];
    return {
      id: slug, slug, name, country: 'India', region: name, state: name,
      summary: cp.summary, description: cp.description, heroImage: cp.heroImage,
      gallery: [cp.heroImage],
      bestMonths: cp.bestMonths, seasons: ['autumn', 'winter', 'spring'],
      travelStyles: cp.travelStyles,
      weatherSuitability: { sunny: 0.95, cloudy: 0.85, rainy: 0.70, snow: 0.0 },
      weatherProfile: cp.weatherProfile,
      recommendedDurations: [4, 5, 6, 7],
      budgetLevel: ['budget', 'mid-range', 'luxury'],
      defaultDailyCost: { budget: '₹2,000 - ₹3,500', 'mid-range': '₹4,000 - ₹6,000', luxury: '₹8,000 - ₹12,000' },
      attractions: cp.attractions,
      activities: cp.activities,
      food: cp.food,
      packingTags: cp.packingTags,
      _synthesized: true, _environment: cp.env
    };
  }

  // Environment-aware generic synthesis
  if (isCoastal) {
    env = 'coastal_city';
    summary = `Sun-kissed coastlines, seaside promenades, and vibrant local culture await in ${name}.`;
    description = `${name} offers stunning beaches, fresh seafood, coastal heritage walks, and golden sunset views along the shoreline.`;
    weatherProfile = { temp: '30°C', condition: 'Sunny & Breezy', humidity: '70%', iconType: 'Sun', statusTag: 'Beach Weather', bestMonthsText: 'Oct - Mar', vibe: `Warm coastal breezes perfect for exploring ${name}.` };
    travelStyles = ['beach', 'relaxation', 'water-sports', 'gastronomy'];
    heroImage = 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&auto=format&fit=crop&q=80';
  } else if (isMountain) {
    env = 'high_altitude';
    summary = `Majestic mountain landscapes, alpine meadows, and pristine trails in ${name}.`;
    description = `${name} beckons with snow-capped peaks, serene valleys, ancient monasteries, and thrilling mountain passes.`;
    weatherProfile = { temp: '12°C', condition: 'Cool & Clear', humidity: '35%', iconType: 'CloudSun', statusTag: 'Mountain Season', bestMonthsText: 'May - Oct', vibe: `Crisp mountain air and panoramic views in ${name}.` };
    travelStyles = ['adventure', 'trekking', 'nature', 'photography'];
    heroImage = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&auto=format&fit=crop&q=80';
    bestMonths = ['May', 'June', 'July', 'August', 'September', 'October'];
  } else if (isDesert) {
    env = 'desert';
    summary = `Golden dunes, starlit skies, and ancient caravan trails through ${name}.`;
    description = `${name} enchants with sweeping sand dunes, royal forts, vibrant folk culture, and unforgettable desert sunsets.`;
    weatherProfile = { temp: '28°C', condition: 'Dry & Sunny', humidity: '20%', iconType: 'Sun', statusTag: 'Desert Season', bestMonthsText: 'Oct - Mar', vibe: `Warm days and cool starlit nights in ${name}.` };
    travelStyles = ['desert', 'heritage', 'culture', 'photography'];
    heroImage = 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=80';
  } else if (isForest) {
    env = 'rainforest';
    summary = `Lush green canopies, cascading waterfalls, and rich wildlife in ${name}.`;
    description = `${name} immerses you in pristine forests, roaring waterfalls, exotic birdlife, and serene nature trails.`;
    weatherProfile = { temp: '22°C', condition: 'Misty & Green', humidity: '80%', iconType: 'CloudRain', statusTag: 'Nature Season', bestMonthsText: 'Sep - May', vibe: `Misty mornings and lush trails in ${name}.` };
    travelStyles = ['nature', 'wildlife', 'adventure', 'photography'];
    heroImage = 'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&auto=format&fit=crop&q=80';
  }

  return {
    id: slug, slug, name, country: 'Unknown', region: name, state: name,
    summary, description, heroImage,
    gallery: [heroImage],
    bestMonths, seasons: ['autumn', 'winter', 'spring'],
    travelStyles,
    weatherSuitability: { sunny: 0.90, cloudy: 0.85, rainy: 0.70, snow: 0.0 },
    weatherProfile,
    recommendedDurations: [4, 5, 6, 7],
    budgetLevel: ['budget', 'mid-range', 'luxury'],
    defaultDailyCost: { budget: '₹2,000 - ₹3,500', 'mid-range': '₹4,000 - ₹6,000', luxury: '₹8,000 - ₹12,000' },
    attractions: [
      { name: `${name} Signature Landmark`, location: name, type: 'Top Highlight' },
      { name: `${name} Heritage Quarter`, location: name, type: 'Cultural Walk' },
      { name: `${name} Scenic Viewpoint`, location: name, type: 'Panoramic Vista' },
      { name: `${name} Local Market & Food Trail`, location: name, type: 'Gastronomy' },
      { name: `${name} Hidden Gem`, location: name, type: 'Offbeat Discovery' }
    ],
    activities,
    food,
    packingTags,
    _synthesized: true, _environment: env
  };
}

/**
 * Get all standardized travel styles / moods
 */
export function getTravelStyles() {
  return travelKnowledge.travelStyles || [];
}

/**
 * Get current season context from date
 */
export function getSeasonContext(date = new Date()) {
  const month = date.getMonth() + 1; // 1-12

  for (const season of Object.values(travelKnowledge.seasons || {})) {
    if (season.months && season.months.includes(month)) {
      return season;
    }
  }

  return travelKnowledge.seasons?.spring || { name: 'Spring', weatherAdvice: 'Pleasant travel season.' };
}

/**
 * Get destination weather profile safely
 */
export function getDestinationWeather(locationString = '') {
  const dest = getDestinationBySlug(locationString);
  if (dest && dest.weatherProfile) {
    return dest.weatherProfile;
  }

  return {
    temp: '22°C',
    condition: 'Pleasant & Clear',
    humidity: '60%',
    iconType: 'Sun',
    statusTag: 'Great Travel Window',
    bestMonthsText: 'Year Round',
    vibe: 'Ideal conditions for outdoor adventure and sightseeing.'
  };
}

/**
 * Get active occasion / holiday window from date
 */
export function getActiveOccasionContext(date = new Date()) {
  const currentMonth = date.getMonth() + 1;
  const occasions = travelKnowledge.occasions || [];

  for (const occasion of occasions) {
    if (occasion.startMonth <= occasion.endMonth) {
      if (currentMonth >= occasion.startMonth && currentMonth <= occasion.endMonth) {
        return occasion;
      }
    } else {
      if (currentMonth >= occasion.startMonth || currentMonth <= occasion.endMonth) {
        return occasion;
      }
    }
  }

  return occasions[0] || null;
}

/**
 * Generate complete structured packing recommendations
 */
export function getPackingRecommendations(destinationInput, weather, season, isTrekking = false) {
  const dest = getDestinationBySlug(destinationInput);
  const rules = travelKnowledge.packingRules || {};

  const items = [...(rules.base || [])];

  const tempNum = parseInt(weather?.temp || '22', 10);
  const isCold = tempNum < 16 || ['spiti-valley', 'ladakh', 'kashmir'].includes(dest.slug);
  const isRain = (weather?.condition || '').toLowerCase().includes('rain') || ['meghalaya', 'kerala'].includes(dest.slug);
  const isBeach = ['bali', 'goa'].includes(dest.slug);

  if (isCold && rules.cold) {
    items.push(...rules.cold);
  }
  if (isRain && rules.rain) {
    items.push(...rules.rain);
  }
  if (isBeach && rules.beach) {
    items.push(...rules.beach);
  }
  if ((isTrekking || (dest.travelStyles && dest.travelStyles.includes('adventure'))) && rules.trekking) {
    items.push(...rules.trekking);
  }

  return items;
}

/**
 * Compact AI Context Selector: Builds token-efficient payload (< 3KB) for Gemini AI
 */
export function buildAITravelContext({
  destination = '',
  duration = 5,
  travelers = 2,
  style = 'Adventure',
  pace = 'Balanced',
  budget = 'Moderate',
  customPreferences = '',
  realTrips = []
}) {
  const dest = getDestinationBySlug(destination);
  const season = getSeasonContext();
  const weather = getDestinationWeather(destination);
  const aiPlannerConfig = travelKnowledge.aiPlanner || {};

  const matchedPackages = (realTrips || [])
    .filter(t => {
      const loc = (t.location || '').toLowerCase();
      const title = (t.title || '').toLowerCase();
      const q = (dest.slug || '').replace(/-/g, ' ');
      return loc.includes(q) || title.includes(q) || (dest.name && loc.includes(dest.name.toLowerCase()));
    })
    .slice(0, 3)
    .map(t => ({
      id: t.id,
      title: t.title,
      price: t.price,
      duration: t.duration,
      rating: t.rating
    }));

  return {
    destinationContext: {
      name: dest.name || destination,
      slug: dest.slug || destination,
      region: dest.region || 'India',
      state: dest.state || '',
      bestMonths: dest.bestMonths || ['Year Round'],
      summary: dest.summary || '',
      attractions: dest.attractions || [],
      foodDelicacies: dest.food || [],
      aiNotes: dest.aiContext?.travelNotes || [],
      planningHints: dest.aiContext?.planningHints || []
    },
    seasonContext: {
      currentSeason: season.name || 'Spring',
      weatherAdvice: season.weatherAdvice || 'Pleasant weather.',
      weather: weather
    },
    userPreferences: {
      duration: Number(duration),
      travelers: Number(travelers),
      travelStyle: style,
      pace: pace,
      budgetLevel: budget,
      customPreferences: customPreferences
    },
    planningRules: aiPlannerConfig.basePlanningRules || [],
    availableCatalogPackages: matchedPackages
  };
}

/**
 * Extract uppercase month-year group label (e.g. "AUG '26", "SEP '26") from dates string
 */
export function extractMonthLabel(dateString = '') {
  const str = String(dateString).toUpperCase();
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  for (const m of months) {
    if (str.includes(m)) {
      const yearMatch = str.match(/202[4-9]|2[4-9]/);
      const yr = yearMatch ? (yearMatch[0].length === 4 ? yearMatch[0].slice(2) : yearMatch[0]) : '26';
      return `${m} '${yr}`;
    }
  }
  return "SEP '26";
}

/**
 * Normalize single trip object to guarantee all expected fields exist
 */
export function normalizeTripObject(t) {
  if (!t || typeof t !== 'object') return null;
  const rawId = t.id !== undefined && t.id !== null ? t.id : (t._id || t.slug);
  const cleanId = typeof rawId === 'number' ? rawId : String(rawId);
  const price = Number(t.price) || 18500;
  const originalPrice = Number(t.originalPrice) || Math.round(price * 1.2);

  // Authoritative Room Sharing Rates
  const sharingPricing = {
    doubleSharing: Number(t.sharingPricing?.doubleSharing || price),
    tripleSharing: Number(t.sharingPricing?.tripleSharing || Math.max(1000, price - 1500)),
    singleSharing: Number(t.sharingPricing?.singleSharing || (price + 3500))
  };

  // Structured Batches Normalization
  const rawBatches = Array.isArray(t.batches) && t.batches.length > 0
    ? t.batches
    : (Array.isArray(t.availableBatches) && t.availableBatches.length > 0
        ? t.availableBatches
        : [
            { id: `b-${cleanId}-1`, dates: '28 Aug - 03 Sep, 2026', capacity: 16, bookedSeats: 12 },
            { id: `b-${cleanId}-2`, dates: '12 Sep - 18 Sep, 2026', capacity: 18, bookedSeats: 6 },
            { id: `b-${cleanId}-3`, dates: '25 Sep - 01 Oct, 2026', capacity: 20, bookedSeats: 0 },
            { id: `b-${cleanId}-4`, dates: '10 Oct - 16 Oct, 2026', capacity: 20, bookedSeats: 4 },
            { id: `b-${cleanId}-5`, dates: '24 Oct - 30 Oct, 2026', capacity: 20, bookedSeats: 0 },
            { id: `b-${cleanId}-6`, dates: '07 Nov - 13 Nov, 2026', capacity: 20, bookedSeats: 0 }
          ]);

  const batches = rawBatches.map((b, idx) => {
    const batchId = b.batchId || b.id || `batch-${cleanId}-${idx + 1}`;
    const dateText = b.dates || (typeof b === 'string' ? b : 'Upcoming Departure');
    const monthLabel = b.monthLabel || extractMonthLabel(dateText);
    const capacity = b.capacity !== undefined ? Number(b.capacity) : (t.capacity !== undefined ? Number(t.capacity) : null);
    const bookedSeats = Number(b.bookedSeats || 0);
    const availableSeats = capacity !== null ? Math.max(0, capacity - bookedSeats) : null;

    let status = b.status;
    if (!status) {
      if (availableSeats !== null) {
        status = availableSeats === 0 ? 'sold_out' : availableSeats <= 4 ? 'filling_fast' : 'available';
      } else {
        status = 'available';
      }
    }

    const batchPricing = {
      doubleSharing: Number(b.pricing?.doubleSharing || sharingPricing.doubleSharing),
      tripleSharing: Number(b.pricing?.tripleSharing || sharingPricing.tripleSharing),
      singleSharing: Number(b.pricing?.singleSharing || sharingPricing.singleSharing)
    };

    return {
      batchId,
      id: batchId,
      dates: dateText,
      monthLabel,
      capacity,
      bookedSeats,
      availableSeats,
      hasRealCapacity: capacity !== null,
      status,
      pricing: batchPricing,
      seatsLeft: availableSeats !== null ? availableSeats : undefined
    };
  });

  const pickupPoints = Array.isArray(t.pickupPoints) && t.pickupPoints.length > 0
    ? t.pickupPoints
    : [
        'Airport Arrival Hub (Terminal 1 Gate 3 - 10:00 AM)',
        'Central Railway Station / Main Bus Terminal (11:30 AM)'
      ];

  return {
    ...t,
    id: cleanId,
    _id: t._id || cleanId,
    title: t.title || 'Curated Expedition',
    slug: t.slug || String(t.title || 'trip').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
    location: t.location || t.destination || 'India',
    destination: t.destination || 'India',
    duration: t.duration || `${t.days || 5}D/${t.nights || 4}N`,
    days: t.days || 5,
    nights: t.nights || 4,
    price,
    originalPrice,
    discount: t.discount || Math.round(((originalPrice - price) / (originalPrice || 1)) * 100),
    image: t.image || t.heroImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800',
    heroImage: t.heroImage || t.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200',
    gallery: Array.isArray(t.gallery) && t.gallery.length > 0 ? t.gallery : [t.image || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb'],
    rating: Number(t.rating) || 4.8,
    reviews: Number(t.reviews) || 24,
    tags: Array.isArray(t.tags) && t.tags.length > 0 ? t.tags : ['Backpacking', 'Adventure'],
    category: t.category || 'Backpacking',
    mood: t.mood || 'Adventure',
    overview: t.overview || t.shortDescription || '',
    nextBatch: batches[0]?.dates || t.nextBatch || '15 Sep',
    batches,
    availableBatches: batches,
    sharingPricing,
    pickupPoints,
    itinerary: Array.isArray(t.itinerary) ? t.itinerary : [],
    inclusions: Array.isArray(t.inclusions) ? t.inclusions : [],
    exclusions: Array.isArray(t.exclusions) ? t.exclusions : [],
    faqs: Array.isArray(t.faqs) ? t.faqs : [],
    isActive: t.isActive !== false && t.status !== 'inactive'
  };
}

/**
 * Get all trips from the static central knowledge base
 */
export function getAllStaticTrips() {
  const base = (travelKnowledge.trips && travelKnowledge.trips.length > 0) ? travelKnowledge.trips : (UPCOMING_TRIPS || []);
  return base.map(normalizeTripObject).filter(Boolean);
}

/**
 * Merge live MongoDB trips with knowledge base trips seamlessly
 */
export function mergeTripsWithLive(liveTrips = []) {
  const staticTrips = getAllStaticTrips();
  if (!Array.isArray(liveTrips) || liveTrips.length === 0) {
    return staticTrips;
  }

  const mergedMap = new Map();

  // 1. Add all static knowledge trips
  staticTrips.forEach(t => {
    const key = String(t.slug || t.id);
    mergedMap.set(key, t);
  });

  // 2. Overlay / add live MongoDB trips
  liveTrips.forEach(raw => {
    const t = normalizeTripObject(raw);
    if (t) {
      const key = String(t.slug || t._id || t.id);
      mergedMap.set(key, t);
    }
  });

  return Array.from(mergedMap.values());
}

export default {
  getDestinations,
  getDestinationBySlug,
  normalizeDestinationSlug,
  getTravelStyles,
  getSeasonContext,
  getDestinationWeather,
  getActiveOccasionContext,
  getPackingRecommendations,
  buildAITravelContext,
  extractMonthLabel,
  normalizeTripObject,
  getAllStaticTrips,
  mergeTripsWithLive,
  getLucideIcon,
  ICON_MAP
};

