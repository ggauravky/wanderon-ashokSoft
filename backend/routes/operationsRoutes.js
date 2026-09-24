import express from 'express';
import {
  assignServiceVendor,
  assignTransportDriver,
  cancelOperationalService,
  confirmOperationalService,
  createOperationalService,
  declineOperationalService,
  ensureOperationalTripController,
  getOperationalTrip,
  getOperationsCoordinators,
  getOperationsDashboard,
  listOperationalServices,
  listOperationalTrips,
  updateOperationalService,
  updateOperationalTrip,
  uploadOperationsDocument
} from '../controllers/operationsController.js';
import { createVendor, getVendor, listVendors, updateVendor, updateVendorStatus } from '../controllers/vendorController.js';
import { checkPermission, protect } from '../middlewares/authMiddleware.js';
import { handleMulterError, uploadSingleDocument } from '../middlewares/uploadMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/dashboard', checkPermission('operations:view_dashboard'), getOperationsDashboard);
router.get('/coordinators', checkPermission('operations:view_trips'), getOperationsCoordinators);
router.post('/documents/upload', checkPermission('operations:manage_services'), uploadSingleDocument, uploadOperationsDocument);

router.get('/vendors', checkPermission('operations:view_vendors'), listVendors);
router.post('/vendors', checkPermission('operations:manage_vendors'), createVendor);
router.get('/vendors/:vendorId', checkPermission('operations:view_vendors'), getVendor);
router.patch('/vendors/:vendorId', checkPermission('operations:manage_vendors'), updateVendor);
router.patch('/vendors/:vendorId/status', checkPermission('operations:manage_vendors'), updateVendorStatus);

router.get('/trips', checkPermission('operations:view_trips'), listOperationalTrips);
router.post('/trips/ensure', checkPermission('operations:manage_trips'), ensureOperationalTripController);
router.get('/trips/:operationId', checkPermission('operations:view_trips'), getOperationalTrip);
router.patch('/trips/:operationId', checkPermission('operations:manage_trips'), updateOperationalTrip);
router.get('/trips/:operationId/services', checkPermission('operations:view_trips'), listOperationalServices);
router.post('/trips/:operationId/services', checkPermission('operations:manage_services'), createOperationalService);
router.patch('/trips/:operationId/services/:serviceId', checkPermission('operations:manage_services'), updateOperationalService);
router.post('/trips/:operationId/services/:serviceId/assign-vendor', checkPermission('operations:manage_services'), assignServiceVendor);
router.post('/trips/:operationId/services/:serviceId/assign-driver', checkPermission('operations:manage_services'), assignTransportDriver);
router.post('/trips/:operationId/services/:serviceId/confirm', checkPermission('operations:manage_services'), confirmOperationalService);
router.post('/trips/:operationId/services/:serviceId/decline', checkPermission('operations:manage_services'), declineOperationalService);
router.post('/trips/:operationId/services/:serviceId/cancel', checkPermission('operations:manage_services'), cancelOperationalService);

router.use(handleMulterError);

export default router;
