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
  const config = templateKey === 'signature_luxe'
    ? { capacity: 5.4, density: 'detailed' }
    : templateKey === 'minimal'
      ? { capacity: 7.5, density: 'compact' }
      : { capacity: 6.2, density: 'balanced' };
  return chunkByWeight(items, config.capacity, (item) => itineraryWeight(item, config.density));
};

export const chunkHotels = (items, templateKey) => chunkByWeight(items, templateKey === 'minimal' ? 5 : 3.5, (item) => {
  const details = textLength(item.notes) + textLength(item.amenities?.join(' '));
  return 1.4 + Math.min(1.2, details / 500) + (item.imageUrl ? 0.35 : 0);
});

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
      words.forEach((word) => {
        if (part && part.length + word.length + 1 > maxLength) { parts.push(part); part = ''; }
        part = `${part}${part ? ' ' : ''}${word}`;
      });
    } else part = `${part}${part ? ' ' : ''}${sentence}`;
  });
  if (part) parts.push(part);
  return parts;
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
