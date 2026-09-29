import { splitHotel, splitItineraryDay, splitText } from './pagination.js';
import { buildTemplatePdfModel } from './pdfContentProfiles.js';

const densityFor = (templateKey) => templateKey === 'signature_luxe' ? 'detailed' : templateKey === 'minimal' ? 'compact' : 'balanced';
const galleryLimitFor = (templateKey) => templateKey === 'signature_luxe' ? 3 : 0;
const ticketCategories = new Set([
  'FLIGHT_TICKET', 'TRAIN_TICKET', 'BUS_TICKET', 'ACTIVITY_TICKET',
  'ACTIVITY_VOUCHER', 'HOTEL_VOUCHER', 'HOTEL_CONFIRMATION', 'TRANSPORT_VOUCHER'
]);

export function resolveDocumentPresentation(document, templateKey) {
  const requested = document.pdfDisplayMode || 'AUTO';
  if (requested === 'HIDDEN') return 'hidden';
  if (requested === 'LINK_ONLY') return 'link';
  if (requested === 'ALWAYS_PREVIEW') return 'preview';
  if (templateKey === 'minimal') return 'link';
  if (templateKey === 'signature_luxe' || ticketCategories.has(document.category) || ticketCategories.has(document.documentType)) {
    return 'preview';
  }
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

export function buildPdfSectionManifest(inputModel, templateKey = 'journey') {
  const model = inputModel.pdfProfile ? inputModel : buildTemplatePdfModel(inputModel, templateKey);
  const density = densityFor(templateKey);
  const blocks = [
    block('cover', 'cover', 'cover', null, {
      cover: true,
      title: templateKey === 'minimal' ? 'Overview Dossier' : templateKey === 'journey' ? 'Travel Journal' : 'Private Journey Proposal',
      className: templateKey === 'minimal' ? 'dossier-cover' : templateKey === 'journey' ? 'journey-cover' : 'signature-cover',
      density
    })
  ];

  if (model.journey?.personalNote || model.journey?.specialRequests) {
    blocks.push(block('proposal-introduction', 'introduction', 'introduction', {
      personalNote: model.journey.personalNote,
      specialRequests: model.journey.specialRequests
    }, {
      sectionTitle: 'A Personal Introduction',
      pageTitle: 'Proposal Introduction',
      density,
      canSplit: true
    }));
  }

  blocks.push(block('journey-overview', 'overview', 'overview', null, {
    sectionTitle: 'Journey Overview',
    pageTitle: 'Journey Overview',
    density
  }));

  // --- ITINERARY SECTION ---
  if (templateKey === 'minimal') {
    // Dossier uses Itinerary Matrix / Timeline
    blocks.push(block('itinerary-schedule', 'itinerary', 'itinerary-matrix', model.itinerary, {
      sectionTitle: 'Itinerary Schedule',
      pageTitle: 'Itinerary Schedule',
      density,
      canSplit: true,
      minRemainingHeight: 140
    }));
  } else {
    // Signature and Journey use day cards
    model.itinerary.forEach((day, index) => {
      const isFirst = index === 0;
      const sectionTitle = templateKey === 'signature_luxe'
        ? (isFirst ? 'Day-by-Day Itinerary' : 'Day-by-Day Itinerary')
        : (isFirst ? 'Day-by-Day Itinerary' : '');
      blocks.push(block(`itinerary-${day.day || 'day'}-${index}`, 'itinerary', 'itinerary', day, {
        sectionTitle,
        pageTitle: 'Day-by-Day Itinerary',
        density,
        canSplit: true,
        minRemainingHeight: 140
      }));
    });
  }

  // --- HOTELS SECTION ---
  if (templateKey === 'minimal') {
    // Dossier uses Hotel Matrix
    blocks.push(block('hotels-schedule', 'hotels', 'hotels-matrix', model.hotels, {
      sectionTitle: 'Hotels & Accommodation',
      pageTitle: 'Hotels & Accommodation',
      density,
      canSplit: true,
      minRemainingHeight: 120
    }));
  } else {
    model.hotels.forEach((hotel, index) => {
      const isFirst = index === 0;
      const sectionTitle = templateKey === 'signature_luxe'
        ? (isFirst ? 'Hotels & Accommodation' : 'Hotels & Accommodation')
        : (isFirst ? 'Hotels & Accommodation' : '');
      blocks.push(block(`hotel-${hotel.id || index}`, 'hotels', 'hotel', hotel, {
        sectionTitle,
        pageTitle: 'Hotels & Accommodation',
        density,
        canSplit: true,
        minRemainingHeight: 130
      }));
    });
  }

  // --- TRANSPORT SECTION ---
  if (templateKey === 'minimal') {
    // Dossier uses Transport Matrix
    blocks.push(block('transport-schedule', 'transport', 'transport-matrix', model.transport, {
      sectionTitle: 'Transport & Logistics',
      pageTitle: 'Transport & Logistics',
      density,
      canSplit: true,
      minRemainingHeight: 120
    }));
  } else {
    model.transport.forEach((item, index) => {
      const isFirst = index === 0;
      const sectionTitle = templateKey === 'signature_luxe'
        ? (isFirst ? 'Transport & Logistics' : 'Transport & Logistics')
        : (isFirst ? 'Transport & Logistics' : '');
      blocks.push(block(`transport-${item.id || index}`, 'transport', 'transport', item, {
        sectionTitle,
        pageTitle: 'Transport & Logistics',
        density,
        canSplit: true,
        minRemainingHeight: 120
      }));
    });
  }

  // --- EXPERIENCES & ADD-ONS SECTION ---
  const selectedAddOns = (model.addOns || []).filter((item) => item.selected);
  if (templateKey === 'minimal') {
    // Dossier uses Experiences Summary Matrix
    blocks.push(block('experiences-summary', 'experiences', 'experiences-matrix', {
      activities: model.activities || [],
      addOns: selectedAddOns
    }, {
      sectionTitle: 'Curated Experiences & Add-ons',
      pageTitle: 'Curated Experiences',
      density,
      canSplit: true,
      minRemainingHeight: 110
    }));
  } else if (templateKey === 'journey') {
    // Journey groups activities and add-ons
    blocks.push(block('experiences-grouped', 'experiences', 'experiences-grouped', {
      activities: model.activities || [],
      addOns: selectedAddOns
    }, {
      sectionTitle: 'Activities & Add-ons',
      pageTitle: 'Activities & Add-ons',
      density,
      canSplit: true,
      minRemainingHeight: 120
    }));
  } else {
    // Signature uses detailed individual experience cards
    [...model.activities.map((item) => ({ ...item, experienceKind: 'activity' })), ...selectedAddOns.map((item) => ({ ...item, experienceKind: 'addon' }))]
      .forEach((item, index) => {
        blocks.push(block(`experience-${item.experienceKind}-${item.id || index}`, 'experiences', 'experience', item, {
          sectionTitle: index === 0 ? 'Activities & Add-ons' : 'Activities & Add-ons',
          pageTitle: 'Activities & Add-ons',
          density,
          canSplit: true
        }));
      });
  }

  // --- TRAVEL DOCUMENTS SECTION ---
  const documents = (model.allCustomerDocuments || []).map((doc) => ({
    ...doc,
    resolvedPdfDisplay: resolveDocumentPresentation(doc, templateKey)
  })).filter((doc) => doc.resolvedPdfDisplay !== 'hidden');

  if (documents.length > 0) {
    blocks.push(block('document-register', 'documents', 'document-register', documents, {
      sectionTitle: 'Travel Documents',
      pageTitle: 'Travel Documents',
      density,
      canSplit: true
    }));

    // In Dossier, only ALWAYS_PREVIEW documents get preview cards!
    // In Journey and Signature, documents with resolvedPdfDisplay === 'preview' get preview cards
    const previewDocs = templateKey === 'minimal'
      ? documents.filter((doc) => doc.pdfDisplayMode === 'ALWAYS_PREVIEW')
      : documents.filter((doc) => doc.resolvedPdfDisplay === 'preview');

    previewDocs.forEach((doc, index) => {
      blocks.push(block(`document-${doc.id || index}`, 'documents', 'document', doc, {
        sectionTitle: index === 0 ? 'Tickets & Vouchers' : '',
        pageTitle: 'Travel Documents',
        density
      }));
    });
  }

  // --- INCLUSIONS & EXCLUSIONS ---
  if (model.inclusions?.length) {
    blocks.push(block('inclusions', 'inclusions', 'bullet-list', { items: model.inclusions, negative: false }, {
      sectionTitle: 'What Is Included',
      pageTitle: 'Inclusions & Exclusions',
      density,
      canSplit: true
    }));
  }
  if (model.exclusions?.length) {
    blocks.push(block('exclusions', 'exclusions', 'bullet-list', { items: model.exclusions, negative: true }, {
      sectionTitle: 'What Is Not Included',
      pageTitle: 'Inclusions & Exclusions',
      density,
      canSplit: true
    }));
  }

  // --- PRICING & PAYMENT ---
  blocks.push(block('pricing-summary', 'pricing', 'pricing', null, {
    sectionTitle: 'Journey Investment',
    pageTitle: 'Journey Investment',
    density,
    startOnNewPage: templateKey === 'signature_luxe'
  }));

  if (model.pricing?.paymentSchedule?.length) {
    blocks.push(block('payment-schedule', 'payment-schedule', 'payment-schedule', model.pricing.paymentSchedule, {
      sectionTitle: 'Payment Schedule',
      pageTitle: 'Journey Investment',
      density,
      canSplit: true
    }));
  }

  // --- POLICIES SECTION ---
  const policyEntries = Object.entries(model.policies || {}).filter(([, value]) => Array.isArray(value) ? value.length : Boolean(value));
  if (templateKey === 'minimal') {
    // Dossier groups policies into one clean, compact block
    blocks.push(block('policies-compact', 'policies', 'policies-compact', policyEntries, {
      sectionTitle: 'Travel Terms & Policies',
      pageTitle: 'Travel Terms & Policies',
      density,
      canSplit: true,
      minRemainingHeight: 140
    }));
  } else if (templateKey === 'journey') {
    // Journey pairs policies 2 at a time
    for (let i = 0; i < policyEntries.length; i += 2) {
      const pair = policyEntries.slice(i, i + 2);
      blocks.push(block(`policy-group-${i / 2}`, 'policies', 'policies-compact', pair, {
        sectionTitle: i === 0 ? 'Travel Terms & Policies' : '',
        pageTitle: 'Travel Terms & Policies',
        density,
        canSplit: true
      }));
    }
  } else {
    // Signature renders individual policy blocks
    policyEntries.forEach((entry, index) => {
      blocks.push(block(`policy-${entry[0]}-${index}`, 'policies', 'policy', entry, {
        sectionTitle: index === 0 ? 'Travel Terms & Policies' : 'Travel Terms & Policies',
        pageTitle: 'Travel Terms & Policies',
        density,
        canSplit: true
      }));
    });
  }

  // --- ADVISOR & CLOSING ---
  blocks.push(block('advisor-approval', 'closing', 'advisor-approval', null, {
    sectionTitle: 'Advisor & Proposal Status',
    pageTitle: 'Advisor & Proposal Status',
    density
  }));

  if (templateKey === 'signature_luxe') {
    blocks.push(block('signature-closing', 'closing', 'closing', null, {
      cover: true,
      title: 'Your Journey Starts Here',
      className: 'signature-final',
      density
    }));
  }

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

  if (source.kind === 'itinerary-matrix' && Array.isArray(content) && content.length > 1) {
    const at = midpoint(content);
    return fragments(source, [content.slice(0, at), content.slice(at)]);
  }

  if (source.kind === 'hotels-matrix' && Array.isArray(content) && content.length > 1) {
    const at = midpoint(content);
    return fragments(source, [content.slice(0, at), content.slice(at)]);
  }

  if (source.kind === 'transport-matrix' && Array.isArray(content) && content.length > 1) {
    const at = midpoint(content);
    return fragments(source, [content.slice(0, at), content.slice(at)]);
  }

  if (source.kind === 'experiences-matrix') {
    const acts = content.activities || [];
    const adds = content.addOns || [];
    if (acts.length > 1) {
      const at = midpoint(acts);
      return fragments(source, [
        { activities: acts.slice(0, at), addOns: [] },
        { activities: acts.slice(at), addOns: adds }
      ]);
    }
  }

  if (source.kind === 'experiences-grouped') {
    const acts = content.activities || [];
    const adds = content.addOns || [];
    if (acts.length > 1) {
      const at = midpoint(acts);
      return fragments(source, [
        { activities: acts.slice(0, at), addOns: [] },
        { activities: acts.slice(at), addOns: adds }
      ]);
    }
  }

  if (source.kind === 'policies-compact' && Array.isArray(content) && content.length > 1) {
    const at = midpoint(content);
    return fragments(source, [content.slice(0, at), content.slice(at)]);
  }

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

  if (source.kind === 'bullet-list' && content.items?.length > 1) {
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
