import express from 'express';
import { getOperationsDashboard } from '../controllers/operationsController.js';
import { checkPermission, protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, checkPermission('operations:view_dashboard'), getOperationsDashboard);

export default router;
