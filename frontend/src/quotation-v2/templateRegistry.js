export const QUOTATION_TEMPLATES = Object.freeze({
  signature_luxe: Object.freeze({
    key: 'signature_luxe',
    name: 'Signature Luxe',
    detail: 'Most Detailed',
    shortDescription: 'Luxury Editorial Proposal',
    description: 'Luxury editorial proposal with full journey storytelling, stays, logistics, investment, terms and sign-off.',
    bestFor: 'Best for premium, high-value and detailed custom journeys.',
    targetPages: '~10+ pages',
    accent: '#d4af37'
  }),
  journey: Object.freeze({
    key: 'journey',
    name: 'Journey Journal',
    detail: 'Balanced',
    shortDescription: 'Visual Travel Quotation',
    description: 'Visual travel quotation with itinerary, hotels, transport, investment and policies.',
    bestFor: 'Best for most custom holidays and family or couple journeys.',
    targetPages: '~6 pages',
    accent: '#c86d51'
  }),
  minimal: Object.freeze({
    key: 'minimal',
    name: 'Expedition Dossier',
    detail: 'Compact',
    shortDescription: 'Quick Professional Summary',
    description: 'Concise field-dossier format for fast review while retaining essential journey and commercial information.',
    bestFor: 'Best for quick review and concise commercial proposals.',
    targetPages: '~3 pages',
    accent: '#8c6d48'
  })
});

export const QUOTATION_TEMPLATE_KEYS = Object.freeze(Object.keys(QUOTATION_TEMPLATES));
export const getQuotationTemplate = (key) => QUOTATION_TEMPLATES[key] || QUOTATION_TEMPLATES.journey;
export const quotationTemplateOptions = () => QUOTATION_TEMPLATE_KEYS.map((key) => QUOTATION_TEMPLATES[key]);
