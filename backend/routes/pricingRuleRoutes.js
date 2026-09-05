import express from 'express';
import {
  getPricingRules,
  getPricingRuleById,
  createPricingRule,
  updatePricingRule,
  togglePricingRule,
  deletePricingRule,
  evaluatePricingRules
} from '../controllers/pricingRuleController.js';
import { protect, checkPermission, requireRoles } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', checkPermission('pricing:view'), getPricingRules);
router.post('/', checkPermission('pricing:manage_rules'), createPricingRule);
router.post('/evaluate', checkPermission('pricing:view'), evaluatePricingRules);

router.get('/:id', checkPermission('pricing:view'), getPricingRuleById);
router.put('/:id', checkPermission('pricing:manage_rules'), updatePricingRule);
router.put('/:id/toggle', checkPermission('pricing:manage_rules'), togglePricingRule);
router.delete('/:id', checkPermission('pricing:manage_rules'), deletePricingRule);

export default router;
