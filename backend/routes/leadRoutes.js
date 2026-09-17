import express from 'express';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
  assignLead,
  claimLead,
  logLeadContact,
  getSalesUsers
} from '../controllers/leadController.js';
import { protect, optionalAuth, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Authenticated Lead Capture Endpoint (with optional auth token extraction)
router.post('/', optionalAuth, createLead);

// Directory of sales specialists for assignment
router.get('/sales-users', protect, requireRoles('super_admin', 'admin', 'operations', 'sales'), getSalesUsers);

// Authenticated Lead Management with RBAC Scoping
router.get('/', protect, requireRoles('super_admin', 'admin', 'operations', 'sales'), getLeads);
router.get('/:id', protect, requireRoles('super_admin', 'admin', 'operations', 'sales'), getLeadById);

// Lead Actions
router.post('/:id/claim', protect, requireRoles('super_admin', 'admin', 'operations', 'sales'), claimLead);
router.post('/:id/log-contact', protect, requireRoles('super_admin', 'admin', 'operations', 'sales'), logLeadContact);
router.put('/:id/status', protect, requireRoles('super_admin', 'admin', 'operations', 'sales'), updateLeadStatus);
router.put('/:id/assign', protect, requireRoles('super_admin', 'admin', 'operations'), assignLead);

export default router;
