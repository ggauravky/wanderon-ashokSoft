import express from 'express';
import {
  calculateQuotationPricingPreview,
  createQuotation,
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
  updatePublicSelectedOptions,
  customerQuotationDecision
} from '../controllers/quotationController.js';
import { protect, adminOnly, salesOrAdmin, operationsOrAdmin, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// ============================================================================
// PUBLIC CUSTOMER ENDPOINTS (No Authentication Required)
// ============================================================================
router.get('/public/:token', getPublicQuotationByToken);
router.post('/public/:token/select-options', updatePublicSelectedOptions);
router.post('/public/:token/decision', customerQuotationDecision);

// ============================================================================
// AUTHENTICATED INTERNAL ENDPOINTS (RBAC Protected)
// ============================================================================
router.use(protect);

router.post('/calculate-preview', requireRoles('super_admin', 'admin', 'sales'), calculateQuotationPricingPreview);

router.route('/')
  .get(requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotations)
  .post(requireRoles('super_admin', 'admin', 'sales'), createQuotation);

router.route('/:id')
  .get(requireRoles('super_admin', 'admin', 'operations', 'sales'), getQuotationById)
  .patch(requireRoles('super_admin', 'admin', 'sales'), updateQuotation)
  .delete(adminOnly, deleteQuotation);

// Transport Document Management (RBAC & Immutability Protected)
router.post('/:id/transports/:optionId/documents', requireRoles('super_admin', 'admin', 'sales'), attachTransportDocument);
router.delete('/:id/transports/:optionId/documents/:docId', requireRoles('super_admin', 'admin', 'sales'), deleteTransportDocument);

// Workflow Actions & Revisions
router.post('/:id/send', requireRoles('super_admin', 'admin', 'sales'), sendQuotation);
router.post('/:id/create-revision', requireRoles('super_admin', 'admin', 'sales'), createQuotationRevision);
router.post('/:id/approve', requireRoles('super_admin', 'admin', 'sales'), approveQuotation);
router.post('/:id/reject', requireRoles('super_admin', 'admin', 'sales'), rejectQuotation);
router.post('/:id/archive', requireRoles('super_admin', 'admin', 'sales'), archiveQuotation);
router.post('/:id/convert-to-trip', operationsOrAdmin, convertToTrip);
router.post('/:id/create-booking', requireRoles('super_admin', 'admin', 'operations', 'sales'), createBookingFromQuotation);

export default router;
