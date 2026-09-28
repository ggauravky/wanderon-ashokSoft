import mongoose from 'mongoose';
import Hotel, { MEAL_PLANS } from '../models/Hotel.js';
import MediaAsset from '../models/MediaAsset.js';
import Vendor from '../models/Vendor.js';

const error = (status, message) => Object.assign(new Error(message), { status });
export const escapeSearch = (value) => String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 80);
export const normalizedHotelName = (value) => String(value || '').trim().replace(/\s+/g, ' ').toLowerCase();
const strings = (items, max = 40) => [...new Set((Array.isArray(items) ? items : []).map((item) => String(item || '').trim()).filter(Boolean))].slice(0, max);
const mediaInput = (item) => item?.assetId ? String(item.assetId) : '';

export const hotelSalesDto = (hotel) => {
  const item = hotel?.toObject ? hotel.toObject() : hotel;
  return {
    _id: item._id, hotelCode: item.hotelCode, name: item.name, aliases: item.aliases,
    propertyType: item.propertyType, status: item.status, starRating: item.starRating,
    classification: item.classification, tags: item.tags, shortDescription: item.shortDescription,
    description: item.description, location: item.location, stayInfo: item.stayInfo,
    amenities: item.amenities, highlights: item.highlights,
    roomTypes: (item.roomTypes || []).filter((room) => room.active).map((room) => ({
      roomTypeId: room.roomTypeId, name: room.name, description: room.description,
      bedType: room.bedType, maxOccupancy: room.maxOccupancy, maxAdults: room.maxAdults,
      maxChildren: room.maxChildren, extraBedAllowed: room.extraBedAllowed,
      amenities: room.amenities, media: room.media, active: room.active
    })),
    availableMealPlans: item.availableMealPlans, media: item.media,
    catalogVersion: item.catalogVersion, updatedAt: item.updatedAt
  };
};

export const validateHotelActivation = (hotel) => {
  const problems = [];
  if (!hotel.name?.trim()) problems.push('Hotel name is required.');
  if (!hotel.location?.city?.trim() || !hotel.location?.country?.trim()) problems.push('City and country are required.');
  if (!hotel.media?.hero?.assetId) problems.push('A Media Library hero image is required.');
  if (!(hotel.roomTypes || []).some((room) => room.active && room.name?.trim())) problems.push('At least one active room type is required.');
  if (!(hotel.availableMealPlans || []).length) problems.push('At least one meal plan is required.');
  return problems;
};

export const normalizeHotelInput = async (input, { existing = null, actorId } = {}) => {
  const allowed = ['name', 'aliases', 'propertyType', 'starRating', 'classification', 'tags', 'shortDescription', 'description', 'location', 'stayInfo', 'amenities', 'highlights', 'roomTypes', 'availableMealPlans', 'ratePlans', 'media', 'contact', 'vendorId', 'internalNotes'];
  const next = Object.fromEntries(allowed.filter((key) => Object.hasOwn(input, key)).map((key) => [key, input[key]]));
  if (Object.hasOwn(next, 'name')) {
    next.name = String(next.name || '').trim();
    next.normalizedName = normalizedHotelName(next.name);
  }
  for (const key of ['aliases', 'tags', 'amenities', 'highlights']) if (Object.hasOwn(next, key)) next[key] = strings(next[key]);
  if (Object.hasOwn(next, 'availableMealPlans')) {
    next.availableMealPlans = strings(next.availableMealPlans).filter((plan) => MEAL_PLANS.includes(plan));
  }
  if (Object.hasOwn(next, 'roomTypes')) {
    const oldRooms = new Map((existing?.roomTypes || []).map((room) => [room.roomTypeId, room]));
    next.roomTypes = (Array.isArray(next.roomTypes) ? next.roomTypes : []).slice(0, 30).map((room) => ({
      ...room,
      roomTypeId: oldRooms.has(room.roomTypeId) ? room.roomTypeId : undefined,
      media: (room.media || []).slice(0, 8)
    }));
  }
  if (Object.hasOwn(next, 'ratePlans')) {
    const oldRates = new Map((existing?.ratePlans || []).map((rate) => [rate.ratePlanId, rate]));
    next.ratePlans = (Array.isArray(next.ratePlans) ? next.ratePlans : []).slice(0, 60).map((rate) => ({
      ...rate, ratePlanId: oldRates.has(rate.ratePlanId) ? rate.ratePlanId : undefined
    }));
  }
  if (Object.hasOwn(next, 'media')) {
    next.media = { hero: next.media?.hero || null, gallery: (next.media?.gallery || []).slice(0, 12) };
  }
  if (Object.hasOwn(next, 'vendorId') && next.vendorId) {
    if (!mongoose.isValidObjectId(next.vendorId) || !(await Vendor.exists({ _id: next.vendorId, types: 'HOTEL' }))) {
      throw error(422, 'Linked vendor must be an existing hotel supplier.');
    }
  }
  const combined = { ...(existing?.toObject?.() || {}), ...next };
  const references = [combined.media?.hero, ...(combined.media?.gallery || []), ...(combined.roomTypes || []).flatMap((room) => room.media || [])].filter(Boolean);
  const assetIds = [...new Set(references.map(mediaInput))];
  if (references.some((item) => !mongoose.isValidObjectId(mediaInput(item)))) throw error(422, 'Choose Hotel images from the Media Library.');
  const assets = assetIds.length ? await MediaAsset.find({ _id: { $in: assetIds }, active: true, type: 'IMAGE' }).lean() : [];
  if (assets.length !== assetIds.length) throw error(422, 'One or more Hotel images are not active Media Library assets.');
  const byId = new Map(assets.map((asset) => [String(asset._id), asset]));
  const trusted = (item) => {
    if (!item) return null;
    const asset = byId.get(mediaInput(item));
    return { assetId: asset._id, publicId: asset.storage.publicId || '', secureUrl: asset.storage.secureUrl, altText: asset.altText || '', caption: asset.caption || '' };
  };
  if (Object.hasOwn(next, 'media')) next.media = { hero: trusted(next.media.hero), gallery: next.media.gallery.map(trusted) };
  if (Object.hasOwn(next, 'roomTypes')) next.roomTypes = next.roomTypes.map((room) => ({ ...room, media: room.media.map(trusted) }));
  if (Object.hasOwn(next, 'ratePlans')) {
    const roomIds = new Set((next.roomTypes || existing?.roomTypes || []).map((room) => room.roomTypeId));
    // New room IDs are assigned by Mongoose before rate plans can refer to them.
    if (next.ratePlans.some((rate) => rate.roomTypeId && !roomIds.has(rate.roomTypeId))) throw error(422, 'Reference rate must use a saved room type.');
    const availableMeals = new Set(next.availableMealPlans || existing?.availableMealPlans || []);
    if (next.ratePlans.some((rate) => !availableMeals.has(rate.mealPlan))) throw error(422, 'Reference rate meal plan must be available at this hotel.');
    if (next.ratePlans.some((rate) => rate.validFrom && rate.validTo && new Date(rate.validFrom) > new Date(rate.validTo))) throw error(422, 'Reference rate end date must follow its start date.');
  }
  next.updatedBy = actorId;
  return next;
};

const mealLabel = { EP: 'EP (Room Only)', CP: 'CP (Breakfast)', MAP: 'MAP (Breakfast + Dinner)', AP: 'AP (All Meals)' };
export const resolveCatalogHotelOptions = async (options, savedOptions = [], { admin = false } = {}) => {
  if (!Array.isArray(options)) return options;
  const savedById = new Map(savedOptions.map((item) => [String(item.optionId), item.toObject?.() || item]));
  const requested = [...new Set(options.filter((item) => item.catalogHotelId).map((item) => String(item.catalogHotelId)))];
  if (requested.some((value) => !mongoose.isValidObjectId(value))) throw error(422, 'Invalid catalog hotel selection.');
  const hotels = requested.length ? await Hotel.find({ _id: { $in: requested } }).lean() : [];
  const byId = new Map(hotels.map((hotel) => [String(hotel._id), hotel]));
  return options.map((item) => {
    const saved = savedById.get(String(item.optionId));
    if (saved?.catalogHotelId && !item.catalogHotelId) throw error(409, 'Remove the catalog hotel option before adding a manual hotel.');
    if (!item.catalogHotelId) {
      if (item.sourceKind === 'HOTEL_CATALOG') throw error(422, 'Catalog hotel identity is missing.');
      return item;
    }
    if (saved?.catalogHotelId && String(saved.catalogHotelId) !== String(item.catalogHotelId)) throw error(409, 'Remove the old hotel option before selecting a different catalog property.');
    const hotel = byId.get(String(item.catalogHotelId));
    if (!hotel) throw error(404, 'Catalog hotel no longer exists.');
    const refresh = item.refreshFromCatalog === true;
    if (saved?.catalogHotelId && !refresh) {
      return { ...saved, rooms: item.rooms, occupancy: item.occupancy, mealPlan: item.mealPlan,
        checkIn: item.checkIn, checkOut: item.checkOut, nights: item.nights, label: item.label,
        notes: item.notes, selected: item.selected, roomType: saved.roomType,
        catalogChanged: hotel.catalogVersion !== saved.catalogVersion };
    }
    if (hotel.status !== 'ACTIVE') throw error(409, 'This hotel is not active for new quotation selections.');
    const room = hotel.roomTypes.find((value) => value.roomTypeId === item.catalogRoomTypeId && value.active);
    if (!room) throw error(422, 'Select an active room type for this hotel.');
    if (!hotel.availableMealPlans.includes(item.catalogMealPlan)) throw error(422, 'Select an available meal plan for this hotel.');
    const snapshot = {
      ...item, sourceKind: 'HOTEL_CATALOG', reviewStatus: 'REVIEWED',
      catalogHotelId: hotel._id, catalogHotelCode: hotel.hotelCode, catalogVersion: hotel.catalogVersion,
      catalogRoomTypeId: room.roomTypeId, catalogMealPlan: item.catalogMealPlan,
      hotelName: hotel.name, city: hotel.location.city, location: [hotel.location.locality, hotel.location.city, hotel.location.state].filter(Boolean).join(', '),
      category: hotel.classification || hotel.propertyType.replaceAll('_', ' '), roomType: room.name,
      mealPlan: mealLabel[item.catalogMealPlan], imageUrl: hotel.media?.hero?.secureUrl || '',
      gallery: (hotel.media?.gallery || []).slice(0, 8).map((media) => ({ url: media.secureUrl, altText: media.altText, caption: media.caption })),
      amenities: hotel.amenities || [], availabilityStatus: saved?.availabilityStatus || 'UNCONFIRMED', catalogChanged: false,
      costPerNight: saved?.costPerNight || 0, pricePerNight: saved?.pricePerNight || 0,
      taxRate: saved?.taxRate || 0, totalCost: saved?.totalCost || 0, totalPrice: saved?.totalPrice || 0,
      catalogRatePlanId: saved?.catalogRoomTypeId === room.roomTypeId && saved?.catalogMealPlan === item.catalogMealPlan
        ? saved?.catalogRatePlanId || '' : ''
    };
    if (admin && item.applyCatalogRate === true) {
      const rate = hotel.ratePlans.find((value) => value.ratePlanId === item.catalogRatePlanId && value.active && value.roomTypeId === room.roomTypeId && value.mealPlan === item.catalogMealPlan);
      if (!rate) throw error(422, 'Select an active reference rate for this room and meal plan.');
      const date = item.checkIn ? new Date(item.checkIn) : null;
      if (!date || Number.isNaN(date.getTime())) throw error(422, 'A check-in date is required to apply a reference rate.');
      if ((rate.validFrom && date < new Date(rate.validFrom)) || (rate.validTo && date > new Date(rate.validTo)) || Number(item.nights || 1) < rate.minNights) throw error(422, 'Reference rate is not valid for this stay.');
      snapshot.costPerNight = rate.supplierRatePerNight;
      snapshot.pricePerNight = rate.customerReferenceRatePerNight;
      snapshot.taxRate = rate.taxPercent;
      snapshot.totalCost = snapshot.costPerNight * Number(item.rooms || 1) * Number(item.nights || 1);
      snapshot.totalPrice = snapshot.pricePerNight * Number(item.rooms || 1) * Number(item.nights || 1);
      snapshot.catalogRatePlanId = rate.ratePlanId;
    }
    return snapshot;
  });
};
