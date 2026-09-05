import express from 'express';
import {
  getFollowUps,
  getFollowUpById,
  createFollowUp,
  updateFollowUp,
  completeFollowUp,
  deleteFollowUp
} from '../controllers/followUpController.js';
import { protect, checkPermission } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('followups:manage'), getFollowUps);
router.post('/', checkPermission('followups:manage'), createFollowUp);

router.get('/:id', checkPermission('followups:manage'), getFollowUpById);
router.put('/:id', checkPermission('followups:manage'), updateFollowUp);
router.put('/:id/complete', checkPermission('followups:manage'), completeFollowUp);
router.delete('/:id', checkPermission('followups:manage'), deleteFollowUp);

export default router;
