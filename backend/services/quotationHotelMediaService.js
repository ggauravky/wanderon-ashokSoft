const HOTEL_MEDIA_CATEGORIES = new Set([
  'Hotel', 'Resort', 'Room', 'Property', 'Boutique Hotel',
  'Luxury Hotel', 'Mountain Resort', 'Beach Resort', 'Homestay', 'Villa'
]);

const clean = (value) => typeof value === 'string' ? value.trim() : '';
const firstText = (...values) => values.map(clean).find(Boolean) || '';
const finiteNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
};

export const normalizeQuotationHotelMediaInput = (body = {}) => {
  const storageInput = body.storage || {};
  const geographyInput = body.geography || body.location || {};
  const locationInput = body.location || {};
  const hotelInput = body.hotel || {};

  // A hotel-specific location is the strongest signal, followed by the
  // quotation destination and finally the explicit media destination.
  const destination = firstText(
    hotelInput.city,
    hotelInput.location,
    body.hotelCity,
    body.hotelLocation,
    geographyInput.city,
    body.quotation?.tripRequirements?.destination,
    body.quotationDestination,
    geographyInput.destination,
    locationInput.destination,
    body.destination
  );
  const secureUrl = firstText(
    storageInput.secureUrl,
    storageInput.secure_url,
    body.secureUrl,
    body.secure_url,
    body.url
  );
  const publicId = firstText(
    storageInput.publicId,
    storageInput.public_id,
    body.publicId,
    body.public_id
  );
  const categories = Array.isArray(body.categories)
    ? body.categories.map(clean).filter(Boolean).slice(0, 5)
    : ['Hotel'];
  const tags = Array.isArray(body.tags)
    ? [...new Set([...body.tags.map((value) => clean(String(value)).toLowerCase()).filter(Boolean), 'hotel', 'property'])]
    : ['hotel', 'property'];

  return {
    title: clean(body.title),
    altText: clean(body.altText),
    caption: firstText(body.caption, body.title),
    storage: {
      provider: firstText(storageInput.provider, publicId ? 'cloudinary' : 'external'),
      publicId,
      secureUrl,
      width: finiteNumber(storageInput.width ?? body.width, 1600),
      height: finiteNumber(storageInput.height ?? body.height, 900),
      format: firstText(storageInput.format, body.format, 'jpg'),
      bytes: finiteNumber(storageInput.bytes ?? body.bytes, 0)
    },
    geography: {
      country: firstText(geographyInput.country, locationInput.country, 'India'),
      state: firstText(geographyInput.state, locationInput.state),
      region: firstText(geographyInput.region, locationInput.region),
      destination,
      city: firstText(hotelInput.city, geographyInput.city, locationInput.city),
      locality: firstText(geographyInput.locality, hotelInput.location, locationInput.locality),
      poi: firstText(geographyInput.poi, locationInput.poi)
    },
    categories,
    tags,
    orientation: clean(body.orientation) || 'LANDSCAPE'
  };
};

export const isAllowedHotelMediaCategory = (category) => HOTEL_MEDIA_CATEGORIES.has(category);
