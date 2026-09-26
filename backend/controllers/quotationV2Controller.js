import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import Quotation from '../models/Quotation.js';
import QuotationRevision from '../models/QuotationRevision.js';
import QuotationShare from '../models/QuotationShare.js';
import QuotationEvent from '../models/QuotationEvent.js';
import QuotationApprovalVerification from '../models/QuotationApprovalVerification.js';
import User from '../models/User.js';
import Lead from '../models/Lead.js';
import Itinerary from '../models/Itinerary.js';
import { loadAuthorizedLeadForStaff } from '../services/leadAccessService.js';
import {
  applyQuotationAiPatch,
  buildQuotationSourceComparison,
  buildQuotationAiImportPreview,
  buildSmartQuotationDraft,
  buildSmartQuotationSummary,
  generateQuotationTextDrafts,
  listImportableItineraries,
  resolveImportSource,
  sanitizeQuotationSourcePlan
} from '../services/quotationAiService.js';
import { getJwtSecret } from '../config/environment.js';
import { renderQuotationPdf, serverPdfEnabled } from '../services/quotationPdfRenderer.js';
import { buildQuotationPolicyDefaults } from '../config/quotationPolicyPresets.js';
import { generateQuotationFieldSuggestion } from '../services/quotationFieldAiService.js';
import { checkGeminiHealth, getGeminiStatus, publicAiError } from '../services/geminiService.js';
import { cloneQuotationAiSampleItinerary } from '../fixtures/quotationAiSampleItinerary.js';
import { sendQuotationVerificationEmail } from '../services/quotationEmailService.js';
import { syncLeadConversionFromBooking } from '../services/leadConversionService.js';
import {
  normalizeQuotationAttachment,
  normalizeQuotationAttachmentPayload
} from '../constants/quotationAttachments.js';
import {
  V2_TEMPLATES,
  buildPublicRevisionDto,
  buildRevisionSnapshot,
  calculateComponentReference,
  createQuotationEvent,
  isCommercialAdmin,
  maskEmail,
  secureToken,
  tokenHash,
  validateQuotationV2,
  verificationCode,
  verificationHash
} from '../services/quotationV2Service.js';

const isDbConnected = () => mongoose.connection?.readyState === 1;
const actorName = (user) => user?.name || user?.fullName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'Staff';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const asNumber = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clone = (value) => JSON.parse(JSON.stringify(value ?? null));
const fail = (res, status, message, details) => res.status(status).json({ success: false, message, ...(details ? { details } : {}) });
const failAi = (res, error) => {
  const response = publicAiError(error);
  return res.status(response.status).json(response.body);
};

const quotationFailure = (res, error, fallback) => {
  if (error?.status === 422) return fail(res, 422, error.message);
  if (error?.name === 'ValidationError') {
    const invalidAttachment = Object.keys(error.errors || {}).some((path) => /attachments|documents/.test(path));
    return fail(res, 422, invalidAttachment ? 'Please correct the attachment category or visibility.' : 'Quotation details contain an invalid value.');
  }
  return fail(res, 500, fallback);
};

const ensureDatabase = (res) => {
  if (isDbConnected()) return true;
  fail(res, 503, 'Quotation service is temporarily unavailable.');
  return false;
};

const findQuotation = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    const byId = await Quotation.findById(id);
    if (byId) return byId;
  }
  return Quotation.findOne({ quotationNumber: id });
};

const ownsQuotation = (quotation, user) => {
  if (!quotation || !user) return false;
  const role = String(user.role || '').toLowerCase();
  if (['super_admin', 'admin', 'operations'].includes(role)) return true;
  const id = String(user._id || user.id || '');
  return [quotation.assignedTo, quotation.createdBy].some((value) => value && String(value) === id);
};

const loadAuthorized = async (req, res, { edit = false } = {}) => {
  const quotation = await findQuotation(req.params.id);
  if (!quotation || quotation.schemaVersion !== 2) {
    fail(res, 404, 'Quotation V2 record not found.');
    return null;
  }
  if (!ownsQuotation(quotation, req.user)) {
    fail(res, 403, edit ? 'You cannot edit this quotation.' : 'You cannot access this quotation.');
    return null;
  }
  return quotation;
};

const generateQuotationNumber = async () => {
  const prefix = `WLX-Q-${new Date().getFullYear()}-`;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = `${prefix}${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    if (!(await Quotation.exists({ quotationNumber: candidate }))) return candidate;
  }
  throw new Error('Unable to allocate a quotation number.');
};

const statusEntry = (status, user, reason = '') => ({
  status,
  changedBy: user?._id || user?.id || null,
  changedByName: actorName(user),
  changedAt: new Date(),
  reason
});

const editableFields = [
  'leadId', 'customerId', 'customerSnapshot', 'tripRequirements', 'tripPreferences', 'personalNote', 'itinerary',
  'hotelOptions', 'transportOptions', 'activities', 'addOns', 'attachments', 'inclusions',
  'exclusions', 'policies', 'termsAndConditions', 'cancellationPolicy', 'paymentTerms',
  'presentationSettings', 'validUntil', 'assignedTo', 'assignedToSnapshot'
];
const AI_FIELD_AUDIT_KEYS = new Set([
  'customer.notes', 'journey.title', 'journey.specialRequests', 'journey.personalNote',
  'itinerary.title', 'itinerary.description', 'itinerary.morning', 'itinerary.afternoon',
  'itinerary.evening', 'itinerary.transferDetails', 'itinerary.missingDescriptions', 'hotel.label', 'hotel.notes',
  'transport.title', 'transport.notes', 'activity.description', 'addon.description',
  'inclusions', 'exclusions', 'policies.all', 'policies.paymentTerms',
  'policies.cancellationPolicy', 'policies.refundNotes', 'policies.travelRequirements',
  'policies.importantInformation', 'policies.termsAndConditions'
]);
const auditAiFields = async (quotationId, actor, fields) => {
  const names = [...new Set((Array.isArray(fields) ? fields : []).filter((field) => AI_FIELD_AUDIT_KEYS.has(field)))];
  if (names.length) await createQuotationEvent({ quotationId, type: 'AI_CONTENT_APPLIED', actor,
    details: { fields: names, source: 'STAFF_REPORTED', pricingChanged: false } });
};

const applyEditableFields = (quotation, input) => {
  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) quotation.set(field, clone(input[field]));
  });
  const adults = asNumber(quotation.tripRequirements?.adults, 0);
  const children = asNumber(quotation.tripRequirements?.children, 0);
  const infants = asNumber(quotation.tripRequirements?.infants, 0);
  const seniors = asNumber(quotation.tripRequirements?.seniors, 0);
  quotation.tripRequirements.totalTravelers = Math.max(1, adults + children + infants + seniors);
  quotation.manualPricing.componentReference = calculateComponentReference(quotation);
};

const activeSmartStatuses = ['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'CHANGES_REQUESTED', 'READY_TO_SHARE'];

const candidateCollections = {
  hotel: { field: 'hotelOptions', id: 'optionId' },
  transport: { field: 'transportOptions', id: 'optionId' },
  activity: { field: 'activities', id: 'activityId' }
};

const commercialCandidateFields = new Set([
  'costPerNight', 'pricePerNight', 'totalCost', 'totalPrice', 'taxRate', 'unitCost', 'unitPrice'
]);

const candidateUpdateFields = {
  hotel: new Set(['label', 'hotelName', 'city', 'location', 'category', 'roomType', 'rooms', 'occupancy', 'mealPlan', 'checkIn', 'checkOut', 'nights', 'imageUrl', 'amenities', 'notes', 'recommendationType', ...commercialCandidateFields]),
  transport: new Set(['mode', 'type', 'title', 'vehicle', 'provider', 'pickup', 'drop', 'route', 'schedule', 'reference', 'cabinClass', 'seatDetails', 'baggage', 'startDate', 'endDate', 'capacity', 'quantity', 'pricingType', 'inclusions', 'notes', 'vehicleMedia', 'documents', ...commercialCandidateFields]),
  activity: new Set(['dayNumber', 'date', 'name', 'description', 'location', 'pricingType', 'quantity', 'isIncluded', 'isOptional', 'attachments', ...commercialCandidateFields])
};

const isAiCandidate = (item, type) => item?.sourceKind === 'AI_PLANNER'
  || String(item?.[candidateCollections[type]?.id] || '').startsWith(type === 'activity' ? 'ai_act_' : `ai_${type}_`);

const protectCandidateReviewMetadata = (quotation, input, { allowCommercial = false } = {}) => {
  Object.entries(candidateCollections).forEach(([, { field, id }]) => {
    if (!Array.isArray(input?.[field])) return;
    const existing = new Map((quotation?.[field] || []).map((item) => [String(item[id]), item]));
    input[field] = input[field].map((item) => {
      const saved = existing.get(String(item?.[id]));
      const protectedItem = saved ? {
        ...item,
        sourceKind: saved.sourceKind || 'MANUAL',
        reviewStatus: saved.reviewStatus || (isAiCandidate(saved, field === 'activities' ? 'activity' : field === 'hotelOptions' ? 'hotel' : 'transport') ? 'SUGGESTED' : 'REVIEWED'),
        sourceLabel: saved.sourceLabel || '',
        sourceDayNumbers: clone(saved.sourceDayNumbers || []),
        reviewedBy: saved.reviewedBy || null,
        reviewedAt: saved.reviewedAt || null
      } : { ...item, sourceKind: 'MANUAL', reviewStatus: 'REVIEWED', sourceLabel: '', sourceDayNumbers: [], reviewedBy: null, reviewedAt: null };
      if (!allowCommercial) {
        commercialCandidateFields.forEach((commercialField) => {
          protectedItem[commercialField] = asNumber(saved?.[commercialField], 0);
        });
      }
      return protectedItem;
    });
  });
  return input;
};

const resolveShare = async (rawToken) => {
  const share = await QuotationShare.findOne({ tokenHash: tokenHash(rawToken) });
  if (!share) return {};
  const [quotation, revision] = await Promise.all([
    Quotation.findById(share.quotationId),
    QuotationRevision.findById(share.revisionId)
  ]);
  return { share, quotation, revision };
};

export const legacyQuotationOnly = async (req, res, next) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await findQuotation(req.params.id);
    if (quotation?.schemaVersion === 2) {
      return fail(res, 409, 'Quotation V2 records must use the versioned content, revision, sharing, approval, and booking endpoints.');
    }
    return next();
  } catch (error) {
    console.error('Legacy Quotation Guard Error:', error);
    return fail(res, 500, 'Unable to validate quotation schema version.');
  }
};

export const legacyPublicDecisionDisabled = (_req, res) => fail(
  res,
  409,
  'This legacy quotation remains readable, but customer decisions require a secure Quotation V2 share link.'
);

const approvalIdentity = (req, share) => {
  const accountEmail = normalizeEmail(req.user?.email);
  if (req.user && accountEmail && accountEmail === normalizeEmail(share.recipientEmail)) {
    return {
      method: 'CUSTOMER_ACCOUNT',
      userId: req.user._id,
      email: accountEmail,
      name: actorName(req.user)
    };
  }
  const candidate = String(req.body?.verificationToken || '');
  if (!candidate) return null;
  try {
    const decoded = jwt.verify(candidate, getJwtSecret());
    if (
      decoded.purpose !== 'quotation-recipient-verification'
      || decoded.shareId !== String(share._id)
      || normalizeEmail(decoded.email) !== normalizeEmail(share.recipientEmail)
    ) return null;
    return { method: 'RECIPIENT_VERIFICATION', userId: null, email: decoded.email, name: decoded.name || decoded.email };
  } catch {
    return null;
  }
};

export const createSmartQuotationFromAiLead = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const lead = await loadAuthorizedLeadForStaff(req.params.leadId, req.user);
    if (lead.leadType !== 'trip_enquiry' || lead.source !== 'ai_planner' || !lead.sourceItineraryId) {
      return fail(res, 422, 'This AI Planner Lead no longer has an available source itinerary.');
    }
    const sourceItineraryId = lead.sourceItineraryId?._id || lead.sourceItineraryId;
    const existing = await Quotation.findOne({
      schemaVersion: 2,
      leadId: lead._id,
      sourceItineraryId,
      status: { $in: activeSmartStatuses }
    }).sort({ updatedAt: -1 });
    if (existing) {
      if (!ownsQuotation(existing, req.user)) return fail(res, 403, 'An active quotation exists for this Lead, but you cannot edit it.');
      return res.json({ success: true, quotation: existing, isExisting: true, buildSummary: buildSmartQuotationSummary(existing) });
    }
    const itinerary = await Itinerary.findById(sourceItineraryId);
    if (!itinerary) return fail(res, 409, 'This AI Planner Lead no longer has an available source itinerary.');
    const userId = req.user._id || req.user.id;
    const draft = buildSmartQuotationDraft({ lead: lead.toObject(), itinerary: itinerary.toObject(), actor: req.user });
    const quotation = new Quotation({
      ...draft,
      schemaVersion: 2,
      quotationNumber: await generateQuotationNumber(),
      version: 1,
      assignedTo: userId,
      assignedToSnapshot: { name: actorName(req.user), email: req.user.email || '', phone: req.user.phone || '' },
      createdBy: userId,
      updatedBy: userId,
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'DRAFT',
      commercialState: 'DRAFT',
      statusHistory: [statusEntry('DRAFT', req.user, 'Smart quotation created from AI Planner Lead')]
    });
    quotation.manualPricing.componentReference = 0;
    await quotation.save();
    await Lead.findByIdAndUpdate(lead._id, { status: 'IN_PROGRESS', $addToSet: { quotations: quotation._id } });
    try {
      await Itinerary.findByIdAndUpdate(sourceItineraryId, { lifecycleStatus: 'QUOTATION_LINKED', retentionExpiresAt: null });
    } catch (lifecycleError) {
      console.error('Smart Quotation Itinerary Lifecycle Update Error:', lifecycleError);
    }
    const buildSummary = buildSmartQuotationSummary(quotation);
    await createQuotationEvent({
      quotationId: quotation._id,
      type: 'SMART_QUOTATION_CREATED',
      actor: req.user,
      details: {
        sourceItineraryId,
        sourceVersion: draft.aiImportProvenance?.sourceVersion || null,
        leadId: lead._id,
        itineraryDays: buildSummary.itineraryDays,
        hotelCandidates: buildSummary.hotelCandidates,
        transportCandidates: buildSummary.transportCandidates,
        activityCandidates: buildSummary.activityCandidates,
        pricingChanged: false
      }
    });
    return res.status(201).json({ success: true, quotation, isExisting: false, buildSummary });
  } catch (error) {
    console.error('Create Smart Quotation Error:', error);
    return fail(res, error.status || 500, error.message || 'Unable to create smart quotation.');
  }
};

export const createQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const payload = protectCandidateReviewMetadata(null, normalizeQuotationAttachmentPayload(req.body || {}), { allowCommercial: isCommercialAdmin(req.user) });
    const linkedLead = payload.leadId ? await loadAuthorizedLeadForStaff(payload.leadId, req.user) : null;
    if (payload.sourceItineraryId) {
      if (linkedLead && String(payload.sourceItineraryId) !== String(linkedLead.sourceItineraryId || '')) {
        return fail(res, 403, 'The source itinerary must belong to the linked lead.');
      }
      if (!linkedLead) await resolveImportSource({ sourceType: 'SAVED_ITINERARY', itineraryId: payload.sourceItineraryId }, req.user);
    }
    const userId = req.user._id || req.user.id;
    const quotation = new Quotation({
      schemaVersion: 2,
      quotationNumber: await generateQuotationNumber(),
      version: 1,
      leadId: payload.leadId || null,
      sourceItineraryId: linkedLead?.sourceItineraryId || payload.sourceItineraryId || null,
      customerId: payload.customerId || null,
      assignedTo: payload.assignedTo || userId,
      assignedToSnapshot: payload.assignedToSnapshot || { name: actorName(req.user), email: req.user.email || '', phone: req.user.phone || '' },
      createdBy: userId,
      updatedBy: userId,
      customerSnapshot: payload.customerSnapshot,
      tripRequirements: payload.tripRequirements,
      tripPreferences: payload.tripPreferences || {},
      itinerary: payload.itinerary || [],
      hotelOptions: payload.hotelOptions || [],
      transportOptions: payload.transportOptions || [],
      activities: payload.activities || [],
      addOns: payload.addOns || [],
      attachments: payload.attachments || [],
      inclusions: payload.inclusions || [],
      exclusions: payload.exclusions || [],
      termsAndConditions: payload.termsAndConditions || [],
      cancellationPolicy: payload.cancellationPolicy || [],
      policies: payload.policies || {},
      personalNote: payload.personalNote || '',
      paymentTerms: payload.paymentTerms || {},
      presentationSettings: payload.presentationSettings || {},
      validUntil: payload.validUntil || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      status: 'DRAFT',
      commercialState: 'DRAFT',
      statusHistory: [statusEntry('DRAFT', req.user, 'Quotation V2 draft created')]
    });
    quotation.manualPricing.componentReference = calculateComponentReference(quotation);
    if (isCommercialAdmin(req.user) && payload.manualPricing) {
      const commercial = payload.manualPricing;
      quotation.manualPricing.currency = commercial.currency || 'INR';
      quotation.manualPricing.finalCustomerPrice = asNumber(commercial.finalCustomerPrice);
      quotation.manualPricing.depositAmount = asNumber(commercial.depositAmount);
      quotation.manualPricing.balanceAmount = Math.max(0, quotation.manualPricing.finalCustomerPrice - quotation.manualPricing.depositAmount);
      quotation.manualPricing.adjustments = clone(commercial.adjustments || []);
      quotation.manualPricing.paymentSchedule = clone(commercial.paymentSchedule || []);
      quotation.manualPricing.priceNotes = commercial.priceNotes || '';
    }
    await quotation.save();
    if (quotation.leadId) {
      await Lead.findByIdAndUpdate(quotation.leadId, {
        status: 'IN_PROGRESS',
        $addToSet: { quotations: quotation._id }
      });
    }
    await createQuotationEvent({ quotationId: quotation._id, type: 'QUOTATION_CREATED', actor: req.user, details: { schemaVersion: 2 } });
    await auditAiFields(quotation._id, req.user, req.body?.aiAppliedFields);
    return res.status(201).json({ success: true, quotation, validation: validateQuotationV2(quotation) });
  } catch (error) {
    console.error('Create Quotation V2 Error:', error);
    return quotationFailure(res, error, 'Unable to create quotation.');
  }
};

export const previewQuotationAiImport = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const preview = await buildQuotationAiImportPreview({
      request: req.body || {},
      user: req.user
    });
    return res.json({ success: true, ...preview });
  } catch (error) {
    console.error('Quotation AI Import Preview Error:', error);
    return fail(res, error.status || 500, error.message || 'Unable to build AI itinerary import preview.');
  }
};

export const getImportableAiItineraries = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const itineraries = await listImportableItineraries(req.user, req.query.search);
    return res.json({ success: true, itineraries });
  } catch (error) {
    return fail(res, error.status || 500, error.message || 'Unable to list importable itineraries.');
  }
};

export const getQuotationPolicyDefaults = (req, res) => res.json({
  success: true,
  defaults: buildQuotationPolicyDefaults(req.body?.quotation || {})
});

export const getQuotationAiStatus = (_req, res) => res.json({
  success: true,
  ...getGeminiStatus({ purpose: 'quotation' })
});

export const checkQuotationAiStatus = async (_req, res) => {
  try {
    return res.json({ success: true, ...(await checkGeminiHealth({ purpose: 'quotation' })) });
  } catch (error) {
    return failAi(res, error);
  }
};

export const getQuotationAiSample = (_req, res) => {
  const sample = cloneQuotationAiSampleItinerary();
  if (String(_req.query?.download || '') === '1') {
    res.setHeader('Content-Disposition', 'attachment; filename="wanderluxe-quotation-ai-sample.json"');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.send(JSON.stringify(sample, null, 2));
  }
  return res.json({ success: true, sample });
};

export const suggestQuotationAiField = async (req, res) => {
  try {
    if (req.params.id) {
      if (!ensureDatabase(res)) return;
      const quotation = await loadAuthorized(req, res, { edit: true });
      if (!quotation) return;
      if (!['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'CHANGES_REQUESTED'].includes(quotation.status) || quotation.manualPricing?.finalizedAt) {
        return fail(res, 409, 'This revision is frozen. Create a new revision before using AI assistance.');
      }
    }
    const result = await generateQuotationFieldSuggestion({
      quotation: req.body?.quotation || {},
      field: req.body?.field,
      index: req.body?.index ?? 0,
      mode: req.body?.mode || 'generate'
    });
    return res.json({ success: true, ...result });
  } catch (error) {
    return error?.code?.startsWith('AI_')
      ? failAi(res, error)
      : fail(res, error.status || 500, error.message || 'Unable to prepare AI suggestion.');
  }
};

export const applyQuotationAiImport = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (!['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'CHANGES_REQUESTED'].includes(quotation.status) || quotation.manualPricing?.finalizedAt) {
      return fail(res, 409, 'This revision is frozen. Create a new revision before importing AI itinerary content.');
    }
    const source = req.body?.source || {};
    const sourceRequest = {
      sourceType: source.type,
      itineraryId: source.itineraryId,
      leadId: source.leadId,
      shareToken: source.shareToken,
      itineraryPayload: source.itineraryPayload
    };
    const preview = await buildQuotationAiImportPreview({ request: sourceRequest, user: req.user });
    if (req.body?.expectedSourceUpdatedAt && preview.source.updatedAt
      && new Date(req.body.expectedSourceUpdatedAt).getTime() !== new Date(preview.source.updatedAt).getTime()) {
      return fail(res, 409, 'The source plan changed since preview. Refresh the import preview before applying.');
    }
    const choices = req.body?.candidateSelections || {};
    const selectedHotels = new Set(Array.isArray(choices.hotelCandidateIds) ? choices.hotelCandidateIds : []);
    const selectedActivities = new Set(Array.isArray(choices.activityCandidateIds) ? choices.activityCandidateIds : []);
    preview.deterministicPatch.hotelOptions = preview.deterministicPatch.hotelOptions.filter((item) => selectedHotels.has(item.optionId));
    preview.deterministicPatch.activities = preview.deterministicPatch.activities.filter((item) => selectedActivities.has(item.activityId));
    preview.deterministicPatch.transportOptions = choices.includeTransportCandidate === true ? preview.deterministicPatch.transportOptions : [];
    const sections = req.body?.selectedSections;
    if (!Array.isArray(sections) || !sections.length || sections.some((section) => !['journey', 'itinerary', 'hotels', 'transport', 'activities', 'inclusions', 'terms', 'presentation'].includes(section))) {
      return fail(res, 422, 'Select valid import sections.');
    }
    if (!['FILL_EMPTY_ONLY', 'REPLACE_SELECTED_SECTIONS'].includes(req.body?.mergeMode || 'FILL_EMPTY_ONLY')) {
      return fail(res, 422, 'Select a valid merge mode.');
    }
    const result = applyQuotationAiPatch({
      quotation: quotation.toObject(),
      patch: preview.deterministicPatch,
      mergeMode: req.body?.mergeMode || 'FILL_EMPTY_ONLY',
      selectedSections: sections,
      conflictChoices: req.body?.conflictChoices || {}
    });
    applyEditableFields(quotation, result.quotation);
    if (result.quotation.planningReference) quotation.planningReference = clone(result.quotation.planningReference);
    if (preview.source.itineraryId) quotation.sourceItineraryId = preview.source.itineraryId;
    quotation.aiImportProvenance = {
      sourceType: preview.source.type,
      sourceTitle: preview.source.title,
      sourceDestination: preview.source.destination,
      sourceUpdatedAt: preview.source.updatedAt || null,
      sourceVersion: preview.source.version || null,
      sourceGeneratedAt: preview.source.generatedAt || null,
      buildMode: 'REIMPORT',
      importedAt: new Date(),
      importedBy: req.user._id
    };
    quotation.updatedBy = req.user._id;
    await quotation.save();
    await createQuotationEvent({
      quotationId: quotation._id,
      type: 'AI_ITINERARY_IMPORTED',
      actor: req.user,
      details: {
        sourceItineraryId: preview.source.itineraryId || null,
        sourceType: preview.source.type,
        mergeMode: req.body?.mergeMode || 'FILL_EMPTY_ONLY',
        sectionsApplied: result.appliedSections,
        candidateCounts: {
          hotels: preview.deterministicPatch.hotelOptions.length,
          activities: preview.deterministicPatch.activities.length,
          transport: preview.deterministicPatch.transportOptions.length
        }
      }
    });
    return res.json({ success: true, quotation, validation: validateQuotationV2(quotation), ...result });
  } catch (error) {
    console.error('Quotation AI Import Apply Error:', error);
    return fail(res, error.status || 500, error.message || 'Unable to apply AI itinerary import.');
  }
};

export const draftQuotationAiText = async (req, res) => {
  try {
    if (req.params.id) {
      if (!ensureDatabase(res)) return;
      const quotation = await loadAuthorized(req, res, { edit: true });
      if (!quotation) return;
      if (!['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'CHANGES_REQUESTED'].includes(quotation.status) || quotation.manualPricing?.finalizedAt) {
        return fail(res, 409, 'This revision is frozen. Create a new revision before using AI assistance.');
      }
    }
    const drafts = await generateQuotationTextDrafts({
      quotation: req.body?.quotation || {},
      itinerary: req.body?.itinerary || null,
      fields: req.body?.fields || [],
      user: req.user
    });
    return res.json({ success: true, ...drafts });
  } catch (error) {
    console.error('Quotation AI Text Draft Error:', error);
    return error?.code?.startsWith('AI_')
      ? failAi(res, error)
      : fail(res, error.status || 500, error.message || 'Unable to draft quotation text.');
  }
};

export const updateQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (!['DRAFT', 'CONTENT_READY', 'AWAITING_PRICING', 'CHANGES_REQUESTED'].includes(quotation.status) || quotation.manualPricing?.finalizedAt) {
      return fail(res, 409, 'This revision is frozen. Create a new revision before editing proposal content.');
    }
    if (!isCommercialAdmin(req.user) && Object.prototype.hasOwnProperty.call(req.body || {}, 'manualPricing')) {
      return fail(res, 403, 'Only Admin or Super Admin can edit commercial pricing.');
    }
    const normalizedInput = protectCandidateReviewMetadata(quotation, normalizeQuotationAttachmentPayload(req.body || {}), { allowCommercial: isCommercialAdmin(req.user) });
    applyEditableFields(quotation, normalizedInput);
    if (isCommercialAdmin(req.user) && req.body?.manualPricing) {
      const commercial = req.body.manualPricing;
      quotation.manualPricing.currency = commercial.currency || quotation.manualPricing.currency || 'INR';
      quotation.manualPricing.finalCustomerPrice = asNumber(commercial.finalCustomerPrice);
      quotation.manualPricing.depositAmount = asNumber(commercial.depositAmount);
      quotation.manualPricing.balanceAmount = Math.max(0, quotation.manualPricing.finalCustomerPrice - quotation.manualPricing.depositAmount);
      quotation.manualPricing.adjustments = clone(commercial.adjustments || []);
      quotation.manualPricing.paymentSchedule = clone(commercial.paymentSchedule || []);
      quotation.manualPricing.priceNotes = commercial.priceNotes || '';
    }
    quotation.updatedBy = req.user._id;
    await quotation.save();
    await auditAiFields(quotation._id, req.user, req.body?.aiAppliedFields);
    await createQuotationEvent({ quotationId: quotation._id, type: 'DRAFT_UPDATED', actor: req.user, details: { version: quotation.version } });
    return res.json({ success: true, quotation, validation: validateQuotationV2(quotation) });
  } catch (error) {
    console.error('Update Quotation V2 Error:', error);
    return quotationFailure(res, error, 'Unable to update quotation.');
  }
};

export const requestQuotationPricing = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (quotation.manualPricing?.finalizedAt) return fail(res, 409, 'Pricing is already finalized for this revision.');
    const validation = validateQuotationV2(quotation, { requireCandidateReview: true });
    if (validation.errors.length) return fail(res, 422, 'Complete the required proposal details before requesting pricing.', validation);
    quotation.status = 'AWAITING_PRICING';
    quotation.commercialState = 'AWAITING_PRICING';
    quotation.updatedBy = req.user._id;
    quotation.statusHistory.push(statusEntry('AWAITING_PRICING', req.user, req.body?.notes || 'Pricing requested'));
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, type: 'PRICING_REQUESTED', actor: req.user, details: { notes: req.body?.notes || '' } });
    return res.json({ success: true, quotation, validation });
  } catch (error) {
    console.error('Request Quotation Pricing Error:', error);
    return fail(res, 500, 'Unable to request pricing.');
  }
};

export const finalizeQuotationPricing = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (!isCommercialAdmin(req.user)) return fail(res, 403, 'Only Admin or Super Admin can finalize customer pricing.');
    if (await QuotationRevision.exists({ quotationId: quotation._id, version: quotation.version })) {
      return fail(res, 409, 'This version has already been finalized. Create a new revision to change it.');
    }
    const input = req.body?.manualPricing || req.body || {};
    const finalPrice = asNumber(input.finalCustomerPrice);
    const deposit = asNumber(input.depositAmount);
    quotation.manualPricing = {
      currency: input.currency || 'INR',
      componentReference: calculateComponentReference(quotation),
      finalCustomerPrice: finalPrice,
      depositAmount: deposit,
      balanceAmount: Math.max(0, finalPrice - deposit),
      adjustments: clone(input.adjustments || []),
      paymentSchedule: clone(input.paymentSchedule || []),
      priceNotes: input.priceNotes || '',
      finalizedBy: req.user._id,
      finalizedByName: actorName(req.user),
      finalizedAt: new Date()
    };
    const validation = validateQuotationV2(quotation, { forFinalization: true });
    if (validation.errors.length) return fail(res, 422, 'Pricing cannot be finalized until validation issues are resolved.', validation);
    quotation.pricing.finalTotal = finalPrice;
    quotation.pricing.subtotal = quotation.manualPricing.componentReference;
    quotation.pricing.depositRequired = deposit;
    quotation.pricing.balanceAmount = quotation.manualPricing.balanceAmount;
    quotation.pricing.perPersonPrice = Math.round(finalPrice / Math.max(1, quotation.tripRequirements.totalTravelers || 1));
    quotation.status = 'READY_TO_SHARE';
    quotation.commercialState = 'READY_TO_SHARE';
    quotation.updatedBy = req.user._id;
    quotation.statusHistory.push(statusEntry('READY_TO_SHARE', req.user, 'Manual price finalized'));
    await quotation.save();
    const revision = await QuotationRevision.create({
      quotationId: quotation._id,
      version: quotation.version,
      status: 'FINALIZED',
      snapshot: buildRevisionSnapshot(quotation),
      templateKey: quotation.presentationSettings?.template || 'journey',
      finalCustomerPrice: finalPrice,
      currency: quotation.manualPricing.currency,
      createdBy: req.user._id,
      createdByName: actorName(req.user),
      finalizedBy: req.user._id,
      finalizedByName: actorName(req.user),
      finalizedAt: quotation.manualPricing.finalizedAt
    });
    quotation.currentRevisionId = revision._id;
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, type: 'PRICING_FINALIZED', actor: req.user, details: { version: revision.version, finalCustomerPrice: finalPrice, currency: revision.currency } });
    return res.status(201).json({ success: true, quotation, revision, validation });
  } catch (error) {
    console.error('Finalize Quotation Pricing Error:', error);
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to finalize pricing.');
  }
};

export const createQuotationRevisionV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (!quotation.currentRevisionId) return fail(res, 409, 'Finalize the first version before creating a revision.');
    const previous = await QuotationRevision.findById(quotation.currentRevisionId);
    if (previous && previous.status !== 'APPROVED') {
      previous.status = 'SUPERSEDED';
      previous.supersededAt = new Date();
      await previous.save();
    }
    quotation.version += 1;
    quotation.currentRevisionId = null;
    quotation.manualPricing.finalizedBy = null;
    quotation.manualPricing.finalizedByName = '';
    quotation.manualPricing.finalizedAt = null;
    quotation.status = 'DRAFT';
    quotation.commercialState = 'DRAFT';
    quotation.updatedBy = req.user._id;
    quotation.statusHistory.push(statusEntry('DRAFT', req.user, req.body?.reason || `Revision ${quotation.version} created`));
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: previous?._id, type: 'REVISION_CREATED', actor: req.user, details: { fromVersion: quotation.version - 1, version: quotation.version, reason: req.body?.reason || '' } });
    return res.status(201).json({ success: true, quotation });
  } catch (error) {
    console.error('Create Quotation Revision V2 Error:', error);
    return fail(res, 500, 'Unable to create a quotation revision.');
  }
};

export const getQuotationRevisionsV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res);
    if (!quotation) return;
    const revisions = await QuotationRevision.find({ quotationId: quotation._id }).sort({ version: -1 }).lean();
    return res.json({ success: true, revisions });
  } catch (error) {
    console.error('List Quotation Revisions V2 Error:', error);
    return fail(res, 500, 'Unable to load quotation revisions.');
  }
};

export const downloadQuotationPdfV2 = async (req, res) => {
  if (!serverPdfEnabled()) return fail(res, 503, 'Server PDF rendering is unavailable.');
  const started = Date.now();
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res);
    if (!quotation) return;
    const templateKey = req.body?.templateKey;
    if (!V2_TEMPLATES.includes(templateKey)) return fail(res, 422, 'Select a valid quotation template.');
    const revisionId = req.body?.revisionId || quotation.currentRevisionId;
    if (!mongoose.Types.ObjectId.isValid(revisionId)) return fail(res, 409, 'Finalize this quotation before downloading the server PDF.');
    const revision = await QuotationRevision.findOne({ _id: revisionId, quotationId: quotation._id });
    if (!revision || revision.status === 'DRAFT_SNAPSHOT') return fail(res, 409, 'A finalized revision is required for server PDF rendering.');
    const share = {
      _id: revision._id, templateKey, allowPdfDownload: true, allowAttachments: true,
      requireEmailVerification: false, approvalEnabled: false, recipientEmail: '',
      isActive: true, expiresAt: new Date('2100-01-01'), revokedAt: null
    };
    const dto = buildPublicRevisionDto({ quotation, revision, share });
    dto.superseded = revision.status === 'SUPERSEDED' || Boolean(quotation.latestSharedRevisionId && String(quotation.latestSharedRevisionId) !== String(revision._id));
    const { bytes, pageCount } = await renderQuotationPdf(dto, templateKey);
    const basename = String(quotation.quotationNumber || 'Quotation').replace(/[^A-Za-z0-9_-]/g, '_');
    const fileName = `WanderLuxe_${basename}_v${revision.version}_${templateKey}.pdf`;
    console.info('Quotation PDF rendered', { quotationId: String(quotation._id), revisionId: String(revision._id), templateKey, pageCount, bytes: bytes.length, durationMs: Date.now() - started });
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${fileName}"`, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
    return res.send(bytes);
  } catch (error) {
    console.error('Quotation PDF rendering failed', { code: error.code || 'PDF_RENDER_ERROR', durationMs: Date.now() - started });
    return fail(res, error.code === 'PDF_LAYOUT_OVERFLOW' ? 422 : 503, error.code === 'PDF_LAYOUT_OVERFLOW' ? 'Quotation PDF content exceeds the page bounds.' : 'Server PDF rendering is temporarily unavailable.');
  }
};

export const createQuotationShare = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    const revision = await QuotationRevision.findById(quotation.currentRevisionId);
    if (!revision || !['FINALIZED', 'SHARED'].includes(revision.status)) return fail(res, 409, 'Finalize the current revision before sharing.');
    const validation = validateQuotationV2(quotation, { forShare: true });
    if (validation.errors.length) return fail(res, 422, 'Quotation is not ready to share.', validation);
    const recipientEmail = normalizeEmail(req.body?.recipientEmail || quotation.customerSnapshot.email);
    if (recipientEmail !== normalizeEmail(quotation.customerSnapshot.email)) {
      return fail(res, 422, 'The share recipient must match the quotation customer email.');
    }
    const expiresAt = new Date(req.body?.expiresAt || quotation.validUntil);
    if (Number.isNaN(expiresAt.getTime()) || expiresAt <= new Date()) return fail(res, 422, 'Share expiry must be a future date.');
    const templateKey = V2_TEMPLATES.includes(req.body?.templateKey) ? req.body.templateKey : (revision.templateKey || 'journey');
    const rawToken = secureToken();
    const share = await QuotationShare.create({
      quotationId: quotation._id,
      revisionId: revision._id,
      version: revision.version,
      recipientEmail,
      tokenHash: tokenHash(rawToken),
      tokenPrefix: rawToken.slice(0, 8),
      templateKey,
      createdBy: req.user._id,
      createdByName: actorName(req.user),
      expiresAt,
      allowPdfDownload: req.body?.allowPdfDownload !== false,
      allowAttachments: req.body?.allowAttachments !== false,
      requireEmailVerification: req.body?.requireEmailVerification !== false,
      approvalEnabled: req.body?.approvalEnabled !== false
    });
    revision.status = 'SHARED';
    await revision.save();
    quotation.status = 'SHARED';
    quotation.commercialState = 'SHARED';
    quotation.latestSharedRevisionId = revision._id;
    quotation.shareSummary.shareCount = asNumber(quotation.shareSummary?.shareCount) + 1;
    quotation.shareSummary.activeShareCount = asNumber(quotation.shareSummary?.activeShareCount) + 1;
    quotation.statusHistory.push(statusEntry('SHARED', req.user, `Version ${revision.version} shared`));
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, shareId: share._id, type: 'SHARE_CREATED', actor: req.user, details: { version: revision.version, recipientEmail: maskEmail(recipientEmail), expiresAt, templateKey } });
    const origin = String(process.env.FRONTEND_URL || req.get('origin') || '').replace(/\/$/, '');
    return res.status(201).json({ success: true, share: { ...share.toObject(), tokenHash: undefined }, token: rawToken, publicUrl: `${origin}/quotation/${rawToken}` });
  } catch (error) {
    console.error('Create Quotation Share Error:', error);
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to create a share link.');
  }
};

export const getQuotationShares = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res);
    if (!quotation) return;
    const shares = await QuotationShare.find({ quotationId: quotation._id }).select('-tokenHash').sort({ createdAt: -1 }).lean();
    return res.json({ success: true, shares });
  } catch (error) {
    console.error('List Quotation Shares Error:', error);
    return fail(res, 500, 'Unable to load share history.');
  }
};

export const revokeQuotationShare = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    const share = await QuotationShare.findOne({ _id: req.params.shareId, quotationId: quotation._id });
    if (!share) return fail(res, 404, 'Share link not found.');
    if (!share.isActive) return res.json({ success: true, share, message: 'Share link is already inactive.' });
    share.isActive = false;
    share.revokedAt = new Date();
    share.revokedBy = req.user._id;
    share.revokeReason = String(req.body?.reason || '').trim();
    await share.save();
    quotation.shareSummary.activeShareCount = Math.max(0, quotation.shareSummary.activeShareCount - 1);
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: share.revisionId, shareId: share._id, type: 'SHARE_REVOKED', actor: req.user, details: { reason: share.revokeReason } });
    return res.json({ success: true, share });
  } catch (error) {
    console.error('Revoke Quotation Share Error:', error);
    return fail(res, 500, 'Unable to revoke share link.');
  }
};

export const getQuotationEvents = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res);
    if (!quotation) return;
    const limit = Math.min(100, Math.max(1, asNumber(req.query.limit, 50)));
    const events = await QuotationEvent.find({ quotationId: quotation._id }).sort({ createdAt: -1 }).limit(limit).lean();
    return res.json({ success: true, events });
  } catch (error) {
    console.error('List Quotation Events Error:', error);
    return fail(res, 500, 'Unable to load quotation history.');
  }
};

export const getQuotationSourcePlan = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res);
    if (!quotation) return;
    if (!quotation.sourceItineraryId) return fail(res, 404, 'This quotation does not have a linked source plan.');
    const itinerary = await Itinerary.findById(quotation.sourceItineraryId);
    if (!itinerary) return fail(res, 404, 'The linked source plan is no longer available.');
    const sourcePlan = sanitizeQuotationSourcePlan(itinerary.toObject());
    const sourceChanged = Boolean(
      (sourcePlan.version && sourcePlan.version !== quotation.aiImportProvenance?.sourceVersion)
      || (sourcePlan.updatedAt && (!quotation.aiImportProvenance?.sourceUpdatedAt
        || new Date(sourcePlan.updatedAt) > new Date(quotation.aiImportProvenance.sourceUpdatedAt)))
    );
    return res.json({ success: true, sourcePlan, sourceChanged });
  } catch (error) {
    console.error('Get Quotation Source Plan Error:', error);
    return fail(res, 500, 'Unable to load the source AI plan.');
  }
};

export const compareQuotationSourcePlan = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res);
    if (!quotation) return;
    if (!quotation.sourceItineraryId) return fail(res, 404, 'This quotation does not have a linked source plan.');
    const itinerary = await Itinerary.findById(quotation.sourceItineraryId);
    if (!itinerary) return fail(res, 404, 'The linked source plan is no longer available.');
    return res.json({ success: true, ...buildQuotationSourceComparison(quotation.toObject(), itinerary.toObject()) });
  } catch (error) {
    console.error('Compare Quotation Source Plan Error:', error);
    return fail(res, 500, 'Unable to compare the source AI plan.');
  }
};

export const reviewQuotationCandidate = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (!activeSmartStatuses.includes(quotation.status) || quotation.manualPricing?.finalizedAt) {
      return fail(res, 409, 'This revision is frozen. Create a new revision before reviewing suggestions.');
    }
    const type = String(req.params.type || '').toLowerCase();
    const config = candidateCollections[type];
    if (!config) return fail(res, 422, 'Select a valid candidate type.');
    const candidate = quotation[config.field]?.find((item) => String(item[config.id]) === String(req.params.candidateId));
    if (!candidate || !isAiCandidate(candidate, type)) return fail(res, 404, 'AI Planner candidate not found.');
    const action = String(req.body?.action || '').toUpperCase();
    if (!['USE', 'DISMISS', 'RESTORE'].includes(action)) return fail(res, 422, 'Select USE, DISMISS, or RESTORE.');
    const updates = req.body?.updates && typeof req.body.updates === 'object' && !Array.isArray(req.body.updates) ? req.body.updates : {};
    const submittedCommercialFields = Object.keys(updates).filter((key) => commercialCandidateFields.has(key));
    if (submittedCommercialFields.length && !isCommercialAdmin(req.user)) {
      return fail(res, 403, 'Only Admin or Super Admin can edit commercial pricing.');
    }
    Object.entries(updates).forEach(([key, value]) => {
      if (candidateUpdateFields[type].has(key)) candidate.set(key, clone(value));
    });
    candidate.sourceKind = 'AI_PLANNER';
    if (action === 'USE') {
      candidate.reviewStatus = 'REVIEWED';
      candidate.selected = true;
      candidate.reviewedBy = req.user._id;
      candidate.reviewedAt = new Date();
    } else if (action === 'DISMISS') {
      candidate.reviewStatus = 'DISMISSED';
      candidate.selected = false;
      candidate.reviewedBy = req.user._id;
      candidate.reviewedAt = new Date();
    } else {
      candidate.reviewStatus = 'SUGGESTED';
      candidate.selected = false;
      candidate.reviewedBy = null;
      candidate.reviewedAt = null;
    }
    quotation.updatedBy = req.user._id;
    quotation.manualPricing.componentReference = calculateComponentReference(quotation);
    await quotation.save();
    await createQuotationEvent({
      quotationId: quotation._id,
      type: action === 'DISMISS' ? 'AI_CANDIDATE_DISMISSED' : 'AI_CANDIDATE_REVIEWED',
      actor: req.user,
      details: { type, candidateId: candidate[config.id], action }
    });
    return res.json({ success: true, quotation, candidate, validation: validateQuotationV2(quotation) });
  } catch (error) {
    console.error('Review Quotation Candidate Error:', error);
    return quotationFailure(res, error, 'Unable to review this suggestion.');
  }
};

export const duplicateQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const source = await loadAuthorized(req, res);
    if (!source) return;
    const value = source.toObject();
    const copy = new Quotation({
      ...value,
      _id: undefined,
      quotationNumber: await generateQuotationNumber(),
      version: 1,
      createdBy: req.user._id,
      updatedBy: req.user._id,
      assignedTo: req.user._id,
      status: 'DRAFT',
      commercialState: 'DRAFT',
      currentRevisionId: null,
      latestSharedRevisionId: null,
      approvedRevisionId: null,
      bookingId: null,
      bookingCode: '',
      publicShare: undefined,
      revisions: [],
      priceSnapshot: null,
      approvedSnapshot: null,
      shareSummary: {},
      pricing: {},
      auditTrail: [],
      createdAt: undefined,
      updatedAt: undefined,
      __v: undefined,
      statusHistory: [statusEntry('DRAFT', req.user, `Duplicated from ${source.quotationNumber}`)],
      manualPricing: {
        ...clone(value.manualPricing || {}),
        finalCustomerPrice: 0,
        depositAmount: 0,
        balanceAmount: 0,
        paymentSchedule: [],
        finalizedBy: null,
        finalizedByName: '',
        finalizedAt: null
      }
    });
    await copy.save();
    await createQuotationEvent({ quotationId: copy._id, type: 'QUOTATION_DUPLICATED', actor: req.user, details: { sourceQuotationId: source._id, sourceQuotationNumber: source.quotationNumber } });
    return res.status(201).json({ success: true, quotation: copy });
  } catch (error) {
    console.error('Duplicate Quotation V2 Error:', error);
    return quotationFailure(res, error, 'Unable to duplicate quotation.');
  }
};

export const addQuotationAttachment = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (quotation.manualPricing?.finalizedAt) return fail(res, 409, 'This revision is frozen. Create a new revision before adding documents.');
    const input = normalizeQuotationAttachment(req.body || {});
    if (!input.secureUrl || !input.mimeType || !String(input.title || input.fileName || '').trim()) return fail(res, 422, 'Document title, file type, and secure URL are required.');
    const attachment = {
      id: input.id || `qdoc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      category: input.category,
      sectionType: input.sectionType || 'GENERAL',
      sectionId: input.sectionId || '',
      title: input.title || input.fileName,
      fileName: input.fileName || '',
      mimeType: input.mimeType,
      size: asNumber(input.size),
      storageProvider: input.storageProvider || 'cloudinary',
      publicId: input.publicId || '',
      secureUrl: input.secureUrl,
      visibility: input.visibility,
      bookingReference: input.bookingReference || '',
      passengerName: input.passengerName || '',
      uploadedBy: req.user._id,
      uploadedByName: actorName(req.user),
      uploadedAt: new Date()
    };
    quotation.attachments.push(attachment);
    quotation.updatedBy = req.user._id;
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, type: 'ATTACHMENT_ADDED', actor: req.user, details: { attachmentId: attachment.id, category: attachment.category, visibility: attachment.visibility } });
    return res.status(201).json({ success: true, attachment, quotation });
  } catch (error) {
    console.error('Add Quotation Attachment Error:', error);
    return quotationFailure(res, error, 'Unable to attach document.');
  }
};

export const deleteQuotationAttachment = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (quotation.manualPricing?.finalizedAt) return fail(res, 409, 'This revision is frozen. Create a new revision before removing documents.');
    const before = quotation.attachments.length;
    quotation.attachments = quotation.attachments.filter((item) => item.id !== req.params.attachmentId);
    if (quotation.attachments.length === before) return fail(res, 404, 'Attachment not found.');
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, type: 'ATTACHMENT_REMOVED', actor: req.user, details: { attachmentId: req.params.attachmentId } });
    return res.json({ success: true, quotation });
  } catch (error) {
    console.error('Delete Quotation Attachment Error:', error);
    return fail(res, 500, 'Unable to remove attachment.');
  }
};

export const getPublicQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const { share, quotation, revision } = await resolveShare(req.params.token);
    if (!share || !quotation || !revision) return fail(res, 404, 'Quotation proposal not found.');
    if (!share.isActive || share.revokedAt) return fail(res, 410, 'This quotation link has been revoked.', { state: 'REVOKED' });
    const now = new Date();
    const viewedShare = await QuotationShare.findByIdAndUpdate(share._id, [{
      $set: {
        viewCount: { $add: [{ $ifNull: ['$viewCount', 0] }, 1] },
        firstViewedAt: { $ifNull: ['$firstViewedAt', now] },
        lastViewedAt: now
      }
    }], { new: true });
    await Quotation.updateOne({ _id: quotation._id }, { $inc: { 'shareSummary.viewCount': 1 }, $set: { 'shareSummary.lastViewedAt': now } });
    quotation.shareSummary.viewCount = asNumber(quotation.shareSummary?.viewCount) + 1;
    quotation.shareSummary.lastViewedAt = now;
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, shareId: share._id, type: 'PUBLIC_VIEWED', actorType: 'CUSTOMER', details: { viewCount: viewedShare.viewCount } });
    return res.json({ success: true, quotation: buildPublicRevisionDto({ quotation, revision, share: viewedShare }) });
  } catch (error) {
    console.error('Get Public Quotation V2 Error:', error);
    return fail(res, 500, 'Unable to load quotation proposal.');
  }
};

export const requestQuotationVerification = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const { share, quotation, revision } = await resolveShare(req.params.token);
    if (!share || !quotation || !revision || !share.isActive || share.revokedAt || share.expiresAt <= new Date()) {
      return fail(res, 404, 'Quotation proposal is unavailable.');
    }
    const email = normalizeEmail(req.body?.email);
    const generic = { success: true, message: 'If the email matches the recipient, a verification code has been sent.' };
    if (!email || email !== normalizeEmail(share.recipientEmail)) return res.status(202).json(generic);
    const code = verificationCode();
    await QuotationApprovalVerification.create({
      quotationId: quotation._id,
      revisionId: revision._id,
      shareId: share._id,
      email,
      codeHash: verificationHash(code),
      expiresAt: new Date(Date.now() + 10 * 60 * 1000)
    });
    await sendQuotationVerificationEmail({ email, code, quotationNumber: quotation.quotationNumber, expiresMinutes: 10 });
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, shareId: share._id, type: 'VERIFICATION_REQUESTED', actorType: 'CUSTOMER', details: { email: maskEmail(email) } });
    return res.status(202).json(generic);
  } catch (error) {
    console.error('Request Quotation Verification Error:', error);
    return fail(res, error.status || 500, error.message || 'Unable to send verification code.');
  }
};

export const verifyQuotationRecipient = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const { share, quotation, revision } = await resolveShare(req.params.token);
    if (!share || !quotation || !revision || !share.isActive || share.revokedAt || share.expiresAt <= new Date()) return fail(res, 404, 'Quotation proposal is unavailable.');
    const email = normalizeEmail(req.body?.email);
    const record = await QuotationApprovalVerification.findOne({ shareId: share._id, email, usedAt: null }).sort({ createdAt: -1 });
    if (!record || record.expiresAt <= new Date() || record.attempts >= record.maxAttempts) return fail(res, 422, 'Verification code is invalid or expired.');
    const submitted = verificationHash(String(req.body?.code || ''));
    const valid = crypto.timingSafeEqual(Buffer.from(submitted), Buffer.from(record.codeHash));
    record.attempts += 1;
    if (!valid) {
      await record.save();
      return fail(res, 422, 'Verification code is invalid or expired.');
    }
    record.verifiedAt = new Date();
    record.usedAt = new Date();
    await record.save();
    const verificationToken = jwt.sign({ purpose: 'quotation-recipient-verification', shareId: String(share._id), revisionId: String(revision._id), email, name: quotation.customerSnapshot?.name || email }, getJwtSecret(), { expiresIn: '15m' });
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, shareId: share._id, type: 'RECIPIENT_VERIFIED', actorType: 'CUSTOMER', details: { email: maskEmail(email) } });
    return res.json({ success: true, verificationToken, expiresInSeconds: 900 });
  } catch (error) {
    console.error('Verify Quotation Recipient Error:', error);
    return fail(res, 500, 'Unable to verify recipient.');
  }
};

export const decidePublicQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const { share, quotation, revision } = await resolveShare(req.params.token);
    if (!share || !quotation || !revision) return fail(res, 404, 'Quotation proposal not found.');
    if (!share.isActive || share.revokedAt || share.expiresAt <= new Date()) return fail(res, 410, 'This quotation link is no longer active.');
    if (!share.approvalEnabled) return fail(res, 403, 'Customer decisions are disabled for this share link.');
    if (String(quotation.latestSharedRevisionId || '') !== String(revision._id)) return fail(res, 409, 'A newer quotation revision is available. Please use the latest link.');
    const identity = approvalIdentity(req, share);
    if (!identity) return fail(res, 401, 'Sign in as the recipient or complete email verification to continue.');
    const decision = String(req.body?.decision || '').toUpperCase();
    if (!['APPROVED', 'CHANGES_REQUESTED', 'REJECTED'].includes(decision)) return fail(res, 422, 'Choose approve, request changes, or reject.');
    if (revision.customerDecision?.type) {
      if (revision.customerDecision.type === decision) return res.json({ success: true, quotation: buildPublicRevisionDto({ quotation, revision, share }), idempotent: true });
      return fail(res, 409, 'A decision has already been recorded for this revision.');
    }
    if (decision === 'APPROVED' && req.body?.termsAccepted !== true) return fail(res, 422, 'You must accept the quotation terms before approval.');
    const now = new Date();
    revision.customerDecision = { type: decision, notes: String(req.body?.notes || '').trim(), decidedAt: now };
    revision.status = decision;
    if (decision === 'APPROVED') {
      revision.approval = {
        method: identity.method,
        approvedAt: now,
        approvedByUserId: identity.userId,
        approvedByEmail: identity.email,
        approvedByName: identity.name,
        reason: '',
        termsAccepted: true
      };
      quotation.approvedRevisionId = revision._id;
      quotation.approvedSnapshot = clone(revision.snapshot);
    }
    await revision.save();
    quotation.status = decision;
    quotation.commercialState = decision;
    quotation.statusHistory.push({ status: decision, changedBy: identity.userId, changedByName: identity.name, changedAt: now, reason: req.body?.notes || '' });
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, shareId: share._id, type: `CUSTOMER_${decision}`, actor: { _id: identity.userId, name: identity.name, email: identity.email }, actorType: 'CUSTOMER', details: { method: identity.method, notes: req.body?.notes || '' } });
    return res.json({ success: true, quotation: buildPublicRevisionDto({ quotation, revision, share }) });
  } catch (error) {
    console.error('Public Quotation Decision V2 Error:', error);
    return fail(res, 500, 'Unable to record quotation decision.');
  }
};

export const adminApproveQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    if (!isCommercialAdmin(req.user)) return fail(res, 403, 'Only Admin or Super Admin can use approval override.');
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    const reason = String(req.body?.reason || '').trim();
    if (reason.length < 8) return fail(res, 422, 'A clear override reason is required.');
    const revision = await QuotationRevision.findById(quotation.currentRevisionId);
    if (!revision) return fail(res, 409, 'Finalize the current quotation before approval.');
    if (revision.status === 'APPROVED') return res.json({ success: true, quotation, revision, idempotent: true });
    const now = new Date();
    revision.status = 'APPROVED';
    revision.customerDecision = { type: 'APPROVED', notes: reason, decidedAt: now };
    revision.approval = { method: 'ADMIN_OVERRIDE', approvedAt: now, approvedByUserId: req.user._id, approvedByEmail: req.user.email || '', approvedByName: actorName(req.user), reason, termsAccepted: false };
    await revision.save();
    quotation.status = 'APPROVED';
    quotation.commercialState = 'APPROVED';
    quotation.approvedRevisionId = revision._id;
    quotation.approvedSnapshot = clone(revision.snapshot);
    quotation.statusHistory.push(statusEntry('APPROVED', req.user, reason));
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, type: 'ADMIN_APPROVAL_OVERRIDE', actor: req.user, details: { reason } });
    return res.json({ success: true, quotation, revision });
  } catch (error) {
    console.error('Admin Approve Quotation V2 Error:', error);
    return fail(res, 500, 'Unable to approve quotation.');
  }
};

export const trackPublicQuotationEvent = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const { share, quotation, revision } = await resolveShare(req.params.token);
    if (!share || !quotation || !revision || !share.isActive || share.revokedAt) return fail(res, 404, 'Quotation proposal not found.');
    const type = String(req.body?.type || '').toUpperCase();
    if (!['PDF_DOWNLOADED', 'ATTACHMENT_DOWNLOADED'].includes(type)) return fail(res, 422, 'Unsupported tracking event.');
    if (type === 'PDF_DOWNLOADED') {
      if (!share.allowPdfDownload) return fail(res, 403, 'PDF downloads are disabled for this link.');
      await QuotationShare.updateOne({ _id: share._id }, { $inc: { pdfDownloadCount: 1 } });
      await Quotation.updateOne({ _id: quotation._id }, { $inc: { 'shareSummary.pdfDownloads': 1 } });
    } else {
      if (!share.allowAttachments) return fail(res, 403, 'Attachment downloads are disabled for this link.');
      const dto = buildPublicRevisionDto({ quotation, revision, share });
      if (!dto.attachments.some((item) => item.id === req.body?.attachmentId)) return fail(res, 404, 'Customer-visible attachment not found.');
      await QuotationShare.updateOne({ _id: share._id }, { $inc: { attachmentDownloadCount: 1 } });
      await Quotation.updateOne({ _id: quotation._id }, { $inc: { 'shareSummary.attachmentDownloads': 1 } });
    }
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, shareId: share._id, type, actorType: 'CUSTOMER', details: { attachmentId: req.body?.attachmentId || null } });
    return res.status(202).json({ success: true });
  } catch (error) {
    console.error('Track Public Quotation Event Error:', error);
    return fail(res, 500, 'Unable to record activity.');
  }
};

export const createBookingFromQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    const existing = await Booking.findOne({ sourceQuotationId: quotation._id });
    if (existing) {
      await syncLeadConversionFromBooking(existing);
      if (quotation.sourceItineraryId) await Itinerary.findByIdAndUpdate(quotation.sourceItineraryId, { lifecycleStatus: 'BOOKED', retentionExpiresAt: null }).catch((error) => console.error('Existing Booking Itinerary Lifecycle Update Error:', error));
      return res.json({ success: true, booking: existing, quotation, checkoutUrl: `/checkout?bookingId=${existing.bookingId}`, isExisting: true });
    }
    const revision = await QuotationRevision.findById(quotation.approvedRevisionId);
    if (!revision || revision.status !== 'APPROVED') return fail(res, 409, 'Only an approved immutable revision can be converted to a booking.');
    const snapshot = clone(revision.snapshot);
    const customer = snapshot.customerSnapshot || {};
    const journey = snapshot.tripRequirements || {};
    const manual = snapshot.manualPricing || {};
    const finalAmount = asNumber(manual.finalCustomerPrice);
    if (finalAmount <= 0) return fail(res, 409, 'Approved revision does not contain a valid final price.');
    const bookingHotels = (snapshot.hotelOptions || []).filter((item) => !(isAiCandidate(item, 'hotel') && item.selected !== true));
    const bookingTransport = (snapshot.transportOptions || []).filter((item) => !(isAiCandidate(item, 'transport') && item.selected !== true));
    const bookingActivities = (snapshot.activities || []).filter((item) => !(isAiCandidate(item, 'activity') && item.selected !== true));
    const selectedHotel = bookingHotels.find((item) => item.selected) || bookingHotels[0] || null;
    const selectedTransport = bookingTransport.filter((item) => item.selected !== false);
    const bookingId = `WLX-${new Date().getFullYear()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const verificationToken = crypto.randomBytes(16).toString('hex');
    let userId = quotation.customerId || null;
    if (!userId && customer.email) userId = (await User.findOne({ email: normalizeEmail(customer.email) }).select('_id').lean())?._id || null;
    const deposit = asNumber(manual.depositAmount);
    const balanceMilestone = (manual.paymentSchedule || []).find((item) => item.dueDate && asNumber(item.amount) > 0 && asNumber(item.amount) !== deposit);
    const balanceDueDate = balanceMilestone?.dueDate || journey.startDate || null;
    const balanceDueDays = balanceDueDate ? Math.max(0, Math.ceil((new Date(balanceDueDate).getTime() - Date.now()) / 86_400_000)) : 0;
    const booking = await Booking.create({
      bookingId,
      userId,
      tripId: String(quotation.sourceTripId || `custom-quotation-${quotation.quotationNumber}`),
      tripSnapshot: {
        title: journey.title,
        location: journey.destination,
        destination: journey.destination,
        image: snapshot.itinerary?.find((day) => day.coverMedia?.url)?.coverMedia?.url || selectedHotel?.imageUrl || '',
        duration: journey.duration || `${journey.days || 0}D/${journey.nights || 0}N`,
        batchDate: journey.startDate ? new Date(journey.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''
      },
      customer: { name: customer.name, email: customer.email, phone: customer.phone },
      travelers: [{ name: customer.name, email: customer.email, phone: customer.phone }],
      numberOfTravelers: journey.totalTravelers || 1,
      occupancy: selectedHotel?.occupancy || selectedHotel?.roomType || 'Not specified',
      paymentPlan: { type: deposit > 0 && deposit < finalAmount ? 'PARTIAL' : 'FULL', depositPercent: finalAmount ? Math.round((deposit / finalAmount) * 100) : 100, balanceDueDays },
      pricing: {
        basePricePerPerson: Math.round(finalAmount / Math.max(1, journey.totalTravelers || 1)),
        subtotal: finalAmount,
        discount: 0,
        taxes: 0,
        finalAmount,
        amountPaid: 0,
        amountOutstanding: finalAmount,
        balanceDueDate,
        currency: manual.currency || 'INR'
      },
      bookingStatus: 'PENDING_PAYMENT',
      paymentStatus: 'UNPAID',
      payment: { provider: 'razorpay', status: 'PENDING' },
      sourceQuotationId: quotation._id,
      sourceQuotationRevisionId: revision._id,
      leadId: quotation.leadId || null,
      isCustomQuotationBooking: true,
      quotationSnapshot: {
        quotationNumber: quotation.quotationNumber,
        version: revision.version,
        revisionId: revision._id,
        statusAtConversion: quotation.status,
        customerSnapshot: customer,
        tripRequirements: journey,
        tripPreferences: snapshot.tripPreferences || {},
        selectedHotel,
        hotelOptions: bookingHotels,
        selectedTransport,
        transportOptions: bookingTransport,
        activities: bookingActivities,
        addOns: snapshot.addOns || [],
        itinerary: snapshot.itinerary || [],
        manualPricing: manual,
        paymentTerms: snapshot.paymentTerms || null,
        depositRequired: deposit,
        convertedAt: new Date()
      },
      createdBy: req.user._id,
      updatedBy: req.user._id,
      qrCode: { verificationToken, verificationUrl: `${String(process.env.FRONTEND_URL || 'https://wanderon-ashok-soft.vercel.app').replace(/\/+$/, '')}/booking/verify/${verificationToken}` }
    });
    quotation.status = 'CONVERTED';
    quotation.bookingId = booking._id;
    quotation.bookingCode = booking.bookingId;
    quotation.statusHistory.push(statusEntry('CONVERTED', req.user, `Converted from approved revision ${revision.version}`));
    await quotation.save();
    await syncLeadConversionFromBooking(booking);
    if (quotation.sourceItineraryId) {
      await Itinerary.findByIdAndUpdate(quotation.sourceItineraryId, { lifecycleStatus: 'BOOKED', retentionExpiresAt: null })
        .catch((error) => console.error('Booking Itinerary Lifecycle Update Error:', error));
    }
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, type: 'BOOKING_CREATED', actor: req.user, details: { bookingId: booking._id, bookingCode: booking.bookingId, version: revision.version } });
    return res.status(201).json({ success: true, booking, quotation, checkoutUrl: `/checkout?bookingId=${booking.bookingId}`, isExisting: false });
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Booking.findOne({ sourceQuotationId: (await findQuotation(req.params.id))?._id });
      if (existing) {
        await syncLeadConversionFromBooking(existing);
        return res.json({ success: true, booking: existing, checkoutUrl: `/checkout?bookingId=${existing.bookingId}`, isExisting: true });
      }
    }
    console.error('Create Booking From Quotation V2 Error:', error);
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to create booking.');
  }
};
