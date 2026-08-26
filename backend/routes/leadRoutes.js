import express from 'express';
import { 
  createLead, getLeads, updateLeadStatus 
} from '../controllers/leadController.js';
import { protect, adminOnly, optionalAuth } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public / Authenticated Lead Capture Endpoint (with optional auth token extraction)
router.post('/', optionalAuth, createLead);

// Admin Protected Lead Management
router.get('/', protect, adminOnly, getLeads);
router.put('/:id/status', protect, adminOnly, updateLeadStatus);

export default router;

