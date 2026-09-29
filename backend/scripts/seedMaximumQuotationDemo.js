import 'dotenv/config';
import mongoose from 'mongoose';
import { pathToFileURL } from 'node:url';
import connectDB from '../config/db.js';
import Hotel from '../models/Hotel.js';
import MediaAsset, { generateLocationKeys } from '../models/MediaAsset.js';
import Quotation from '../models/Quotation.js';
import QuotationApprovalVerification from '../models/QuotationApprovalVerification.js';
import QuotationEvent from '../models/QuotationEvent.js';
import QuotationRevision from '../models/QuotationRevision.js';
import QuotationShare from '../models/QuotationShare.js';
import User from '../models/User.js';
import { generateQuotationNumber } from '../controllers/quotationV2Controller.js';
import { DEMO_HOSTEL_NAMES } from './seedHostelCatalogDemo.js';
import { resolveCatalogHotelOptions } from '../services/hotelCatalogService.js';
import {
  buildPublicRevisionDto,
  buildRevisionSnapshot,
  calculateComponentReference,
  validateQuotationV2
} from '../services/quotationV2Service.js';
import { buildQuotationPresentationModel } from '../../frontend/src/quotation-v2/buildQuotationPresentationModel.js';
import { deleteMedia, getMediaStorageStatus, uploadDocument, uploadImage } from '../utils/cloudinaryService.js';
import { assertDemoSeedAllowed } from '../utils/mediaStoragePolicy.js';

export const DEMO_CUSTOMER_EMAIL = 'quotation-demo@wanderluxe.test';
export const DEMO_JOURNEY_TITLE = 'Himachal Backpacker Grand Circuit - Submission Demo';
const DEMO_MEDIA_TAG = 'seed-maximum-quotation';

const findSeedActor = async () => (await User.findOne({ role: 'super_admin' }).sort({ createdAt: 1 }))
  || (await User.findOne({ role: 'admin' }).sort({ createdAt: 1 }));

const ticketHtml = ({ label, reference, route, accent }) => `<!doctype html><html><head><style>
  *{box-sizing:border-box}body{margin:0;padding:30px;background:#eef2f7;font-family:Arial,sans-serif;color:#172033}
  .ticket{width:920px;height:430px;background:white;border-radius:28px;overflow:hidden;border:3px solid ${accent};display:grid;grid-template-columns:1fr 245px;box-shadow:0 18px 45px #17203326}
  .main{padding:38px}.brand{font-size:18px;font-weight:800;letter-spacing:3px;color:${accent}}h1{font-size:38px;margin:18px 0 10px}.route{font-size:25px;font-weight:700}.meta{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:34px}.meta div{border-top:1px solid #d8dee8;padding-top:10px}.meta small{display:block;color:#64748b;text-transform:uppercase;letter-spacing:1px}.stub{background:${accent};color:white;padding:32px 24px;display:flex;flex-direction:column;justify-content:space-between}.stub strong{font-size:24px}.demo{font-size:14px;font-weight:700;border:1px solid #ffffff80;padding:9px;border-radius:10px;text-align:center}
  </style></head><body><section class="ticket"><div class="main"><div class="brand">WANDERLUXE DEMO</div><h1>${label}</h1><div class="route">${route}</div><div class="meta"><div><small>Traveler</small><b>Arjun Mehra</b></div><div><small>Reference</small><b>${reference}</b></div><div><small>Travel date</small><b>18 Oct 2026</b></div></div></div><aside class="stub"><strong>${reference}</strong><div class="demo">SUBMISSION DEMO<br/>NOT VALID FOR TRAVEL</div></aside></section></body></html>`;

const createTicketBuffers = async () => {
  const { chromium } = await import('playwright-chromium');
  const executablePath = process.env.CHROME_EXECUTABLE_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : undefined);
  const browser = await chromium.launch({ ...(executablePath ? { executablePath } : {}), headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 980, height: 500 } });
    await page.setContent(ticketHtml({ label: 'Train Ticket', reference: 'DEMO-TRAIN-2026', route: 'Delhi to Chandigarh', accent: '#0f766e' }));
    const trainPng = await page.locator('.ticket').screenshot({ type: 'png' });
    await page.setContent(ticketHtml({ label: 'Volvo Bus Ticket', reference: 'DEMO-BUS-2026', route: 'Dharamshala to Delhi', accent: '#9a3412' }));
    const busPng = await page.locator('.ticket').screenshot({ type: 'png' });
    await page.setContent(`${ticketHtml({ label: 'Travel Voucher', reference: 'DEMO-VOUCHER-2026', route: 'Himachal Grand Circuit', accent: '#4338ca' })}<style>@page{size:A4;margin:18mm}.ticket{width:100%;height:360px}</style>`);
    const voucherPdf = await page.pdf({ format: 'A4', printBackground: true });
    return { trainPng, busPng, voucherPdf };
  } finally {
    await browser.close();
  }
};

const upsertTicketAsset = async ({ key, title, type, mimeType, buffer, upload, actor }) => {
  const existing = await MediaAsset.findOne({ tags: DEMO_MEDIA_TAG, title });
  if (existing?.storage?.secureUrl) return { asset: existing, mimeType };
  const result = await upload(buffer);
  const storage = {
    provider: result.provider || (result.source === 'local_fallback' ? 'local' : 'cloudinary'),
    publicId: result.publicId || result.public_id || '', secureUrl: result.secureUrl || result.secure_url,
    width: result.width || (type === 'IMAGE' ? 920 : 0), height: result.height || (type === 'IMAGE' ? 430 : 0),
    format: result.format || key.split('.').pop(), bytes: result.bytes || buffer.length
  };
  const geography = { country: 'India', state: 'Himachal Pradesh', region: 'North India', destination: 'Himachal Pradesh', city: 'Manali', locality: '', poi: '' };
  const asset = await MediaAsset.findOneAndUpdate(
    { tags: DEMO_MEDIA_TAG, title },
    {
      type, title, altText: `${title} - submission demo only`, caption: 'Synthetic submission demo document; not valid for travel.',
      storage, geography, locationKeys: generateLocationKeys(geography, title, ['submission-demo', DEMO_MEDIA_TAG]),
      tags: ['submission-demo', 'demo-seed', DEMO_MEDIA_TAG], categories: ['Ticket', 'Submission Demo'],
      orientation: 'LANDSCAPE', usage: { itinerary: false, destination: false, tripCard: false, hero: false, hotel: false, gallery: false },
      source: { sourceType: 'ADMIN_UPLOAD', attribution: 'WanderLuxe Submission Demo', sourceUrl: '', license: 'Synthetic demo asset' },
      active: true, featured: false, createdBy: actor._id
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );
  return { asset, mimeType };
};

const ensureTicketAssets = async (actor) => {
  const titles = ['[SEED] Submission Demo Train Ticket', '[SEED] Submission Demo Bus Ticket', '[SEED] Submission Demo Travel Voucher'];
  const existing = await MediaAsset.find({ tags: DEMO_MEDIA_TAG, title: { $in: titles }, active: true });
  if (existing.length === titles.length) {
    const byTitle = new Map(existing.map((asset) => [asset.title, asset]));
    return { train: byTitle.get(titles[0]), bus: byTitle.get(titles[1]), voucher: byTitle.get(titles[2]) };
  }
  const buffers = await createTicketBuffers();
  const [train, bus, voucher] = await Promise.all([
    upsertTicketAsset({ key: 'demo-train-ticket.png', title: titles[0], type: 'IMAGE', mimeType: 'image/png', buffer: buffers.trainPng, upload: (buffer) => uploadImage(buffer, 'demo-train-ticket.png', 'wanderluxe/submission-demo/tickets'), actor }),
    upsertTicketAsset({ key: 'demo-bus-ticket.png', title: titles[1], type: 'IMAGE', mimeType: 'image/png', buffer: buffers.busPng, upload: (buffer) => uploadImage(buffer, 'demo-bus-ticket.png', 'wanderluxe/submission-demo/tickets'), actor }),
    upsertTicketAsset({ key: 'demo-travel-voucher.pdf', title: titles[2], type: 'DOCUMENT', mimeType: 'application/pdf', buffer: buffers.voucherPdf, upload: (buffer) => uploadDocument(buffer, 'demo-travel-voucher.pdf', 'wanderluxe/submission-demo/documents', 'application/pdf'), actor })
  ]);
  return { train: train.asset, bus: bus.asset, voucher: voucher.asset };
};

const mediaItem = (asset) => ({
  id: String(asset._id), url: asset.storage.secureUrl, altText: asset.altText, caption: asset.caption,
  width: asset.storage.width || 1600, height: asset.storage.height || 900
});

const attachment = ({ id, category = 'GENERAL', sectionType = 'GENERAL', sectionId = '', title, asset, mimeType, visibility, pdfDisplayMode, bookingReference = '', passengerName = '' }) => ({
  id, category, sectionType, sectionId, title, fileName: title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + (mimeType === 'application/pdf' ? '.pdf' : '.png'),
  mimeType, size: asset.storage.bytes || 0, storageProvider: asset.storage.provider, publicId: asset.storage.publicId,
  secureUrl: asset.storage.secureUrl, visibility, pdfDisplayMode, bookingReference, passengerName
});

const buildItinerary = (media) => {
  const days = [
    ['Delhi to Chandigarh to Manali', 'Manali', 'Begin with a morning train to Chandigarh and continue by private road transfer to Old Manali. The schedule keeps mountain driving in daylight where practical.', 'Board the train from Delhi.', 'Meet the road-transfer team in Chandigarh.', 'Check in, orientation and a relaxed common-lounge evening.', 'Delhi - Chandigarh train; Chandigarh - Manali private SUV.', ['Scenic rail journey', 'Mountain road transfer']],
    ['Old Manali and Local Culture', 'Manali', 'Explore Old Manali at an unhurried pace with time for heritage lanes, cafes and the riverside. The day balances guided context with independent discovery.', 'Heritage walk around Old Manali.', 'Cafe break and riverside exploration.', 'Free time in the social hostel spaces.', 'Local movement by private vehicle and walking.', ['Old Manali', 'Local culture', 'Cafe time']],
    ['Solang Valley and Atal Tunnel Experience', 'Manali', 'Travel toward Solang Valley and the Atal Tunnel for expansive mountain views and weather-dependent experiences. Frequent scenic pauses keep the day comfortable for all travelers.', 'Drive to Solang Valley.', 'Atal Tunnel and accessible viewpoints.', 'Return to Manali before late evening.', 'Private SUV with planned comfort stops.', ['Solang Valley', 'Atal Tunnel', 'Photography']],
    ['Manali to Kasol', 'Kasol', 'Follow the Kullu and Parvati valleys toward Kasol, pausing at safe viewpoints and local refreshment stops. Arrive with enough time to settle beside the river.', 'Breakfast and checkout.', 'Daylight drive through Kullu Valley.', 'Kasol orientation and riverside time.', 'Private SUV from Manali to Kasol.', ['Kullu Valley', 'Parvati River']],
    ['Kasol, Chalal and Parvati Valley', 'Kasol', 'Enjoy a flexible valley day combining a gentle riverside walk, the route toward Chalal and generous free time. Walking can be shortened for the senior traveler.', 'Kasol market and riverside.', 'Optional shortened Chalal walk.', 'Cafe time and bonfire subject to property conditions.', 'Local road transfers with a guided walk.', ['Chalal Village', 'Riverside walk', 'Local cafes']],
    ['Kasol to Dharamshala', 'Dharamshala', 'Continue by private SUV to Dharamshala with daytime breaks along the route. The evening is intentionally light after the intercity transfer.', 'Early breakfast and checkout.', 'Scenic transfer with comfort stops.', 'Check in near McLeod Ganj.', 'Private SUV from Kasol to Dharamshala.', ['Himachal road journey', 'Dhauladhar arrival']],
    ['McLeod Ganj and Dharamkot', 'Dharamshala', 'Discover monasteries, market lanes and the quieter side of Dharamkot. The route emphasizes culture, mountain views and manageable walking sections.', 'Monastery circuit and local context.', 'Dharamkot viewpoints and cafe time.', 'Sunset experience subject to weather.', 'Local private transfer and walking.', ['McLeod Ganj', 'Dharamkot', 'Monastery circuit']],
    ['Dharamshala to Delhi', 'Delhi', 'Conclude with a relaxed morning, final shopping time and a confirmed Volvo departure toward Delhi. Assistance is included through the boarding point.', 'Breakfast and checkout.', 'Free time and boarding assistance.', 'Overnight Volvo journey toward Delhi.', 'Private drop followed by Volvo bus.', ['Local shopping', 'Departure assistance']]
  ];
  return days.map((day, index) => ({
    day: index + 1, title: day[0], locationName: day[1], destination: day[1], description: day[2],
    morning: day[3], afternoon: day[4], evening: day[5], stay: index < 3 ? DEMO_HOSTEL_NAMES[0] : index < 5 ? DEMO_HOSTEL_NAMES[1] : index < 7 ? DEMO_HOSTEL_NAMES[2] : 'Overnight Volvo / journey concludes',
    mealsIncluded: index === 0 || index === 7 ? ['Breakfast'] : ['Breakfast'], transferDetails: day[6], activityHighlights: day[7],
    coverMedia: mediaItem(media[index % media.length]), coverMediaAssetId: media[index % media.length]._id,
    galleryMedia: index % 2 === 0 ? [mediaItem(media[(index + 1) % media.length])] : [], mediaSelectionMode: 'MANUAL'
  }));
};

const buildTransport = (ticketAssets, media) => [
  {
    optionId: 'seed_transport_train', sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', mode: 'TRAIN', type: 'Intercity Train', title: 'Delhi to Chandigarh Train', vehicle: 'Air-conditioned Chair Car', pickup: 'New Delhi Railway Station', drop: 'Chandigarh Railway Station',
    route: { from: 'Delhi', to: 'Chandigarh', pickupPoint: 'New Delhi Railway Station', dropPoint: 'Chandigarh Railway Station' }, schedule: { departureDate: '2026-10-18', departureTime: '06:40', arrivalDate: '2026-10-18', arrivalTime: '10:05' },
    reference: { trainNumber: 'DEMO-12011', pnr: 'DEMO-PNR-001', bookingReference: 'DEMO-TRAIN-2026' }, cabinClass: 'AC Chair Car', seatDetails: 'Demo seats: C1 21-25', baggage: { cabin: 'One small cabin bag per traveler', checkIn: 'As permitted by the rail operator' },
    capacity: 5, quantity: 5, pricingType: 'PER_PERSON', unitCost: 900, unitPrice: 1250, totalCost: 4500, totalPrice: 6250, taxRate: 5,
    inclusions: ['Reserved demo seating', 'Station boarding assistance'], notes: 'Submission demo transport record; not a valid booking.', selected: true, vehicleMedia: [],
    documents: [{ ...attachment({ id: 'seed_train_ticket', category: 'TRAIN_TICKET', sectionType: 'TRANSPORT', sectionId: 'seed_transport_train', title: 'Demo Train Ticket', asset: ticketAssets.train, mimeType: 'image/png', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW', bookingReference: 'DEMO-TRAIN-2026', passengerName: 'Arjun Mehra' }), type: 'TRAIN_TICKET' }]
  },
  {
    optionId: 'seed_transport_chandigarh_manali', sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', mode: 'SUV', type: 'Private SUV Transfer', title: 'Chandigarh to Manali Private SUV', vehicle: 'Demo 6-seat SUV', provider: '[DEMO] Mountain Transfer Partner', pickup: 'Chandigarh Railway Station', drop: 'Old Manali',
    route: { from: 'Chandigarh', to: 'Manali', pickupPoint: 'Railway station arrival gate', dropPoint: 'Demo hostel reception' }, schedule: { departureDate: '2026-10-18', departureTime: '10:45', arrivalDate: '2026-10-18', arrivalTime: '18:30' }, reference: { bookingReference: 'DEMO-SUV-01' },
    startDate: new Date('2026-10-18T05:15:00.000Z'), endDate: new Date('2026-10-18T13:00:00.000Z'), capacity: 5, quantity: 1, pricingType: 'PER_VEHICLE', unitCost: 7800, unitPrice: 9800, totalCost: 7800, totalPrice: 9800, taxRate: 5,
    inclusions: ['Private vehicle', 'Fuel', 'Tolls', 'Driver allowance'], notes: 'Daylight transfer with comfort stops.', selected: true, vehicleMedia: [{ id: 'seed_vehicle_1', url: media[0].storage.secureUrl, publicId: media[0].storage.publicId, caption: 'Representative demo SUV route media', isPrimary: true }],
    documents: [{ ...attachment({ id: 'seed_transport_voucher', category: 'TRANSPORT_VOUCHER', sectionType: 'TRANSPORT', sectionId: 'seed_transport_chandigarh_manali', title: 'Demo Transport Voucher', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'CUSTOMER_VISIBLE_AFTER_BOOKING', pdfDisplayMode: 'AUTO', bookingReference: 'DEMO-SUV-01' }), type: 'TRANSPORT_VOUCHER' }]
  },
  {
    optionId: 'seed_transport_himachal_circuit', sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', mode: 'PRIVATE_CAR', type: 'Private Himachal Circuit SUV', title: 'Manali to Kasol to Dharamshala SUV', vehicle: 'Demo all-terrain SUV', provider: '[DEMO] Himachal Road Partner', pickup: 'Old Manali', drop: 'McLeod Ganj',
    route: { from: 'Manali', to: 'Dharamshala', pickupPoint: 'Manali demo hostel', dropPoint: 'Dharamshala demo hostel' }, schedule: { departureDate: '2026-10-21', departureTime: '09:00', arrivalDate: '2026-10-23', arrivalTime: '18:00' }, reference: { bookingReference: 'DEMO-CIRCUIT-02' },
    startDate: new Date('2026-10-21T03:30:00.000Z'), endDate: new Date('2026-10-23T12:30:00.000Z'), capacity: 5, quantity: 1, pricingType: 'FIXED', unitCost: 15800, unitPrice: 19800, totalCost: 15800, totalPrice: 19800, taxRate: 5,
    inclusions: ['Private SUV', 'Fuel', 'Tolls', 'Planned comfort stops'], notes: 'No unnecessary late-night mountain driving.', selected: true, vehicleMedia: [{ id: 'seed_vehicle_2', url: media[1].storage.secureUrl, publicId: media[1].storage.publicId, caption: 'Representative mountain transfer media', isPrimary: true }], documents: []
  },
  {
    optionId: 'seed_transport_bus', sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', mode: 'BUS', type: 'Volvo Coach', title: 'Dharamshala to Delhi Volvo', vehicle: 'Air-conditioned Volvo coach', pickup: 'Dharamshala Volvo Stand', drop: 'Delhi ISBT',
    route: { from: 'Dharamshala', to: 'Delhi', pickupPoint: 'Volvo stand', dropPoint: 'Delhi ISBT' }, schedule: { departureDate: '2026-10-25', departureTime: '18:30', arrivalDate: '2026-10-26', arrivalTime: '06:30' }, reference: { busNumber: 'DEMO-VOLVO', bookingReference: 'DEMO-BUS-2026' }, seatDetails: 'Demo reclining seats for five travelers', baggage: { cabin: 'One cabin bag', checkIn: 'One standard bag per traveler' },
    capacity: 5, quantity: 5, pricingType: 'PER_PERSON', unitCost: 1000, unitPrice: 1350, totalCost: 5000, totalPrice: 6750, taxRate: 5, inclusions: ['Reserved demo seats', 'Boarding assistance'], notes: 'Submission demo only.', selected: true, vehicleMedia: [],
    documents: [{ ...attachment({ id: 'seed_bus_ticket', category: 'BUS_TICKET', sectionType: 'TRANSPORT', sectionId: 'seed_transport_bus', title: 'Demo Bus Ticket', asset: ticketAssets.bus, mimeType: 'image/png', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW', bookingReference: 'DEMO-BUS-2026', passengerName: 'Arjun Mehra' }), type: 'BUS_TICKET' }]
  }
];

export const buildMaximumQuotationPayload = ({ actor, quotationNumber, hotelOptions, ticketAssets, media }) => {
  const activities = [
    ['seed_activity_old_manali', 2, 'Old Manali Heritage Walk', 'A guided introduction to Old Manali lanes, architecture and traveler culture.', 'Old Manali', 5, 450, 650, true, false],
    ['seed_activity_solang', 3, 'Solang Valley Sightseeing', 'Scenic sightseeing with weather-sensitive activity time and accessible viewpoints.', 'Solang Valley', 5, 650, 850, true, false],
    ['seed_activity_parvati', 5, 'Parvati Valley Riverside Walk', 'A flexible riverside experience that can be shortened for comfort.', 'Kasol', 5, 300, 500, true, false],
    ['seed_activity_chalal', 5, 'Chalal Village Walk', 'Optional guided village walk with a shorter return option.', 'Chalal', 5, 350, 550, false, true],
    ['seed_activity_monastery', 7, 'McLeod Ganj Monastery Circuit', 'Guided cultural circuit covering key monastery and market areas.', 'McLeod Ganj', 5, 500, 750, true, false],
    ['seed_activity_dharamkot', 7, 'Dharamkot Sunset Experience', 'A weather-dependent sunset viewpoint and cafe experience.', 'Dharamkot', 5, 300, 500, false, true]
  ].map(([activityId, dayNumber, name, description, location, quantity, unitCost, unitPrice, isIncluded, isOptional], index) => ({
    activityId, dayNumber, date: new Date(`2026-10-${String(17 + dayNumber).padStart(2, '0')}T00:00:00.000Z`), name, description, location,
    pricingType: 'PER_PERSON', quantity, unitCost, unitPrice, totalCost: unitCost * quantity, totalPrice: unitPrice * quantity,
    isIncluded, isOptional, selected: true, sourceKind: 'MANUAL', reviewStatus: 'REVIEWED',
    attachments: index === 1 ? [attachment({ id: 'seed_activity_ticket', category: 'ACTIVITY_TICKET', sectionType: 'ACTIVITY', sectionId: activityId, title: 'Demo Solang Activity Ticket', asset: ticketAssets.train, mimeType: 'image/png', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'LINK_ONLY', bookingReference: 'DEMO-ACT-03' })] : []
  }));
  const addOns = [
    { addonId: 'seed_addon_photo', category: 'Photography', name: 'Professional trip photography mini-session', description: 'A short, pre-arranged lifestyle photography session in Manali.', pricingType: 'FIXED', quantity: 1, unitCost: 3500, unitPrice: 5000, totalCost: 3500, totalPrice: 5000, selected: true, attachments: [] },
    { addonId: 'seed_addon_transfer', category: 'Private Transfer', name: 'Airport or railway priority transfer upgrade', description: 'Priority pickup coordination for the group arrival.', pricingType: 'PER_VEHICLE', quantity: 1, unitCost: 1800, unitPrice: 2500, totalCost: 1800, totalPrice: 2500, selected: true, attachments: [] },
    { addonId: 'seed_addon_room', category: 'Room Upgrade', name: 'Premium private room upgrade', description: 'Optional upgrade subject to final property availability.', pricingType: 'PER_NIGHT', quantity: 2, unitCost: 1800, unitPrice: 2600, totalCost: 3600, totalPrice: 5200, selected: false, attachments: [] }
  ];
  const transportOptions = buildTransport(ticketAssets, media);
  const itinerary = buildItinerary(media);
  const visibleInsurance = attachment({ id: 'seed_general_insurance', category: 'INSURANCE', title: 'Demo Travel Insurance Summary', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'LINK_ONLY' });
  const hotelVoucher = attachment({ id: 'seed_hotel_voucher', category: 'HOTEL_VOUCHER', sectionType: 'HOTEL', sectionId: hotelOptions[0].optionId, title: 'Demo Manali Hotel Voucher', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'ALWAYS_PREVIEW', bookingReference: 'DEMO-HOTEL-01' });
  const approvalVoucher = attachment({ id: 'seed_approval_voucher', category: 'HOTEL_CONFIRMATION', sectionType: 'HOTEL', sectionId: hotelOptions[1]?.optionId || hotelOptions[0].optionId, title: 'Demo Dharamshala Hotel Confirmation', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'CUSTOMER_VISIBLE_AFTER_APPROVAL', pdfDisplayMode: 'ALWAYS_PREVIEW', bookingReference: 'DEMO-HOTEL-APPROVAL' });
  hotelOptions[0].documents = [hotelVoucher];
  if (hotelOptions[1]) hotelOptions[1].documents = [approvalVoucher];
  const attachments = [
    visibleInsurance,
    attachment({ id: 'seed_preparation_guide', category: 'GENERAL', title: 'Demo Trip Preparation Guide', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'AUTO' }),
    attachment({ id: 'seed_general_voucher', category: 'GENERAL', title: 'Demo General Travel Voucher', asset: ticketAssets.bus, mimeType: 'image/png', visibility: 'CUSTOMER_VISIBLE', pdfDisplayMode: 'HIDDEN' }),
    attachment({ id: 'seed_permit_info', category: 'PERMIT', title: 'Demo Permit Information', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'CUSTOMER_VISIBLE_AFTER_BOOKING', pdfDisplayMode: 'AUTO' }),
    attachment({ id: 'seed_internal_invoice', category: 'INVOICE', title: 'Internal Demo Supplier Invoice', asset: ticketAssets.voucher, mimeType: 'application/pdf', visibility: 'INTERNAL_ONLY', pdfDisplayMode: 'HIDDEN' })
  ];
  const payload = {
    schemaVersion: 2, quotationNumber, version: 1, assignedTo: actor._id,
    assignedToSnapshot: { name: actor.name, email: actor.email, phone: actor.phone || '' }, createdBy: actor._id, updatedBy: actor._id,
    customerSnapshot: { name: 'Arjun Mehra - Demo Traveler', email: DEMO_CUSTOMER_EMAIL, phone: '+91 90000 00000', city: 'New Delhi', notes: 'Submission demo quotation containing full journey, stays, transport, activities, documents, pricing and policy coverage.' },
    tripRequirements: { title: DEMO_JOURNEY_TITLE, destination: 'Himachal Pradesh', origin: 'Delhi', startDate: new Date('2026-10-18T00:00:00.000Z'), endDate: new Date('2026-10-25T00:00:00.000Z'), datesFlexible: false, duration: '8D/7N', days: 8, nights: 7, adults: 3, children: 1, infants: 0, seniors: 1, totalTravelers: 5, travelStyle: 'Backpacking', budgetPerPerson: 22000, specialRequests: 'Avoid overnight mountain driving where practical; vegetarian meals for two travelers; lower-bunk preference for the senior traveler; one private room required at each stay.' },
    tripPreferences: { tripType: 'Friends & Family Adventure', pace: 'Balanced', paceRhythm: 'Active mornings with relaxed evenings', acclimatization: 'Gradual', interests: ['Mountains', 'Local Culture', 'Cafes', 'Nature', 'Photography', 'Short Treks'], stayPreference: 'Social hostels with one private room', roomStyle: 'Mix of dorm and private rooms', hotelRating: 4, dietaryPreference: 'Vegetarian-friendly', transportPreference: 'Train + private road transfers', mobilityConstraints: ['Avoid unnecessarily steep walking for senior traveler'], mustInclude: ['Old Manali', 'Solang Valley', 'Kasol', 'McLeod Ganj'], avoid: ['Late-night mountain driving'], customPreferences: 'Keep enough free time for cafes, photography and local exploration.' },
    planningReference: { sourceItineraryVersion: 1, sourceGeneratedAt: new Date('2026-09-29T00:00:00.000Z'), sourceUpdatedAt: new Date('2026-09-29T00:00:00.000Z'), plannerBudgetAmount: 110000, plannerBudgetScope: 'TOTAL', aiEstimatedTotal: 102500, currency: 'INR', budgetBreakdown: { stays: 36000, transport: 39000, activities: 18000, contingency: 9500 }, bestTimeToVisit: 'March to June and September to November', seasonContext: 'October shoulder-season conditions; mountain weather remains variable.' },
    personalNote: 'We have prepared this Himachal journey as a flexible mix of mountain stays, social hostel experiences, scenic transfers and relaxed exploration. The daily rhythm leaves room for cafes, photography and local discovery while avoiding unnecessary late-night mountain driving. A private room is included at each stay alongside the social character of the selected hostels. Every service remains subject to final availability and confirmation.',
    itinerary, hotelOptions, transportOptions, activities, addOns, attachments,
    inclusions: ['Seven nights in the selected demo Hostel Catalog stays', 'Specified EP or CP meal plans', 'Delhi to Chandigarh demo train sector', 'Selected private SUV transfers', 'Dharamshala to Delhi demo Volvo sector', 'Six listed experiences where marked included', 'Station and boarding-point assistance', 'Trip coordination during operating hours', 'Applicable fuel, tolls and driver allowance for included road transfers', 'Customer-facing vouchers and preparation documents shown by visibility rules', 'One private-room allocation at each stay', 'Planned comfort stops on intercity road sectors'],
    exclusions: ['Personal shopping and incidental expenses', 'Meals not explicitly listed', 'Optional activities unless marked included', 'Adventure activity charges paid directly on site', 'Medical treatment and evacuation costs', 'Travel insurance beyond the listed demo summary', 'Early check-in or late check-out unless confirmed', 'Weather-related alternative arrangements outside the confirmed scope', 'Anything not expressly listed under inclusions'],
    termsAndConditions: [], cancellationPolicy: [],
    policies: {
      paymentTerms: 'A 30% booking deposit is required to initiate service confirmation. Remaining installments follow the dated schedule in this demo quotation.',
      cancellationPolicy: 'Cancellation charges depend on the date of written cancellation and the non-refundable commitments already made to service providers. The final applicable amount will be communicated before processing.',
      refundNotes: 'Eligible refunds are processed after supplier reconciliation and may exclude payment-gateway or non-refundable supplier charges.',
      importantInformation: 'This is synthetic submission-demo data, not a live booking. Mountain routes, activities and timings remain subject to weather, road and local operating conditions.',
      travelRequirements: 'Travelers should carry valid government-issued identification, suitable cold-weather layers, personal medication and any documents required by the confirmed operators.',
      termsAndConditions: 'All services are subject to availability until written confirmation. The final confirmed itinerary and vouchers supersede this demonstration proposal where operational details differ.'
    },
    presentationSettings: { template: 'journey', showComponentPrices: true, showPaymentSchedule: true, showAttachments: true, showAdvisor: true, showTerms: true, showItineraryGallery: true, showTripPreferences: true },
    commercialState: 'READY_TO_SHARE', status: 'READY_TO_SHARE', validUntil: new Date('2026-10-17T23:59:59.000Z'),
    paymentTerms: { paymentMode: 'PARTIAL', depositPercent: 30, balanceDueDays: 7, currency: 'INR' },
    manualPricing: { currency: 'INR', componentReference: 0, finalCustomerPrice: 96500, depositAmount: 28950, balanceAmount: 67550, adjustments: [{ label: 'Submission demo package adjustment', amount: 2500, type: 'REDUCE' }], paymentSchedule: [{ label: 'Booking deposit', amount: 28950, dueDate: new Date('2026-10-01T00:00:00.000Z'), notes: 'Initiates confirmation requests.' }, { label: 'Second installment', amount: 28950, dueDate: new Date('2026-10-08T00:00:00.000Z'), notes: 'Due after initial service status review.' }, { label: 'Final balance', amount: 38600, dueDate: new Date('2026-10-11T00:00:00.000Z'), notes: 'Due seven days before departure.' }], priceNotes: 'Submission demo quotation. Rates remain subject to availability until final written confirmation.', finalizedBy: actor._id, finalizedByName: actor.name, finalizedAt: new Date() },
    pricing: { internalHotelCost: hotelOptions.reduce((sum, item) => sum + Number(item.totalCost || 0), 0), internalTransportCost: transportOptions.reduce((sum, item) => sum + Number(item.totalCost || 0), 0), internalActivityCost: activities.reduce((sum, item) => sum + Number(item.totalCost || 0), 0), internalAddOnCost: addOns.filter((item) => item.selected).reduce((sum, item) => sum + Number(item.totalCost || 0), 0), totalInternalCost: 0, customerHotelPrice: hotelOptions.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0), customerTransportPrice: transportOptions.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0), customerActivityPrice: activities.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0), customerAddOnPrice: addOns.filter((item) => item.selected).reduce((sum, item) => sum + Number(item.totalPrice || 0), 0), subtotal: 96500, discountType: 'none', finalTotal: 96500, perPersonPrice: 19300, depositRequired: 28950, balanceAmount: 67550 },
    statusHistory: [{ status: 'READY_TO_SHARE', changedBy: actor._id, changedByName: actor.name, changedAt: new Date(), reason: 'Submission demo seed finalized.' }],
    currentRevisionId: null, latestSharedRevisionId: null, approvedRevisionId: null, bookingId: null, bookingCode: '', convertedTripId: null,
    auditTrail: [{ action: 'SUBMISSION_DEMO_SEEDED', performedBy: actor._id, performedByName: actor.name, details: { marker: DEMO_CUSTOMER_EMAIL }, timestamp: new Date() }]
  };
  payload.manualPricing.componentReference = calculateComponentReference(payload);
  payload.pricing.totalInternalCost = payload.pricing.internalHotelCost + payload.pricing.internalTransportCost + payload.pricing.internalActivityCost + payload.pricing.internalAddOnCost;
  return payload;
};

const removeQuotationDependencies = async (quotationIds) => {
  if (!quotationIds.length) return;
  await Promise.all([
    QuotationApprovalVerification.deleteMany({ quotationId: { $in: quotationIds } }),
    QuotationEvent.deleteMany({ quotationId: { $in: quotationIds } }),
    QuotationShare.deleteMany({ quotationId: { $in: quotationIds } }),
    QuotationRevision.deleteMany({ quotationId: { $in: quotationIds } })
  ]);
};

const cleanupDemo = async () => {
  const quotations = await Quotation.find({ 'customerSnapshot.email': DEMO_CUSTOMER_EMAIL }).select('_id');
  const ids = quotations.map((item) => item._id);
  await removeQuotationDependencies(ids);
  await Quotation.deleteMany({ _id: { $in: ids } });
  const assets = await MediaAsset.find({ tags: DEMO_MEDIA_TAG });
  let removedAssets = 0;
  for (const asset of assets) {
    const referenced = await Quotation.exists({ $or: [{ 'attachments.secureUrl': asset.storage.secureUrl }, { 'hotelOptions.documents.secureUrl': asset.storage.secureUrl }, { 'transportOptions.documents.secureUrl': asset.storage.secureUrl }, { 'activities.attachments.secureUrl': asset.storage.secureUrl }, { 'addOns.attachments.secureUrl': asset.storage.secureUrl }] });
    if (referenced) continue;
    if (asset.storage.publicId && ['cloudinary', 'local'].includes(asset.storage.provider)) await deleteMedia(asset.storage.publicId, asset.type === 'VIDEO' ? 'video' : 'image');
    await asset.deleteOne();
    removedAssets += 1;
  }
  console.log(`MAXIMUM QUOTATION DEMO CLEANUP COMPLETE: quotations=${ids.length}, unreferencedMedia=${removedAssets}`);
};

export const seedMaximumQuotationDemo = async ({ cleanup = false } = {}) => {
  assertDemoSeedAllowed();
  if (!(await connectDB())) throw new Error('Database connection is required for the maximum quotation demo seed.');
  if (cleanup) { await cleanupDemo(); return null; }
  const actor = await findSeedActor();
  if (!actor) throw new Error('No Admin/Super Admin account exists. Create a staff user before running demo seeds.');
  const hotels = await Hotel.find({ name: { $in: DEMO_HOSTEL_NAMES }, status: 'ACTIVE', propertyType: 'HOSTEL', tags: 'submission-demo' });
  if (hotels.length !== 3) throw new Error('The three submission-demo Hostels are required. Run npm run seed:hostels:demo first.');
  const orderedHotels = DEMO_HOSTEL_NAMES.map((name) => hotels.find((hotel) => hotel.name === name));
  const media = await MediaAsset.find({ _id: { $in: orderedHotels.flatMap((hotel) => [hotel.media.hero.assetId, ...hotel.media.gallery.map((item) => item.assetId)]) }, active: true });
  if (media.length < 6) throw new Error('Seeded Hostel MediaAssets are incomplete. Rerun the Hostel demo seed.');
  const ticketAssets = await ensureTicketAssets(actor);
  const stayDates = [['2026-10-18', '2026-10-21', 3], ['2026-10-21', '2026-10-23', 2], ['2026-10-23', '2026-10-25', 2]];
  const requestedHotels = orderedHotels.map((hotel, index) => {
    const room = hotel.roomTypes.find((item) => /private/i.test(item.name)) || hotel.roomTypes[0];
    const rate = hotel.ratePlans.find((item) => item.roomTypeId === room.roomTypeId && item.mealPlan === 'CP' && item.active) || hotel.ratePlans[0];
    return { optionId: `seed_hotel_${index + 1}`, catalogHotelId: hotel._id, catalogRoomTypeId: room.roomTypeId, catalogMealPlan: rate.mealPlan, catalogRatePlanId: rate.ratePlanId, applyCatalogRate: true, segmentId: `seed_stay_${index + 1}`, segmentName: `${hotel.location.city} Stay`, segmentOrder: index + 1, tier: 'Custom', label: `Submission demo ${hotel.location.city} stay`, rooms: 2, occupancy: 'Double Sharing', checkIn: stayDates[index][0], checkOut: stayDates[index][1], nights: stayDates[index][2], notes: 'Demo allocation combines one private room with suitable dorm capacity, subject to final confirmation.', recommendationType: index === 0 ? 'RECOMMENDED' : 'CUSTOM', selected: true };
  });
  const hotelOptions = await resolveCatalogHotelOptions(requestedHotels, [], { admin: true });
  const existing = await Quotation.findOne({ 'customerSnapshot.email': DEMO_CUSTOMER_EMAIL });
  const quotationNumber = existing?.quotationNumber || await generateQuotationNumber();
  if (existing) await removeQuotationDependencies([existing._id]);
  const payload = buildMaximumQuotationPayload({ actor, quotationNumber, hotelOptions, ticketAssets, media });
  const validation = validateQuotationV2(payload, { forFinalization: true, forShare: true });
  if (validation.errors.length) throw new Error(`Maximum quotation validation failed: ${validation.errors.map((item) => item.message).join(' ')}`);
  let quotation = existing || new Quotation();
  quotation.set(payload);
  await quotation.save();
  const snapshot = buildRevisionSnapshot(quotation);
  const revision = await QuotationRevision.create({ quotationId: quotation._id, version: 1, status: 'FINALIZED', snapshot, templateKey: 'journey', finalCustomerPrice: quotation.manualPricing.finalCustomerPrice, currency: 'INR', createdBy: actor._id, createdByName: actor.name, finalizedBy: actor._id, finalizedByName: actor.name, finalizedAt: quotation.manualPricing.finalizedAt });
  quotation.currentRevisionId = revision._id;
  await quotation.save();
  const share = { _id: revision._id, templateKey: 'journey', allowPdfDownload: true, allowAttachments: true, requireEmailVerification: false, approvalEnabled: false, recipientEmail: DEMO_CUSTOMER_EMAIL, isActive: true, expiresAt: new Date('2026-10-17T23:59:59.000Z'), revokedAt: null };
  const publicDto = buildPublicRevisionDto({ quotation, revision, share });
  const presentation = buildQuotationPresentationModel(publicDto);
  const serialized = JSON.stringify(publicDto);
  if (serialized.includes('[DEMO] Mountain Transfer Partner') || serialized.includes('plannerBudgetAmount') || serialized.includes('Internal Demo Supplier Invoice')) throw new Error('Public quotation DTO leaked internal seed data.');
  if (publicDto.attachments.some((item) => item.visibility !== 'CUSTOMER_VISIBLE')) throw new Error('READY_TO_SHARE attachment visibility verification failed.');
  if (presentation.attachments.some((item) => item.pdfDisplayMode === 'HIDDEN' || item.title.includes('Internal'))) throw new Error('PDF display/security verification failed.');
  const verifiedQuotation = await Quotation.findOne({ 'customerSnapshot.email': DEMO_CUSTOMER_EMAIL });
  const revisionCount = await QuotationRevision.countDocuments({ quotationId: verifiedQuotation._id, status: 'FINALIZED' });
  const hostelCount = await Hotel.countDocuments({ name: { $in: DEMO_HOSTEL_NAMES }, tags: 'submission-demo', status: 'ACTIVE' });
  const databaseCheckPassed = Boolean(verifiedQuotation) && hostelCount === 3 && verifiedQuotation.itinerary.length === 8 && new Set(verifiedQuotation.hotelOptions.map((item) => String(item.catalogHotelId))).size === 3 && verifiedQuotation.transportOptions.length >= 4 && verifiedQuotation.activities.length >= 6 && verifiedQuotation.addOns.length >= 3 && revisionCount === 1 && String(verifiedQuotation.currentRevisionId) === String(revision._id);
  if (!databaseCheckPassed) throw new Error('Maximum quotation post-seed verification failed.');
  console.log('MAXIMUM QUOTATION DEMO SEED COMPLETE');
  console.log(`Quotation ID: ${quotation._id}`);
  console.log(`Quotation Number: ${quotation.quotationNumber}`);
  console.log(`Revision ID: ${revision._id}`);
  console.log('Customer: Arjun Mehra - Demo Traveler');
  console.log(`Days: ${quotation.itinerary.length}`);
  console.log(`Hotels: ${new Set(quotation.hotelOptions.map((item) => String(item.catalogHotelId))).size}`);
  console.log(`Transport: ${quotation.transportOptions.length}`);
  console.log(`Activities: ${quotation.activities.length}`);
  console.log(`Attachments: ${quotation.attachments.length + quotation.hotelOptions.flatMap((item) => item.documents).length + quotation.transportOptions.flatMap((item) => item.documents).length + quotation.activities.flatMap((item) => item.attachments).length}`);
  console.log(`Final Price: INR ${quotation.manualPricing.finalCustomerPrice}`);
  const frontend = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  console.log(`Open: ${frontend}/staff/sales/quotations/${quotation._id}`);
  console.log(`Edit: ${frontend}/staff/sales/quotations/${quotation._id}/edit`);
  console.log('Use Preview PDF to test: Signature Luxe, Journey Journal, Expedition Dossier');
  console.log(`Media storage: ${getMediaStorageStatus().provider}`);
  console.log(`POST-SEED DATABASE CHECK: PASS | hostels=${hostelCount} | quotations=1 | finalizedRevisions=${revisionCount}`);
  return { quotation, revision };
};

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) {
  try {
    await seedMaximumQuotationDemo({ cleanup: process.argv.includes('--cleanup') });
  } catch (error) {
    console.error(`Maximum quotation demo seed failed: ${error.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

