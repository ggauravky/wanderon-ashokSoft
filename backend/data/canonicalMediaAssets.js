import { generateLocationKeys } from '../models/MediaAsset.js';

export const RAW_SEED_ASSETS = [
  // =========================================================================
  // HIMACHAL PRADESH / MANALI / SPITI
  // =========================================================================
  {
    title: 'Solang Valley Snow & Adventure Ski Slopes',
    altText: 'Snow covered slopes and adventure sports in Solang Valley near Manali',
    caption: 'Solang Valley adventure hub famous for winter skiing and paragliding',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/solang_valley',
      secureUrl: 'https://images.unsplash.com/photo-1586796676774-c93004ae009f?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Manali',
      city: 'Manali',
      locality: 'Solang Valley',
      poi: 'Solang Valley'
    },
    tags: ['snow', 'adventure', 'skiing', 'paragliding', 'mountains'],
    featured: true
  },
  {
    title: 'Atal Tunnel North Portal & Sissu Valley Gateway',
    altText: 'Engineering marvel Atal Tunnel entrance opening to snow-clad Lahaul valley',
    caption: 'Atal Tunnel under Rohtang Pass connecting Manali to Lahaul & Spiti',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/atal_tunnel',
      secureUrl: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Manali',
      city: 'Lahaul',
      locality: 'Sissu',
      poi: 'Atal Tunnel'
    },
    tags: ['tunnel', 'mountains', 'snow', 'roadtrip', 'high altitude'],
    featured: true
  },
  {
    title: 'Sissu Waterfall & Poplar Forest in Lahaul',
    altText: 'Majestic Sissu waterfall dropping into the Chandra river valley surrounded by alpine trees',
    caption: 'Serene Sissu waterfall and autumn poplar trees in Lahaul',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/sissu_waterfall',
      secureUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Manali',
      city: 'Lahaul',
      locality: 'Sissu',
      poi: 'Sissu Waterfall'
    },
    tags: ['waterfall', 'mountains', 'lahaul', 'nature', 'hiking'],
    featured: true
  },
  {
    title: 'Hadimba Wooden Temple in Cedar Woods',
    altText: 'Ancient four-tiered wooden Hadimba Devi temple nestled inside giant deodar forest',
    caption: '16th century wooden pagoda temple dedicated to Hadimba Devi in Dhungri forest',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/hadimba_temple',
      secureUrl: 'https://images.unsplash.com/photo-1597074866923-dc0589150358?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Manali',
      city: 'Manali',
      locality: 'Dhungri',
      poi: 'Hadimba Temple'
    },
    tags: ['temple', 'heritage', 'forest', 'cedar', 'culture'],
    featured: false
  },
  {
    title: 'Old Manali Apple Orchards & Beas River Valley',
    altText: 'Traditional wooden houses and cafes amidst apple orchards along the roaring Beas river',
    caption: 'Quaint cobblestone streets and mountain cafes in Old Manali',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/old_manali',
      secureUrl: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Manali',
      city: 'Manali',
      locality: 'Old Manali',
      poi: 'Old Manali'
    },
    tags: ['cafes', 'riverside', 'culture', 'apples', 'backpacking'],
    featured: false
  },
  {
    title: 'Kasol & Parvati River Alpine Valley',
    altText: 'Turquoise glacial waters of Parvati river rushing past pine covered Himalayan hills in Kasol',
    caption: 'Scenic Parvati river flowing through the heart of Kasol valley',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/kasol_parvati',
      secureUrl: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Kasol',
      city: 'Kullu',
      locality: 'Kasol',
      poi: 'Parvati Valley'
    },
    tags: ['river', 'trekking', 'pine forest', 'peace', 'backpacking'],
    featured: true
  },
  {
    title: 'Tosh Village & Snow Clad Peaks',
    altText: 'Last motorable village in Parvati valley with traditional wooden homes and glacier views',
    caption: 'Tosh village perched on the cliffside of Parvati valley',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/tosh_village',
      secureUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Kasol',
      city: 'Kullu',
      locality: 'Tosh',
      poi: 'Tosh Village'
    },
    tags: ['village', 'hiking', 'snow', 'glacier', 'mountains'],
    featured: false
  },
  {
    title: 'Key Monastery High Altitude Fortress in Spiti',
    altText: 'Ancient 11th century Buddhist monastery perched majestically on a conical mountain cliff in Spiti',
    caption: 'Kye Gompa monastery overlooking the braided Spiti river at 13,668 ft',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/key_monastery',
      secureUrl: 'https://images.pexels.com/photos/6239996/pexels-photo-6239996.jpeg',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Spiti Valley',
      city: 'Kaza',
      locality: 'Kye',
      poi: 'Key Monastery'
    },
    tags: ['monastery', 'buddhism', 'spiti', 'heritage', 'high altitude'],
    featured: true
  },
  {
    title: 'Chandratal Crescent Moon Lake at 14,100 ft',
    altText: 'Turquoise crescent shaped glacial lake reflecting snow capped peaks under clear blue sky',
    caption: 'Sacred Chandratal Lake situated on the Samudra Tapu plateau',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/chandratal_lake',
      secureUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Spiti Valley',
      city: 'Kaza',
      locality: 'Chandratal',
      poi: 'Chandratal Lake'
    },
    tags: ['lake', 'camping', 'stargazing', 'glacial', 'spiti'],
    featured: true
  },
  {
    title: 'Hikkim World Highest Post Office at 14,567 ft',
    altText: 'Quaint mud brick post office nestled in the arid high altitude mountain village of Hikkim',
    caption: 'Worlds highest operational post office in Hikkim village, Spiti',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/hikkim_post_office',
      secureUrl: 'https://images.unsplash.com/photo-1593181629936-11c609b8db9b?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Spiti Valley',
      city: 'Kaza',
      locality: 'Hikkim',
      poi: 'Hikkim Post Office'
    },
    tags: ['heritage', 'village', 'highest', 'post office', 'spiti'],
    featured: false
  },
  {
    title: 'Langza Giant Golden Buddha Statue',
    altText: 'Magnificent golden Buddha statue looking over the cold desert snow peaks of Langza',
    caption: '1000-year old Buddha statue in the fossil village of Langza',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/langza_buddha',
      secureUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Spiti Valley',
      city: 'Kaza',
      locality: 'Langza',
      poi: 'Langza Buddha'
    },
    tags: ['buddha', 'fossils', 'statue', 'mountains', 'spiti'],
    featured: false
  },

  // =========================================================================
  // MEGHALAYA / NORTHEAST INDIA
  // =========================================================================
  {
    title: 'Double Decker Living Root Bridge in Nongriat',
    altText: 'Centuries old bio-engineered rubber tree living root bridges spanning across jungle river',
    caption: 'Iconic Double Decker living root bridge engineered by Khasi indigenous tribe',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/double_decker_root_bridge',
      secureUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Cherrapunji',
      locality: 'Nongriat',
      poi: 'Double Decker Living Root Bridge'
    },
    tags: ['root bridge', 'trekking', 'rainforest', 'natural wonder', 'nongriat'],
    featured: true
  },
  {
    title: 'Nohkalikai Plunge Waterfall in Cherrapunji',
    altText: 'Tallest plunge waterfall in India dropping into a turquoise emerald lagoon amidst lush rainforest',
    caption: 'Spectacular Nohkalikai Falls plunge drop in Cherrapunji',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/nohkalikai_falls',
      secureUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Cherrapunji',
      locality: 'Sohra',
      poi: 'Nohkalikai Falls'
    },
    tags: ['waterfall', 'mist', 'cherrapunji', 'cliffs', 'nature'],
    featured: true
  },
  {
    title: 'Umngot Crystal Transparent River in Dawki',
    altText: 'Wooden boats floating on water so transparent they appear to hover in mid air',
    caption: 'Glass-like emerald waters of Umngot river along Indo-Bangladesh border at Dawki',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/dawki_umngot_river',
      secureUrl: 'https://images.unsplash.com/photo-1510312305653-8ed496efae75?q=80&w=1200&auto=format&fit=crop',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Dawki',
      locality: 'Dawki',
      poi: 'Umngot Crystal River'
    },
    tags: ['boating', 'crystal river', 'dawki', 'camping', 'emerald water'],
    featured: true
  },
  {
    title: 'Krang Suri Natural Swimming Pool & Waterfall',
    altText: 'Vibrant blue natural cascade pool surrounded by lush green limestone rocks in Jowai',
    caption: 'Turquoise natural swimming pool at Krang Suri waterfalls in West Jaintia Hills',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/krang_suri',
      secureUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Jowai',
      locality: 'Amlarem',
      poi: 'Krang Suri Waterfalls'
    },
    tags: ['waterfall', 'swimming', 'blue lagoon', 'nature', 'jaintia hills'],
    featured: false
  },
  {
    title: 'Shillong Umiam Lake & Scotland of the East',
    altText: 'Panoramic reservoir lake surrounded by pine covered East Khasi hills in Shillong',
    caption: 'Serene water sports and sunset vistas across Umiam Lake near Shillong',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/umiam_shillong',
      secureUrl: 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Shillong',
      locality: 'Umiam',
      poi: 'Umiam Lake'
    },
    tags: ['lake', 'shillong', 'sunset', 'boating', 'hills'],
    featured: false
  },

  // =========================================================================
  // LADAKH
  // =========================================================================
  {
    title: 'Pangong Tso Alpine Saline Lake',
    altText: 'Mesmerizing blue hues of Pangong Tso lake reflecting barren Ladakh mountain peaks',
    caption: '134 km long endorheic lake extending from Ladakh into Tibet at 14,270 ft',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/pangong_tso',
      secureUrl: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Ladakh',
      region: 'North India',
      destination: 'Ladakh',
      city: 'Leh',
      locality: 'Pangong',
      poi: 'Pangong Tso'
    },
    tags: ['lake', 'ladakh', 'high altitude', 'camping', 'stargazing'],
    featured: true
  },
  {
    title: 'Nubra Valley Hunder Sand Dunes & Bactrian Camels',
    altText: 'Double humped camel safari on high altitude sand dunes surrounded by snow peaks in Nubra',
    caption: 'Historic Silk Route oasis in Nubra Valley at the confluence of Shyok and Nubra rivers',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/nubra_hunder',
      secureUrl: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Ladakh',
      region: 'North India',
      destination: 'Ladakh',
      city: 'Nubra',
      locality: 'Hunder',
      poi: 'Hunder Sand Dunes'
    },
    tags: ['desert', 'camels', 'sand dunes', 'silk route', 'nubra'],
    featured: true
  },
  {
    title: 'Khardung La High Mountain Pass at 17,582 ft',
    altText: 'Prayer flags fluttering on the snowbound Khardung La motorable mountain pass',
    caption: 'Gateway to Nubra and Shyok valleys, one of the worlds highest motorable passes',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/khardung_la',
      secureUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Ladakh',
      region: 'North India',
      destination: 'Ladakh',
      city: 'Leh',
      locality: 'Khardung',
      poi: 'Khardung La'
    },
    tags: ['pass', 'snow', 'highest road', 'adventure', 'motorcycle'],
    featured: false
  },

  // =========================================================================
  // KASHMIR
  // =========================================================================
  {
    title: 'Dal Lake Shikara Cruise & Floating Gardens in Srinagar',
    altText: 'Traditional handcrafted wooden Shikara boat sailing on peaceful Dal Lake at sunset',
    caption: 'Jewel in the crown of Kashmir: Sunset Shikara ride across Dal Lake',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/dal_lake_srinagar',
      secureUrl: 'https://images.unsplash.com/photo-1595815771614-ade9d652a65d?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Jammu and Kashmir',
      region: 'North India',
      destination: 'Kashmir',
      city: 'Srinagar',
      locality: 'Dal Lake',
      poi: 'Dal Lake'
    },
    tags: ['lake', 'shikara', 'houseboat', 'sunset', 'srinagar'],
    featured: true
  },
  {
    title: 'Gulmarg Gondola & Apharwat Snow Meadows',
    altText: 'Asia highest cable car ascending over alpine pine trees and deep powder snow in Gulmarg',
    caption: 'Ski slopes and snow paradise of Gulmarg Meadow of Flowers',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/gulmarg_snow',
      secureUrl: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Jammu and Kashmir',
      region: 'North India',
      destination: 'Kashmir',
      city: 'Gulmarg',
      locality: 'Gulmarg',
      poi: 'Gulmarg Gondola'
    },
    tags: ['snow', 'skiing', 'gondola', 'meadows', 'kashmir'],
    featured: true
  },
  {
    title: 'Pahalgam & Betaab Valley Pine Meadows',
    altText: 'Lush green valley surrounded by snow mountains with Lidder river flowing through',
    caption: 'Scenic valley named after the Bollywood hit film Betaab near Pahalgam',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/pahalgam_betaab',
      secureUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Jammu and Kashmir',
      region: 'North India',
      destination: 'Kashmir',
      city: 'Pahalgam',
      locality: 'Betaab Valley',
      poi: 'Betaab Valley'
    },
    tags: ['meadow', 'river', 'horses', 'pahalgam', 'nature'],
    featured: false
  },

  // =========================================================================
  // KERALA
  // =========================================================================
  {
    title: 'Munnar Rolling Emerald Tea Estates & Mist',
    altText: 'Terraced tea gardens rolling across misty Western Ghat hills under morning sun',
    caption: 'Sprawling organic tea plantations of Munnar in God Own Country',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/munnar_tea',
      secureUrl: 'https://images.unsplash.com/photo-1593693397690-362cb9666fc2?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Kerala',
      region: 'South India',
      destination: 'Kerala',
      city: 'Munnar',
      locality: 'Munnar',
      poi: 'Munnar Tea Gardens'
    },
    tags: ['tea garden', 'greenery', 'western ghats', 'mist', 'munnar'],
    featured: true
  },
  {
    title: 'Alleppey Vembanad Backwaters Luxury Houseboat',
    altText: 'Traditional thatched roof Kettuvallam houseboat gliding smoothly through palm fringed canal',
    caption: 'Authentic luxury houseboat cruising through the tranquil backwaters of Alappuzha',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/alleppey_houseboat',
      secureUrl: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Kerala',
      region: 'South India',
      destination: 'Kerala',
      city: 'Alleppey',
      locality: 'Alappuzha',
      poi: 'Alleppey Backwaters'
    },
    tags: ['houseboat', 'backwaters', 'palms', 'canals', 'alleppey'],
    featured: true
  },

  // =========================================================================
  // RAJASTHAN
  // =========================================================================
  {
    title: 'Amer Fort & Maota Lake in Jaipur',
    altText: 'Majestic yellow sandstone Rajput fortress reflected on the still waters of Maota Lake',
    caption: 'UNESCO World Heritage hill fort built by Raja Man Singh in Amer, Jaipur',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/jaipur_amer_fort',
      secureUrl: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Rajasthan',
      region: 'North India',
      destination: 'Rajasthan',
      city: 'Jaipur',
      locality: 'Amer',
      poi: 'Amer Fort'
    },
    tags: ['fort', 'palace', 'heritage', 'jaipur', 'royalty'],
    featured: true
  },
  {
    title: 'Udaipur City Palace & Lake Pichola Island Vistas',
    altText: 'White marble palace complex illuminated across the blue waters of Lake Pichola in Udaipur',
    caption: 'City of Lakes: The Royal City Palace overlooking Lake Pichola',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/udaipur_city_palace',
      secureUrl: 'https://images.unsplash.com/photo-1615836245337-f5b9b2303f10?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Rajasthan',
      region: 'North India',
      destination: 'Rajasthan',
      city: 'Udaipur',
      locality: 'Lake Pichola',
      poi: 'City Palace Udaipur'
    },
    tags: ['lake', 'palace', 'udaipur', 'luxury', 'romance'],
    featured: true
  },

  // =========================================================================
  // GOA
  // =========================================================================
  {
    title: 'Palolem Beach & Palm Sunset Lagoon in South Goa',
    altText: 'Curved white sand bay lined with coconut palms and colorful beach huts at sunset in Palolem',
    caption: 'Pristine crescent bay of Palolem Beach in Canacona, South Goa',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/palolem_goa',
      secureUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Goa',
      region: 'West India',
      destination: 'Goa',
      city: 'Canacona',
      locality: 'Palolem',
      poi: 'Palolem Beach'
    },
    tags: ['beach', 'sunset', 'palms', 'relaxation', 'south goa'],
    featured: true
  },

  // =========================================================================
  // BALI
  // =========================================================================
  {
    title: 'Nusa Penida Kelingking T-Rex Cliff & Coastal Waves',
    altText: 'Iconic T-Rex shaped limestone cliff jutting into crashing turquoise ocean waters',
    caption: 'Breathtaking Kelingking Beach cliff view on Nusa Penida island',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/nusa_penida_kelingking',
      secureUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'Indonesia',
      state: 'Bali',
      region: 'Southeast Asia',
      destination: 'Bali',
      city: 'Nusa Penida',
      locality: 'Kelingking',
      poi: 'Kelingking Beach'
    },
    tags: ['beach', 'cliffs', 'ocean', 'bali', 'adventure', 'nature', 'scenic'],
    featured: true
  },

  // =========================================================================
  // MEGHALAYA NATURE-FIRST ENRICHED ASSETS
  // =========================================================================
  {
    title: 'Laitlum Canyons Misty Gorge & Valley Vistas',
    altText: 'Vast emerald canyons and deep mountain gorge shrouded in rolling mist in East Khasi Hills',
    caption: 'Dramatic edge of the world canyon views at Laitlum near Smit',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/laitlum_canyons',
      secureUrl: 'https://images.unsplash.com/photo-1578592083908-1111531e21b7?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Shillong',
      locality: 'Laitlum',
      poi: 'Laitlum Canyons'
    },
    tags: ['canyon', 'valleys', 'nature', 'mist', 'meghalaya', 'scenic', 'hiking', 'greenery'],
    featured: true
  },
  {
    title: 'Wei Sawdong Three-Tier Emerald Waterfalls',
    altText: 'Step-like three-tier natural plunge pool waterfall surrounded by rainforest in Sohra',
    caption: 'Stunning three-tier natural waterfall steps of Wei Sawdong in Cherrapunji',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/wei_sawdong_falls',
      secureUrl: 'https://images.unsplash.com/photo-1546708973-b339540b5162?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Cherrapunji',
      locality: 'Sohra',
      poi: 'Wei Sawdong Falls'
    },
    tags: ['waterfall', 'emerald pools', 'nature', 'cherrapunji', 'rainforest', 'scenic', 'jungle'],
    featured: true
  },
  {
    title: 'Mawlynnong Living Root Bridge & Rainforest Canopy',
    altText: 'Ancient single living root bridge woven across a clear jungle stream in Mawlynnong',
    caption: 'Riwai living root bridge and lush rainforest flora near Mawlynnong village',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/mawlynnong_bridge',
      secureUrl: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Meghalaya',
      region: 'Northeast India',
      destination: 'Meghalaya',
      city: 'Mawlynnong',
      locality: 'Riwai',
      poi: 'Riwai Living Root Bridge'
    },
    tags: ['root bridge', 'greenery', 'forest', 'nature', 'meghalaya', 'scenic', 'canopy'],
    featured: false
  },

  // =========================================================================
  // GOA NATURE-FIRST ENRICHED ASSETS (Beaches, Coastlines, Estuaries, Lagoons)
  // =========================================================================
  {
    title: 'Palolem Crescent Beach & Coconut Palm Fringe',
    altText: 'Curved white sandy beach with turquoise Arabian Sea waters and leaning coconut palms',
    caption: 'Idyllic crescent bay and lush tropical palm canopy at Palolem in South Goa',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/palolem_beach',
      secureUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Goa',
      region: 'West India',
      destination: 'Goa',
      city: 'Canacona',
      locality: 'Palolem',
      poi: 'Palolem Beach'
    },
    tags: ['beach', 'palms', 'coastline', 'ocean', 'nature', 'sunset', 'scenic', 'goa'],
    featured: true
  },
  {
    title: 'Vagator Red Cliff Coastline & Arabian Sea Horizon',
    altText: 'Dramatic red laterite rocky cliffs overlooking crashing waves and secluded beaches',
    caption: 'Rugged cliffside vistas and sunset panorama overlooking Vagator and Chapora coastline',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/vagator_cliffs',
      secureUrl: 'https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Goa',
      region: 'West India',
      destination: 'Goa',
      city: 'Vagator',
      locality: 'Ozran',
      poi: 'Vagator Beach'
    },
    tags: ['cliffs', 'ocean', 'beach', 'sunset', 'nature', 'coastal', 'scenic', 'goa'],
    featured: true
  },
  {
    title: 'Morjim Peaceful Turtle Shoreline & Estuary Mangroves',
    altText: 'Wide serene sandbars with gentle waves and migratory birds at Chapora river mouth',
    caption: 'Pristine coastal sanctuary and tranquil waters along Morjim shoreline',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/morjim_beach',
      secureUrl: 'https://images.unsplash.com/photo-1473186578172-c141e6798cf4?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Goa',
      region: 'West India',
      destination: 'Goa',
      city: 'Morjim',
      locality: 'Morjim',
      poi: 'Morjim Beach'
    },
    tags: ['beach', 'mangroves', 'nature', 'sunset', 'ocean', 'peaceful', 'scenic', 'goa'],
    featured: false
  },
  {
    title: 'Cola Beach Fresh Water Emerald Lagoon & Palms',
    altText: 'Secluded golden beach nestled between lush green hills and a crystal clear lagoon',
    caption: 'Hidden emerald freshwater lagoon meeting the Arabian Sea at Cola Beach',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/cola_lagoon',
      secureUrl: 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Goa',
      region: 'West India',
      destination: 'Goa',
      city: 'Canacona',
      locality: 'Cola',
      poi: 'Cola Beach'
    },
    tags: ['lagoon', 'beach', 'palms', 'water', 'nature', 'scenic', 'goa'],
    featured: false
  },

  // =========================================================================
  // BALI NATURE-FIRST ENRICHED ASSETS (Terraces, Volcanoes, Sea Cliffs)
  // =========================================================================
  {
    title: 'Tegallalang Layered Emerald Rice Terraces',
    altText: 'Spectacular stepped emerald green rice paddies surrounded by tropical jungle in Ubud',
    caption: 'Iconic Subak irrigation rice terrace landscape in the heart of Ubud, Bali',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/tegallalang_terraces',
      secureUrl: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'Indonesia',
      state: 'Bali',
      region: 'Southeast Asia',
      destination: 'Bali',
      city: 'Ubud',
      locality: 'Tegallalang',
      poi: 'Tegallalang Rice Terraces'
    },
    tags: ['rice terraces', 'greenery', 'nature', 'ubud', 'bali', 'palms', 'scenic', 'valley'],
    featured: true
  },
  {
    title: 'Mount Batur Volcanic Caldera & Lake Sunrise Panorama',
    altText: 'Sunrise over volcanic mountain rim and shimmering Lake Batur in Kintamani highlands',
    caption: 'Early morning golden glow across active volcano Mount Batur and crater lake',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/mount_batur',
      secureUrl: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'Indonesia',
      state: 'Bali',
      region: 'Southeast Asia',
      destination: 'Bali',
      city: 'Kintamani',
      locality: 'Batur',
      poi: 'Mount Batur'
    },
    tags: ['volcano', 'sunrise', 'lake', 'mountains', 'nature', 'scenic', 'caldera', 'bali'],
    featured: true
  },
  {
    title: 'Uluwatu Limestone Sea Cliffs & Coastal Swells',
    altText: 'Dramatic 250 ft limestone ocean cliffs plunging into Indian Ocean waves at Uluwatu',
    caption: 'Majestic cliffside sunset panorama along Bukit Peninsula in Uluwatu',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/uluwatu_cliffs',
      secureUrl: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'Indonesia',
      state: 'Bali',
      region: 'Southeast Asia',
      destination: 'Bali',
      city: 'Uluwatu',
      locality: 'Pecatu',
      poi: 'Uluwatu Cliffs'
    },
    tags: ['cliffs', 'ocean', 'sunset', 'waves', 'nature', 'scenic', 'bali'],
    featured: false
  },
  {
    title: 'Tibumana Hidden Jungle Waterfall & Plunge Pool',
    altText: 'Straight vertical natural waterfall curtain pouring into tranquil jungle lagoon',
    caption: 'Serene secluded rainforest waterfall and swimming pool at Tibumana near Ubud',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/tibumana_waterfall',
      secureUrl: 'https://images.unsplash.com/photo-1552055909-5a133f99335f?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'Indonesia',
      state: 'Bali',
      region: 'Southeast Asia',
      destination: 'Bali',
      city: 'Bangli',
      locality: 'Apuan',
      poi: 'Tibumana Waterfall'
    },
    tags: ['waterfall', 'jungle', 'nature', 'rainforest', 'bali', 'pool', 'greenery'],
    featured: false
  },

  // =========================================================================
  // KERALA NATURE-FIRST ENRICHED ASSETS (Cliffs, Tea Valleys, Rainforests)
  // =========================================================================
  {
    title: 'Varkala Red Laterite Cliffs & Arabian Sea Beach',
    altText: 'High coastal red cliffs lined with coconut palms dropping down to golden sand beach',
    caption: 'Scenic geological cliff formation and turquoise Arabian Sea vistas at Varkala',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/varkala_cliffs',
      secureUrl: 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Kerala',
      region: 'South India',
      destination: 'Kerala',
      city: 'Varkala',
      locality: 'North Cliff',
      poi: 'Varkala Cliff'
    },
    tags: ['cliffs', 'beach', 'sunset', 'ocean', 'nature', 'scenic', 'kerala'],
    featured: true
  },
  {
    title: 'Wayanad Chembra Peak & Rainforest Mist Trek',
    altText: 'Lush green tea covered mountain slopes under misty clouds in Wayanad Western Ghats',
    caption: 'Pristine rainforest ridges and tea hill treks in Wayanad highlands',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/wayanad_chembra',
      secureUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Kerala',
      region: 'South India',
      destination: 'Kerala',
      city: 'Wayanad',
      locality: 'Meppadi',
      poi: 'Chembra Peak'
    },
    tags: ['mountains', 'rainforest', 'trekking', 'nature', 'greenery', 'mist', 'kerala'],
    featured: false
  },

  // =========================================================================
  // RAJASTHAN SCENIC NATURE & LAKES
  // =========================================================================
  {
    title: 'Lake Pichola Scenic Waters & Aravalli Mountain Hills',
    altText: 'Calm reflective waters of Lake Pichola with mountain ranges in the backdrop at sunset',
    caption: 'Serene sunset vistas and tranquil ripples across Lake Pichola in Udaipur',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/lake_pichola',
      secureUrl: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Rajasthan',
      region: 'North India',
      destination: 'Rajasthan',
      city: 'Udaipur',
      locality: 'Pichola',
      poi: 'Lake Pichola'
    },
    tags: ['lake', 'sunset', 'scenic', 'water', 'udaipur', 'nature', 'heritage', 'hills'],
    featured: true
  },
  {
    title: 'Pushkar Sacred Desert Lake & Mountain Horizons',
    altText: 'Vast desert landscape surrounded by jagged Aravalli mountain hills in Rajasthan',
    caption: 'Timeless desert oasis and arid mountain scenery surrounding Pushkar',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/pushkar_desert',
      secureUrl: 'https://images.unsplash.com/photo-1564507592333-c60657eea523?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Rajasthan',
      region: 'North India',
      destination: 'Rajasthan',
      city: 'Pushkar',
      locality: 'Pushkar',
      poi: 'Pushkar Lake'
    },
    tags: ['desert', 'lake', 'hills', 'sunset', 'nature', 'scenic', 'rajasthan'],
    featured: false
  },

  // =========================================================================
  // UTTARAKHAND / RISHIKESH / CHOPTA SCENIC NATURE
  // =========================================================================
  {
    title: 'Rishikesh White Sand River Beach along the Ganges',
    altText: 'Emerald green Himalayan river flowing past white sand riverbeds and forested foothills',
    caption: 'Tranquil emerald waters and white sandy shores of the Ganga near Shivpuri',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/rishikesh_ganga_beach',
      secureUrl: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Uttarakhand',
      region: 'North India',
      destination: 'Rishikesh',
      city: 'Rishikesh',
      locality: 'Shivpuri',
      poi: 'Ganga Beach'
    },
    tags: ['river', 'ganga', 'foothills', 'beach', 'nature', 'mountains', 'scenic', 'rishikesh', 'uttarakhand'],
    featured: true
  },
  {
    title: 'Chopta Tungnath Alpine Meadow & Snow Peaks Panorama',
    altText: 'Lush green Bugyal meadows surrounded by thick rhododendron forests and snow peaks',
    caption: 'Mini Switzerland of India meadow trail leading towards Tungnath in Chopta',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/chopta_meadows',
      secureUrl: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Uttarakhand',
      region: 'North India',
      destination: 'Uttarakhand',
      city: 'Chopta',
      locality: 'Tungnath',
      poi: 'Chopta Meadows'
    },
    tags: ['meadow', 'mountains', 'trekking', 'nature', 'scenic', 'rhododendron', 'uttarakhand', 'peaks'],
    featured: true
  },

  // =========================================================================
  // KASHMIR, LADAKH & SPITI ADDITIONAL NATURE
  // =========================================================================
  {
    title: 'Pahalgam Betaab Valley Pine Meadows & Lidder River',
    altText: 'Turquoise snow-fed river rushing through pine covered alpine mountain valleys',
    caption: 'Picturesque pine forests and sparkling Lidder river currents in Betaab Valley',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/betaab_valley',
      secureUrl: 'https://images.unsplash.com/photo-1598091383021-15ddea10925d?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Jammu & Kashmir',
      region: 'North India',
      destination: 'Kashmir',
      city: 'Pahalgam',
      locality: 'Betaab Valley',
      poi: 'Betaab Valley'
    },
    tags: ['valley', 'river', 'pine forest', 'meadows', 'nature', 'scenic', 'kashmir'],
    featured: true
  },
  {
    title: 'Thiksey Monastery Mountain Vista & Indus Valley',
    altText: 'Multi-story whitewashed monastery perched on rocky hill rising above fertile Indus valley',
    caption: 'Sweeping high-altitude Himalayan desert vistas and Indus river groves at Thiksey',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/thiksey_vista',
      secureUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Ladakh',
      region: 'North India',
      destination: 'Ladakh',
      city: 'Leh',
      locality: 'Thiksey',
      poi: 'Thiksey Monastery'
    },
    tags: ['monastery', 'mountains', 'valley', 'nature', 'scenic', 'ladakh', 'high altitude'],
    featured: false
  },
  {
    title: 'Tosh Alpine Pine Village & Glacier Stream Valley',
    altText: 'Traditional mountain homes perched high above deep pine ravines and glacier streams',
    caption: 'Serene mountain valley and wooden alpine settlements at the head of Parvati Valley in Tosh',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/tosh_valley',
      secureUrl: 'https://images.unsplash.com/photo-1426604966848-d7adac402bff?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Kasol',
      city: 'Tosh',
      locality: 'Parvati Valley',
      poi: 'Tosh Valley'
    },
    tags: ['valley', 'mountains', 'river', 'pine forest', 'nature', 'scenic', 'himachal', 'kasol'],
    featured: false
  },
  {
    title: 'Chandratal Crescent Moon Alpine Blue Lake in Spiti',
    altText: 'Crystal clear crescent shaped alpine lake reflecting snow-capped Himalayan peaks at 14,000 ft',
    caption: 'Spectacular turquoise waters of sacred Moon Lake Chandratal in high Spiti',
    storage: {
      provider: 'cloudinary',
      publicId: 'wanderluxe/seed/chandratal_lake',
      secureUrl: 'https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?w=1200&auto=format&fit=crop&q=80',
      width: 1600,
      height: 900
    },
    geography: {
      country: 'India',
      state: 'Himachal Pradesh',
      region: 'North India',
      destination: 'Spiti Valley',
      city: 'Spiti',
      locality: 'Chandratal',
      poi: 'Chandratal Lake'
    },
    tags: ['lake', 'high altitude', 'mountains', 'reflections', 'nature', 'scenic', 'spiti'],
    featured: true
  }
];

export const CANONICAL_MEDIA_ASSETS = RAW_SEED_ASSETS.map((asset, idx) => ({
  _id: 'med_seed_' + String(idx + 1).padStart(3, '0'),
  ...asset,
  type: 'IMAGE',
  active: true,
  orientation: 'LANDSCAPE',
  locationKeys: generateLocationKeys(asset.geography, asset.title, asset.tags || []),
  usage: { itinerary: true, destination: true, tripCard: true, hero: true, gallery: true },
  source: {
    sourceType: 'PROJECT_ASSET',
    attribution: 'WanderLuxe Editorial Archive',
    license: 'Commercial Editorial License'
  },
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z')
}));

export default CANONICAL_MEDIA_ASSETS;
