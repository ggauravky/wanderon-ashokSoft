const textLength = (value) => String(value || '').trim().length;

export const chunkByWeight = (items = [], capacity = 5, weightOf = () => 1) => {
  const chunks = [];
  let chunk = [];
  let weight = 0;
  items.forEach((item) => {
    const itemWeight = Math.max(0.5, weightOf(item));
    if (chunk.length && weight + itemWeight > capacity) {
      chunks.push(chunk);
      chunk = [];
      weight = 0;
    }
    chunk.push(item);
    weight += itemWeight;
  });
  if (chunk.length) chunks.push(chunk);
  return chunks;
};

export const itineraryWeight = (day = {}, density = 'balanced') => {
  const length = [day.description, day.morning, day.afternoon, day.evening, day.transferDetails, ...(day.activityHighlights || [])]
    .reduce((total, value) => total + textLength(value), 0);
  const imageWeight = day.coverMedia?.url ? 0.5 : 0;
  const divisor = density === 'detailed' ? 430 : density === 'compact' ? 900 : 620;
  return 1 + Math.min(2.5, length / divisor) + imageWeight;
};

export const chunkItinerary = (items, templateKey) => {
  const fragments = items.flatMap(splitItineraryDay);
  const capacity = templateKey === 'minimal' ? 5.2 : templateKey === 'signature_luxe' ? 3.8 : 4.2;
  const density = templateKey === 'minimal' ? 'compact' : templateKey === 'signature_luxe' ? 'detailed' : 'balanced';
  return chunkByWeight(fragments, capacity, (item) => itineraryWeight(item, density));
};

export const chunkHotels = (items, templateKey) => {
  const galleryLimit = templateKey === 'signature_luxe' ? 3 : templateKey === 'minimal' ? 1 : 2;
  const fragments = items.flatMap((hotel) => splitHotel(hotel, galleryLimit));
  return chunkByWeight(fragments, templateKey === 'signature_luxe' ? 1 : 2.4, (item) => item.continued ? 1.1 : 1.5 + (item.heroImage ? 0.5 : 0));
};

export const chunkTransport = (items, templateKey) => chunkByWeight(items, templateKey === 'signature_luxe' ? 5 : 6.5, (item) => {
  const details = textLength(item.notes) + textLength(item.baggage) + textLength(item.seatDetails);
  return 1 + Math.min(1.4, details / 500);
});

const splitText = (value, maxLength = 1150) => {
  const source = String(value || '').trim();
  if (!source || source.length <= maxLength) return source ? [source] : [];
  const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);
  const parts = [];
  let part = '';
  sentences.forEach((sentence) => {
    if (part && part.length + sentence.length + 1 > maxLength) { parts.push(part); part = ''; }
    if (sentence.length > maxLength) {
      const words = sentence.split(/\s+/);
      words.flatMap((word) => word.length > maxLength ? word.match(new RegExp(`.{1,${maxLength}}`, 'g')) : [word]).forEach((word) => {
        if (part && part.length + word.length + 1 > maxLength) { parts.push(part); part = ''; }
        part = `${part}${part ? ' ' : ''}${word}`;
      });
    } else part = `${part}${part ? ' ' : ''}${sentence}`;
  });
  if (part) parts.push(part);
  return parts;
};

export const splitItineraryDay = (day) => {
  const fields = ['description', 'morning', 'afternoon', 'evening', 'transferDetails'];
  const segments = fields.flatMap((field) => splitText(day[field], 550).map((value) => ({ field, value })));
  const fragmentBase = day.id || day.day || 'day';
  if (!segments.length) return [{ ...day, fragmentId: `${fragmentBase}-0` }];
  const empty = () => ({ ...day, description: '', morning: '', afternoon: '', evening: '', transferDetails: '', activityHighlights: [] });
  const output = [];
  let current = empty();
  let length = 0;
  segments.forEach(({ field, value }) => {
    if (length && length + value.length > 750) {
      output.push(current);
      current = { ...empty(), continued: true, coverMedia: null, stay: '', mealsIncluded: [] };
      length = 0;
    }
    current[field] = [current[field], value].filter(Boolean).join('\n');
    length += value.length;
  });
  current.activityHighlights = day.activityHighlights || [];
  output.push(current);
  return output.map((fragment, index) => ({ ...fragment, fragmentId: `${fragmentBase}-${index}` }));
};

export const splitHotel = (hotel, galleryLimit = 2) => {
  const notes = splitText(hotel.notes, 700);
  const amenities = chunkByWeight(hotel.amenities || [], 12, () => 1);
  const gallery = (hotel.gallery || []).filter((image) => image.url !== hotel.heroImage?.url).slice(0, galleryLimit);
  const galleryChunks = gallery.length ? [gallery] : [];
  const parts = Math.max(1, notes.length, amenities.length, galleryChunks.length);
  return Array.from({ length: parts }, (_, index) => ({
    ...hotel,
    id: index ? `${hotel.id}-continued-${index}` : hotel.id,
    continued: index > 0,
    heroImage: index ? null : hotel.heroImage,
    gallery: galleryChunks[index] || [],
    notes: notes[index] || '',
    amenities: amenities[index] || [],
    documents: index ? [] : hotel.documents
  }));
};

export const chunkPolicyEntries = (entries = [], capacity = 2500) => {
  const expanded = entries.flatMap(([key, value]) => {
    if (Array.isArray(value)) {
      return chunkByWeight(value, 9, (item) => 1 + Math.min(2, textLength(item) / 180))
        .map((items, index) => [`${key}${index ? 'Continued' : ''}`, items]);
    }
    return splitText(value).map((part, index) => [`${key}${index ? 'Continued' : ''}`, part]);
  });
  return chunkByWeight(expanded, capacity, ([, value]) => Array.isArray(value)
    ? Math.max(350, value.reduce((total, item) => total + textLength(item), 0))
    : Math.max(250, textLength(value)));
};
