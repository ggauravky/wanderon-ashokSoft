/**
 * =============================================================================
 * HOME DISCOVERY SECTIONS CONFIGURATION
 * Authoritative display limits, section metadata, and canonical route mappings
 * =============================================================================
 */

export const HOME_SECTION_LIMITS = {
  community: 6,
  india: 8,
  international: 6,
  weekend: 4
};

export const HOME_SECTIONS_META = {
  community: {
    id: 'community-trips',
    eyebrow: 'Fixed Batch Departures',
    title: 'Upcoming Adventures',
    description: 'Social group expeditions with like-minded travelers and certified trip leaders.',
    viewAllBaseLabel: 'Community Departures',
    viewAllPath: '/community-trips',
    limit: HOME_SECTION_LIMITS.community,
    bgClass: 'bg-transparent'
  },
  india: {
    id: 'india-circuits',
    eyebrow: 'Domestic Escapes',
    title: 'Discover India',
    description: 'From high-altitude Himalayan passes to pristine Northeast valleys and coastal backwaters.',
    viewAllBaseLabel: 'India Trips',
    viewAllPath: '/trips/india',
    limit: HOME_SECTION_LIMITS.india,
    bgClass: 'bg-slate-100/70 border-y border-slate-200/80'
  },
  international: {
    id: 'international-escapes',
    eyebrow: 'Global Adventures',
    title: 'Beyond Borders',
    description: 'Seamless visa guidance, boutique private villas & certified local tour specialists.',
    viewAllBaseLabel: 'International Trips',
    viewAllPath: '/trips/international',
    limit: HOME_SECTION_LIMITS.international,
    bgClass: 'bg-transparent'
  },
  weekend: {
    id: 'weekend-getaways',
    eyebrow: 'Quick Breaks',
    title: 'Quick Escapes',
    description: 'Overnight departures from Delhi & Chandigarh. Zero leave needed.',
    viewAllBaseLabel: 'Weekend Getaways',
    viewAllPath: '/weekend-trips',
    limit: HOME_SECTION_LIMITS.weekend,
    bgClass: 'bg-slate-100/70 border-y border-slate-200/80'
  }
};

export default {
  HOME_SECTION_LIMITS,
  HOME_SECTIONS_META
};
