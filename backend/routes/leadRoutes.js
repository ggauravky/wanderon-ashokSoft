import express from 'express';
import { 
  createLead, getLeads, updateLeadStatus, assignLead 
} from '../controllers/leadController.js';
import { protect, adminOnly, optionalAuth, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Authenticated Lead Capture Endpoint (with optional auth token extraction)
router.post('/', optionalAuth, createLead);

// Authenticated Lead Management with RBAC Scoping
router.get('/', protect, requireRoles('super_admin', 'admin', 'operations', 'sales', 'marketing'), getLeads);
router.put('/:id/status', protect, requireRoles('super_admin', 'admin', 'sales'), updateLeadStatus);
router.put('/:id/assign', protect, adminOnly, assignLead);

export default router;

