import express from 'express';
import { 
  createLead, getLeads, updateLeadStatus 
} from '../controllers/leadController.js';
import { protect, adminOnly } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Public Lead Capture Endpoint
router.post('/', createLead);

// Admin Protected Lead Management
router.get('/', protect, adminOnly, getLeads);
router.put('/:id/status', protect, adminOnly, updateLeadStatus);

export default router;
