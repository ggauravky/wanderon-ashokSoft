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
import { getJwtSecret } from '../config/environment.js';
import { sendQuotationVerificationEmail } from '../services/quotationEmailService.js';
import {
  V2_TEMPLATES,
  ATTACHMENT_VISIBILITIES,
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
  'leadId', 'customerId', 'customerSnapshot', 'tripRequirements', 'personalNote', 'itinerary',
  'hotelOptions', 'transportOptions', 'activities', 'addOns', 'attachments', 'inclusions',
  'exclusions', 'policies', 'termsAndConditions', 'cancellationPolicy', 'paymentTerms',
  'presentationSettings', 'validUntil', 'assignedTo', 'assignedToSnapshot'
];

const applyEditableFields = (quotation, input) => {
  editableFields.forEach((field) => {
    if (Object.prototype.hasOwnProperty.call(input, field)) quotation.set(field, clone(input[field]));
  });
  const adults = asNumber(quotation.tripRequirements?.adults, 0);
  const children = asNumber(quotation.tripRequirements?.children, 0);
  const infants = asNumber(quotation.tripRequirements?.infants, 0);
  quotation.tripRequirements.totalTravelers = Math.max(1, adults + children + infants);
  quotation.manualPricing.componentReference = calculateComponentReference(quotation);
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

export const createQuotationV2 = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const payload = req.body || {};
    const userId = req.user._id || req.user.id;
    const quotation = new Quotation({
      schemaVersion: 2,
      quotationNumber: await generateQuotationNumber(),
      version: 1,
      leadId: payload.leadId || null,
      customerId: payload.customerId || null,
      assignedTo: payload.assignedTo || userId,
      assignedToSnapshot: payload.assignedToSnapshot || { name: actorName(req.user), email: req.user.email || '', phone: req.user.phone || '' },
      createdBy: userId,
      updatedBy: userId,
      customerSnapshot: payload.customerSnapshot,
      tripRequirements: payload.tripRequirements,
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
    await createQuotationEvent({ quotationId: quotation._id, type: 'QUOTATION_CREATED', actor: req.user, details: { schemaVersion: 2 } });
    return res.status(201).json({ success: true, quotation, validation: validateQuotationV2(quotation) });
  } catch (error) {
    console.error('Create Quotation V2 Error:', error);
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to create quotation.');
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
    applyEditableFields(quotation, req.body || {});
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
    await createQuotationEvent({ quotationId: quotation._id, type: 'DRAFT_UPDATED', actor: req.user, details: { version: quotation.version } });
    return res.json({ success: true, quotation, validation: validateQuotationV2(quotation) });
  } catch (error) {
    console.error('Update Quotation V2 Error:', error);
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to update quotation.');
  }
};

export const requestQuotationPricing = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (quotation.manualPricing?.finalizedAt) return fail(res, 409, 'Pricing is already finalized for this revision.');
    const validation = validateQuotationV2(quotation);
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
    revision.templateKey = templateKey;
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
    return fail(res, 500, error.message || 'Unable to duplicate quotation.');
  }
};

export const addQuotationAttachment = async (req, res) => {
  try {
    if (!ensureDatabase(res)) return;
    const quotation = await loadAuthorized(req, res, { edit: true });
    if (!quotation) return;
    if (quotation.manualPricing?.finalizedAt) return fail(res, 409, 'This revision is frozen. Create a new revision before adding documents.');
    const input = req.body || {};
    if (!input.secureUrl || !input.mimeType || !String(input.title || input.fileName || '').trim()) return fail(res, 422, 'Document title, file type, and secure URL are required.');
    const attachment = {
      id: input.id || `qdoc_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
      category: input.category || 'GENERAL',
      sectionType: input.sectionType || 'GENERAL',
      sectionId: input.sectionId || '',
      title: input.title || input.fileName,
      fileName: input.fileName || '',
      mimeType: input.mimeType,
      size: asNumber(input.size),
      storageProvider: input.storageProvider || 'cloudinary',
      publicId: input.publicId || '',
      secureUrl: input.secureUrl,
      visibility: ATTACHMENT_VISIBILITIES.includes(input.visibility) ? input.visibility : 'INTERNAL_ONLY',
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
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to attach document.');
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
    if (existing) return res.json({ success: true, booking: existing, quotation, checkoutUrl: `/checkout?bookingId=${existing.bookingId}`, isExisting: true });
    const revision = await QuotationRevision.findById(quotation.approvedRevisionId);
    if (!revision || revision.status !== 'APPROVED') return fail(res, 409, 'Only an approved immutable revision can be converted to a booking.');
    const snapshot = clone(revision.snapshot);
    const customer = snapshot.customerSnapshot || {};
    const journey = snapshot.tripRequirements || {};
    const manual = snapshot.manualPricing || {};
    const finalAmount = asNumber(manual.finalCustomerPrice);
    if (finalAmount <= 0) return fail(res, 409, 'Approved revision does not contain a valid final price.');
    const selectedHotel = (snapshot.hotelOptions || []).find((item) => item.selected) || snapshot.hotelOptions?.[0] || null;
    const selectedTransport = (snapshot.transportOptions || []).filter((item) => item.selected !== false);
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
        selectedHotel,
        hotelOptions: snapshot.hotelOptions || [],
        selectedTransport,
        transportOptions: snapshot.transportOptions || [],
        activities: snapshot.activities || [],
        addOns: snapshot.addOns || [],
        itinerary: snapshot.itinerary || [],
        manualPricing: manual,
        paymentTerms: snapshot.paymentTerms || null,
        depositRequired: deposit,
        convertedAt: new Date()
      },
      createdBy: req.user._id,
      updatedBy: req.user._id,
      qrCode: { verificationToken, verificationUrl: `${String(process.env.FRONTEND_URL || 'https://wanderluxe.in').replace(/\/$/, '')}/booking/verify/${verificationToken}` }
    });
    quotation.status = 'CONVERTED';
    quotation.bookingId = booking._id;
    quotation.bookingCode = booking.bookingId;
    quotation.statusHistory.push(statusEntry('CONVERTED', req.user, `Converted from approved revision ${revision.version}`));
    await quotation.save();
    await createQuotationEvent({ quotationId: quotation._id, revisionId: revision._id, type: 'BOOKING_CREATED', actor: req.user, details: { bookingId: booking._id, bookingCode: booking.bookingId, version: revision.version } });
    return res.status(201).json({ success: true, booking, quotation, checkoutUrl: `/checkout?bookingId=${booking.bookingId}`, isExisting: false });
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Booking.findOne({ sourceQuotationId: (await findQuotation(req.params.id))?._id });
      if (existing) return res.json({ success: true, booking: existing, checkoutUrl: `/checkout?bookingId=${existing.bookingId}`, isExisting: true });
    }
    console.error('Create Booking From Quotation V2 Error:', error);
    return fail(res, error?.name === 'ValidationError' ? 400 : 500, error.message || 'Unable to create booking.');
  }
};
