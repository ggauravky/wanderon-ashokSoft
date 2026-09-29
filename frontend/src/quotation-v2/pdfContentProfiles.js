export const PDF_CONTENT_PROFILES = Object.freeze({
  signature_luxe: Object.freeze({
    level: 'DETAILED',
    density: 'FULL',
    itineraryMode: 'FULL',
    itineraryMedia: 'RICH',
    hotelMode: 'FULL',
    hotelGalleryLimit: 3,
    transportMode: 'FULL',
    transportMediaLimit: 2,
    activityMode: 'DETAILED',
    addOnMode: 'DETAILED',
    documentMode: 'RICH',
    policyMode: 'FULL',
    inclusionMode: 'FULL',
    pricingMode: 'FULL'
  }),
  journey: Object.freeze({
    level: 'BALANCED',
    density: 'BALANCED',
    itineraryMode: 'BALANCED',
    itineraryMedia: 'LIMITED',
    hotelMode: 'BALANCED',
    hotelGalleryLimit: 0,
    transportMode: 'BALANCED',
    transportMediaLimit: 1,
    activityMode: 'GROUPED',
    addOnMode: 'COMPACT',
    documentMode: 'IMPORTANT_PREVIEWS',
    policyMode: 'FULL_COMPACT',
    inclusionMode: 'COMPACT',
    pricingMode: 'FULL'
  }),
  minimal: Object.freeze({
    level: 'COMPACT',
    density: 'COMPACT',
    itineraryMode: 'SUMMARY',
    itineraryMedia: 'NONE',
    hotelMode: 'MATRIX',
    hotelGalleryLimit: 0,
    transportMode: 'MATRIX',
    transportMediaLimit: 0,
    activityMode: 'SUMMARY',
    addOnMode: 'SUMMARY',
    documentMode: 'REGISTER',
    policyMode: 'COMPACT',
    inclusionMode: 'COMPACT',
    pricingMode: 'COMPACT'
  })
});

const clean = (value) => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';

export function firstSentences(value, count = 1) {
  const text = clean(value);
  if (!text || count < 1) return '';
  const sentences = text.match(/[^.!?]+(?:[.!?]+|$)/g) || [text];
  return sentences.slice(0, count).map((sentence) => sentence.trim()).filter(Boolean).join(' ');
}

export const buildItinerarySummaryText = (day) => {
  const parts = [
    day.destination,
    ...(day.activityHighlights || []).slice(0, 2),
    day.transferDetails,
    day.stay ? `Stay: ${day.stay}` : ''
  ].filter(Boolean);
  return parts.join(' · ');
};

const withHotelMediaBudget = (hotel, profile) => {
  if (profile.hotelMode === 'MATRIX') {
    return {
      ...hotel,
      heroImage: null,
      gallery: [],
      notes: '',
      amenities: (hotel.amenities || []).slice(0, 4)
    };
  }
  const heroUrl = hotel.heroImage?.url;
  const secondary = (hotel.gallery || []).filter((image) => image?.url && image.url !== heroUrl).slice(0, profile.hotelGalleryLimit);
  return {
    ...hotel,
    gallery: [hotel.heroImage, ...secondary].filter(Boolean),
    amenities: profile.density === 'BALANCED' ? (hotel.amenities || []).slice(0, 6) : (hotel.amenities || []),
    notes: profile.density === 'BALANCED' ? firstSentences(hotel.notes, 2) : hotel.notes
  };
};

const withItineraryProfile = (day, profile) => {
  if (profile.itineraryMode === 'SUMMARY') {
    return {
      ...day,
      summaryText: buildItinerarySummaryText(day),
      description: buildItinerarySummaryText(day),
      morning: '',
      afternoon: '',
      evening: '',
      coverMedia: null,
      galleryMedia: []
    };
  }
  if (profile.itineraryMode === 'BALANCED') {
    return {
      ...day,
      description: firstSentences(day.description, 2),
      morning: firstSentences(day.morning, 1),
      afternoon: firstSentences(day.afternoon, 1),
      evening: firstSentences(day.evening, 1),
      galleryMedia: []
    };
  }
  return {
    ...day,
    galleryMedia: (day.galleryMedia || []).slice(0, 3)
  };
};

const withTransportProfile = (item, profile) => ({
  ...item,
  media: (item.media || []).slice(0, profile.transportMediaLimit),
  notes: profile.density === 'FULL' ? item.notes : profile.density === 'BALANCED' ? firstSentences(item.notes, 2) : ''
});

const withExperienceProfile = (item, profile) => ({
  ...item,
  description: profile.activityMode === 'DETAILED'
    ? item.description
    : profile.activityMode === 'GROUPED'
      ? firstSentences(item.description, 2)
      : ''
});

export function buildTemplatePdfModel(baseModel = {}, templateKey = 'journey') {
  const profile = PDF_CONTENT_PROFILES[templateKey] || PDF_CONTENT_PROFILES.journey;
  const filteredAddOns = (baseModel.addOns || []).filter((item) => item.selected);
  return {
    ...baseModel,
    templateKey,
    pdfProfile: profile,
    journey: {
      ...baseModel.journey,
      personalNote: profile.density === 'FULL'
        ? baseModel.journey?.personalNote
        : firstSentences(baseModel.journey?.personalNote, profile.density === 'BALANCED' ? 2 : 1),
      specialRequests: profile.density === 'FULL'
        ? baseModel.journey?.specialRequests
        : firstSentences(baseModel.journey?.specialRequests, profile.density === 'BALANCED' ? 2 : 1),
      secondaryImages: profile.density === 'FULL'
        ? (baseModel.journey?.secondaryImages || []).slice(0, 4)
        : profile.density === 'BALANCED'
          ? (baseModel.journey?.secondaryImages || []).slice(0, 1)
          : []
    },
    itinerary: (baseModel.itinerary || []).map((day) => withItineraryProfile(day, profile)),
    hotels: (baseModel.hotels || []).map((hotel) => withHotelMediaBudget(hotel, profile)),
    transport: (baseModel.transport || []).map((item) => withTransportProfile(item, profile)),
    activities: (baseModel.activities || []).map((item) => withExperienceProfile(item, profile)),
    addOns: filteredAddOns.map((item) => withExperienceProfile(item, profile))
  };
}
