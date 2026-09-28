import { splitHotel, splitItineraryDay, splitText } from './pagination.js';

const densityFor = (templateKey) => templateKey === 'signature_luxe' ? 'detailed' : templateKey === 'minimal' ? 'compact' : 'balanced';
const galleryLimitFor = (templateKey) => templateKey === 'signature_luxe' ? 3 : templateKey === 'minimal' ? 1 : 2;
const ticketCategories = new Set(['FLIGHT_TICKET', 'TRAIN_TICKET', 'BUS_TICKET', 'ACTIVITY_TICKET', 'ACTIVITY_VOUCHER', 'HOTEL_VOUCHER', 'HOTEL_CONFIRMATION', 'TRANSPORT_VOUCHER']);

export function resolveDocumentPresentation(document, templateKey) {
  const requested = document.pdfDisplayMode || 'AUTO';
  if (requested === 'HIDDEN') return 'hidden';
  if (requested === 'LINK_ONLY') return 'link';
  if (requested === 'ALWAYS_PREVIEW') return 'preview';
  if (templateKey === 'minimal') return 'link';
  if (templateKey === 'signature_luxe' || ticketCategories.has(document.category) || ticketCategories.has(document.documentType)) return 'preview';
  return 'link';
}

const block = (id, section, kind, content, extra = {}) => ({
  id,
  section,
  kind,
  content,
  density: extra.density,
  keepTogether: extra.keepTogether !== false,
  canSplit: extra.canSplit === true,
  preferredPageStart: extra.startOnNewPage === true,
  minRemainingHeight: extra.minRemainingHeight || 120,
  ...extra
});

export function buildPdfSectionManifest(model, templateKey) {
  const density = densityFor(templateKey);
  const blocks = [block('cover', 'cover', 'cover', null, { cover: true, title: templateKey === 'minimal' ? 'Overview Dossier' : templateKey === 'journey' ? 'Travel Journal' : 'Private Journey Proposal', className: templateKey === 'minimal' ? 'dossier-cover' : templateKey === 'journey' ? 'journey-cover' : 'signature-cover', density })];

  if (model.journey.personalNote || model.journey.specialRequests) blocks.push(block('proposal-introduction', 'introduction', 'introduction', {
    personalNote: model.journey.personalNote,
    specialRequests: model.journey.specialRequests
  }, { sectionTitle: 'A Personal Introduction', pageTitle: 'Proposal Introduction', density, canSplit: true }));

  blocks.push(block('journey-overview', 'overview', 'overview', null, { sectionTitle: 'Journey Overview', pageTitle: 'Journey Overview', density }));

  model.itinerary.forEach((day, index) => blocks.push(block(`itinerary-${day.day || 'day'}-${index}`, 'itinerary', 'itinerary', day, {
    sectionTitle: index ? 'Itinerary · Continued' : 'Day-by-Day Itinerary', pageTitle: 'Day-by-Day Itinerary', density, canSplit: true
  })));

  model.hotels.forEach((hotel, index) => blocks.push(block(`hotel-${hotel.id}`, 'hotels', 'hotel', hotel, {
    sectionTitle: index ? 'Accommodation · Continued' : 'Hotels & Accommodation', pageTitle: 'Hotels & Accommodation', density, canSplit: true
  })));

  model.transport.forEach((item, index) => blocks.push(block(`transport-${item.id}`, 'transport', 'transport', item, {
    sectionTitle: index ? 'Transport · Continued' : 'Transport & Logistics', pageTitle: 'Transport & Logistics', density
  })));

  [...model.activities.map((item) => ({ ...item, experienceKind: 'activity' })), ...model.addOns.map((item) => ({ ...item, experienceKind: 'addon' }))]
    .forEach((item, index) => blocks.push(block(`experience-${item.experienceKind}-${item.id}`, 'experiences', 'experience', item, {
      sectionTitle: index ? 'Experiences · Continued' : 'Activities & Add-ons', pageTitle: 'Activities & Add-ons', density
    })));

  const documents = model.allCustomerDocuments.map((document) => ({ ...document, resolvedPdfDisplay: resolveDocumentPresentation(document, templateKey) }))
    .filter((document) => document.resolvedPdfDisplay !== 'hidden');
  if (documents.length > 1) blocks.push(block('document-register', 'documents', 'document-register', documents, {
    sectionTitle: 'Travel Documents', pageTitle: 'Travel Documents', density
  }));
  documents.forEach((document, index) => blocks.push(block(`document-${document.id || index}`, 'documents', 'document', document, {
    sectionTitle: index ? 'Travel Documents · Continued' : 'Tickets & Vouchers', pageTitle: 'Travel Documents', density
  })));

  if (model.inclusions.length) blocks.push(block('inclusions', 'inclusions', 'bullet-list', { items: model.inclusions, negative: false }, {
    sectionTitle: 'What Is Included', pageTitle: 'Inclusions & Exclusions', density, canSplit: true
  }));
  if (model.exclusions.length) blocks.push(block('exclusions', 'exclusions', 'bullet-list', { items: model.exclusions, negative: true }, {
    sectionTitle: 'What Is Not Included', pageTitle: 'Inclusions & Exclusions', density, canSplit: true
  }));

  blocks.push(block('pricing-summary', 'pricing', 'pricing', null, {
    sectionTitle: 'Journey Investment', pageTitle: 'Journey Investment', density, startOnNewPage: templateKey === 'signature_luxe'
  }));
  if (model.pricing.paymentSchedule.length) blocks.push(block('payment-schedule', 'payment-schedule', 'payment-schedule', model.pricing.paymentSchedule, {
    sectionTitle: 'Payment Schedule', pageTitle: 'Journey Investment', density, canSplit: true
  }));

  const policyEntries = Object.entries(model.policies).filter(([, value]) => Array.isArray(value) ? value.length : value);
  policyEntries.forEach((entry, index) => blocks.push(block(`policy-${entry[0]}-${index}`, 'policies', 'policy', entry, {
    sectionTitle: index ? 'Travel Terms · Continued' : 'Travel Terms & Policies', pageTitle: 'Travel Terms & Policies', density, canSplit: true
  })));

  blocks.push(block('advisor-approval', 'closing', 'advisor-approval', null, {
    sectionTitle: 'Advisor & Proposal Status', pageTitle: 'Advisor & Proposal Status', density
  }));
  if (templateKey === 'signature_luxe') blocks.push(block('signature-closing', 'closing', 'closing', null, {
    cover: true, title: 'Your Journey Starts Here', className: 'signature-final', density
  }));
  return blocks;
}

const midpoint = (items) => Math.max(1, Math.ceil(items.length / 2));
const continuedTitle = (title) => title?.includes('Continued') ? title : `${title || ''} · Continued`;
const fragments = (source, contents) => contents.map((content, index) => ({
  ...source,
  id: `${source.id}-part-${index + 1}`,
  content,
  sectionTitle: index ? continuedTitle(source.sectionTitle) : source.sectionTitle
}));

export function splitOversizedPdfBlock(source, templateKey) {
  const content = source.content;
  if (source.kind === 'itinerary') {
    const parts = splitItineraryDay(content);
    return parts.length > 1 ? fragments(source, parts) : [];
  }
  if (source.kind === 'hotel') {
    const parts = splitHotel(content, galleryLimitFor(templateKey));
    return parts.length > 1 ? fragments(source, parts) : [];
  }
  if (source.kind === 'introduction') {
    const parts = [
      ...splitText(content.personalNote, 700).map((personalNote) => ({ personalNote, specialRequests: '' })),
      ...splitText(content.specialRequests, 700).map((specialRequests) => ({ personalNote: '', specialRequests }))
    ];
    return parts.length > 1 ? fragments(source, parts) : [];
  }
  if (source.kind === 'bullet-list' && content.items.length > 1) {
    const at = midpoint(content.items);
    return fragments(source, [{ ...content, items: content.items.slice(0, at) }, { ...content, items: content.items.slice(at) }]);
  }
  if ((source.kind === 'payment-schedule' || source.kind === 'document-register') && content.length > 1) {
    const at = midpoint(content);
    return fragments(source, [content.slice(0, at), content.slice(at)]);
  }
  if (source.kind === 'policy') {
    const [key, value] = content;
    if (Array.isArray(value) && value.length > 1) {
      const at = midpoint(value);
      return fragments(source, [[key, value.slice(0, at)], [`${key}Continued`, value.slice(at)]]);
    }
    if (typeof value === 'string' && value.length > 1) {
      const parts = splitText(value, Math.max(300, Math.ceil(value.length / 2)));
      return parts.length > 1 ? fragments(source, parts.map((part, index) => [index ? `${key}Continued` : key, part])) : [];
    }
  }
  if (source.kind === 'experience' && content.description) {
    const parts = splitText(content.description, Math.max(300, Math.ceil(content.description.length / 2)));
    return parts.length > 1 ? fragments(source, parts.map((description, index) => ({ ...content, description, continued: index > 0 }))) : [];
  }
  if (source.kind === 'transport' && content.notes) {
    const parts = splitText(content.notes, Math.max(300, Math.ceil(content.notes.length / 2)));
    return parts.length > 1 ? fragments(source, parts.map((notes, index) => ({ ...content, notes, continued: index > 0, media: index ? [] : content.media }))) : [];
  }
  return [];
}
