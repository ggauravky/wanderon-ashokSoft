import express from 'express';
import {
  calculateQuotationPricingPreview,
  getQuotations,
  getQuotationById,
  updateQuotation,
  deleteQuotation,
  sendQuotation,
  createQuotationRevision,
  approveQuotation,
  rejectQuotation,
  archiveQuotation,
  convertToTrip,
  createBookingFromQuotation,
  attachTransportDocument,
  deleteTransportDocument,
  getPublicQuotationByToken,
  updatePublicSelectedOptions
} from '../controllers/quotationController.js';
import {
  addQuotationAttachment,
  adminApproveQuotationV2,
  createBookingFromQuotationV2,
  createQuotationRevisionV2,
  createQuotationShare,
  createQuotationV2,
  decidePublicQuotationV2,
  deleteQuotationAttachment,
  duplicateQuotationV2,
  finalizeQuotationPricing,
  getPublicQuotationV2,
  getQuotationEvents,
  getQuotationRevisionsV2,
  getQuotationShares,
  legacyQuotationOnly,
  legacyPublicDecisionDisabled,
  requestQuotationPricing,
  requestQuotationVerification,
  revokeQuotationShare,
  applyQuotationAiImport,
  draftQuotationAiText,
  previewQuotationAiImport,
  getImportableAiItineraries,
  getQuotationPolicyDefaults,
  suggestQuotationAiField,
  trackPublicQuotationEvent,
  updateQuotationV2,
  verifyQuotationRecipient
} from '../controllers/quotationV2Controller.js';
import { protect, optionalAuth, adminOnly, operationsOrAdmin, requireRoles } from '../middlewares/authMiddleware.js';
import { quotationRateLimit } from '../middlewares/quotationRateLimit.js';

const router = express.Router();

// ============================================================================
// PUBLIC CUSTOMER ENDPOINTS (No Authentication Required)
// ============================================================================
router.get('/public/v2/:token', optionalAuth, quotationRateLimit({ action: 'quotation-view', limit: 60 }), getPublicQuotationV2);
router.post('/public/v2/:token/request-verification', quotationRateLimit({ action: 'quotation-request-code', limit: 5 }), requestQuotationVerification);
router.post('/public/v2/:token/verify', quotationRateLimit({ action: 'quotation-verify-code', limit: 8 }), verifyQuotationRecipient);
router.post('/public/v2/:token/decision', optionalAuth, quotationRateLimit({ action: 'quotation-decision', limit: 10 }), decidePublicQuotationV2);
router.post('/public/v2/:token/events', quotationRateLimit({ action: 'quotation-public-event', limit: 40 }), trackPublicQuotationEvent);
router.get('/public/:token', getPublicQuotationByToken);
router.post('/public/:token/select-options', updatePublicSelectedOptions);
router.post('/public/:token/decision', legacyPublicDecisionDisabled);

// ============================================================================
// AUTHENTICATED INTERNAL ENDPOINTS (RBAC Protected)
// ============================================================================
router.use(protect);

router.post('/calculate-preview', requireRoles('super_admin', 'admin', 'sales'), calculateQuotationPricingPreview);
router.post('/v2', requireRoles('super_admin', 'admin', 'sales'), createQuotationV2);
router.post('/v2/ai/import-preview', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-import-preview', limit: 60, windowMs: 3600000 }), previewQuotationAiImport);
router.get('/v2/ai/importable-itineraries', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-itinerary-list', limit: 120, windowMs: 3600000 }), getImportableAiItineraries);
router.post('/v2/ai/policy-defaults', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-policy-defaults', limit: 120, windowMs: 3600000 }), getQuotationPolicyDefaults);
router.post('/v2/ai/field-suggest', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-field-suggest', limit: 30, windowMs: 3600000 }), suggestQuotationAiField);
router.post('/v2/ai/draft-text', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-quotation-draft', limit: 30, windowMs: 3600000 }), draftQuotationAiText);

router.route('/')
  .get(requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotations)
  .post(requireRoles('super_admin', 'admin', 'sales'), createQuotationV2);

router.route('/:id')
  .get(requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotationById)
  .patch(requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, updateQuotation)
  .delete(adminOnly, legacyQuotationOnly, deleteQuotation);

// Quotation V2 content, commercial controls, immutable revisions, and sharing.
router.patch('/:id/v2', requireRoles('super_admin', 'admin', 'sales'), updateQuotationV2);
router.post('/:id/v2/ai/import-apply', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-import-apply', limit: 60, windowMs: 3600000 }), applyQuotationAiImport);
router.post('/:id/v2/ai/draft-text', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-quotation-draft', limit: 30, windowMs: 3600000 }), draftQuotationAiText);
router.post('/:id/v2/ai/field-suggest', requireRoles('super_admin', 'admin', 'sales'), quotationRateLimit({ action: 'ai-field-suggest', limit: 30, windowMs: 3600000 }), suggestQuotationAiField);
router.post('/:id/v2/request-pricing', requireRoles('super_admin', 'admin', 'sales'), requestQuotationPricing);
router.post('/:id/v2/finalize-pricing', requireRoles('super_admin', 'admin'), finalizeQuotationPricing);
router.post('/:id/v2/revisions', requireRoles('super_admin', 'admin', 'sales'), createQuotationRevisionV2);
router.get('/:id/v2/revisions', requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotationRevisionsV2);
router.post('/:id/v2/shares', requireRoles('super_admin', 'admin', 'sales'), createQuotationShare);
router.get('/:id/v2/shares', requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotationShares);
router.post('/:id/v2/shares/:shareId/revoke', requireRoles('super_admin', 'admin', 'sales'), revokeQuotationShare);
router.get('/:id/v2/events', requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotationEvents);
router.post('/:id/v2/duplicate', requireRoles('super_admin', 'admin', 'sales'), duplicateQuotationV2);
router.post('/:id/v2/attachments', requireRoles('super_admin', 'admin', 'sales'), addQuotationAttachment);
router.delete('/:id/v2/attachments/:attachmentId', requireRoles('super_admin', 'admin', 'sales'), deleteQuotationAttachment);
router.post('/:id/v2/admin-approve', requireRoles('super_admin', 'admin'), adminApproveQuotationV2);
router.post('/:id/v2/create-booking', requireRoles('super_admin', 'admin', 'operations', 'sales'), createBookingFromQuotationV2);

// Transport Document Management (RBAC & Immutability Protected)
router.post('/:id/transports/:optionId/documents', requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, attachTransportDocument);
router.delete('/:id/transports/:optionId/documents/:docId', requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, deleteTransportDocument);

// Workflow Actions & Revisions
router.post('/:id/send', requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, sendQuotation);
router.post('/:id/create-revision', requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, createQuotationRevision);
router.post('/:id/approve', adminOnly, legacyQuotationOnly, approveQuotation);
router.post('/:id/reject', requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, rejectQuotation);
router.post('/:id/archive', requireRoles('super_admin', 'admin', 'sales'), legacyQuotationOnly, archiveQuotation);
router.post('/:id/convert-to-trip', operationsOrAdmin, legacyQuotationOnly, convertToTrip);
router.post('/:id/create-booking', requireRoles('super_admin', 'admin', 'operations', 'sales'), legacyQuotationOnly, createBookingFromQuotation);

export default router;
