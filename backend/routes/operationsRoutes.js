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
import {
  blockTask, cancelTask, completeTask, createOperationalTask, initializeOperationalChecklist,
  listOperationalTasks, listOperationalTripTasks, reopenTask, startTask, updateOperationalTask
} from '../controllers/operationsTaskController.js';
import { createOperationalCommunication, listOperationalCommunications } from '../controllers/operationsCommunicationController.js';
import {
  acknowledgeOperationalIncident, assignOperationalIncident, closeOperationalIncident, createOperationalIncident,
  escalateOperationalIncident, getOperationalIncident, listOperationalIncidents, listOperationalTripIncidents,
  reopenOperationalIncident, resolveOperationalIncident, startOperationalIncident, updateOperationalIncident
} from '../controllers/operationsIncidentController.js';
import { checkPermission, protect } from '../middlewares/authMiddleware.js';
import { handleMulterError, uploadSingleDocument } from '../middlewares/uploadMiddleware.js';
import {
  createOperationalCost, finalizeOperationalCost, getOperationalCost, getOperationalFinancialSummary,
  listOperationalCosts, updateOperationalCost, voidOperationalCost
} from '../controllers/operationsCostController.js';
import { createCostSettlement, listCostSettlements, listOperationalSettlements, voidOperationalSettlement } from '../controllers/operationsSettlementController.js';
import { createOperationalFeedback, listOperationalFeedback, updateOperationalFeedback } from '../controllers/operationsFeedbackController.js';
import { closeOperationalTrip, getOperationalClosure, reopenOperationalTrip } from '../controllers/operationsClosureController.js';
import { getOperationsReportOverview } from '../controllers/operationsReportController.js';
import { assertOperationalTripOpen } from '../services/operationsClosureService.js';

const router = express.Router();
router.use(protect);

const requireOpenTrip = async (req, res, next) => {
  try { await assertOperationalTripOpen(req.params.operationId); return next(); }
  catch (error) { return res.status(error.status || 500).json({ message: error.message || 'Unable to verify Trip Closure state.', ...(error.code ? { code: error.code } : {}) }); }
};

router.get('/dashboard', checkPermission('operations:view_dashboard'), getOperationsDashboard);
router.get('/reports/overview', checkPermission('operations:view_reports'), getOperationsReportOverview);
router.get('/settlements', checkPermission('operations:view_settlements'), listOperationalSettlements);
router.get('/costs/:costId', checkPermission('operations:view_costs'), getOperationalCost);
router.patch('/costs/:costId', checkPermission('operations:manage_costs'), updateOperationalCost);
router.post('/costs/:costId/finalize', checkPermission('operations:manage_costs'), finalizeOperationalCost);
router.post('/costs/:costId/void', checkPermission('operations:manage_costs'), voidOperationalCost);
router.get('/costs/:costId/settlements', checkPermission('operations:view_settlements'), listCostSettlements);
router.post('/costs/:costId/settlements', checkPermission('operations:manage_settlements'), createCostSettlement);
router.post('/settlements/:settlementId/void', checkPermission('operations:manage_settlements'), voidOperationalSettlement);
router.patch('/feedback/:feedbackId', checkPermission('operations:manage_feedback'), updateOperationalFeedback);
router.get('/coordinators', checkPermission('operations:view_trips'), getOperationsCoordinators);
router.post('/documents/upload', checkPermission('operations:manage_services'), uploadSingleDocument, uploadOperationsDocument);

router.get('/tasks', checkPermission('operations:view_tasks'), listOperationalTasks);
router.get('/incidents', checkPermission('operations:view_incidents'), listOperationalIncidents);
router.get('/incidents/:incidentId', checkPermission('operations:view_incidents'), getOperationalIncident);
router.patch('/incidents/:incidentId', checkPermission('operations:manage_incidents'), updateOperationalIncident);
router.post('/incidents/:incidentId/assign', checkPermission('operations:manage_incidents'), assignOperationalIncident);
router.post('/incidents/:incidentId/start', checkPermission('operations:manage_incidents'), startOperationalIncident);
router.post('/incidents/:incidentId/escalate', checkPermission('operations:manage_incidents'), escalateOperationalIncident);
router.post('/incidents/:incidentId/acknowledge', checkPermission('operations:manage_incidents'), acknowledgeOperationalIncident);
router.post('/incidents/:incidentId/resolve', checkPermission('operations:manage_incidents'), resolveOperationalIncident);
router.post('/incidents/:incidentId/close', checkPermission('operations:manage_incidents'), closeOperationalIncident);
router.post('/incidents/:incidentId/reopen', checkPermission('operations:manage_incidents'), reopenOperationalIncident);

router.get('/vendors', checkPermission('operations:view_vendors'), listVendors);
router.post('/vendors', checkPermission('operations:manage_vendors'), createVendor);
router.get('/vendors/:vendorId', checkPermission('operations:view_vendors'), getVendor);
router.patch('/vendors/:vendorId', checkPermission('operations:manage_vendors'), updateVendor);
router.patch('/vendors/:vendorId/status', checkPermission('operations:manage_vendors'), updateVendorStatus);

router.get('/trips', checkPermission('operations:view_trips'), listOperationalTrips);
router.post('/trips/ensure', checkPermission('operations:manage_trips'), ensureOperationalTripController);
router.get('/trips/:operationId', checkPermission('operations:view_trips'), getOperationalTrip);
router.patch('/trips/:operationId', checkPermission('operations:manage_trips'), requireOpenTrip, updateOperationalTrip);
router.post('/trips/:operationId/checklist/initialize', checkPermission('operations:manage_tasks'), requireOpenTrip, initializeOperationalChecklist);
router.get('/trips/:operationId/tasks', checkPermission('operations:view_tasks'), listOperationalTripTasks);
router.post('/trips/:operationId/tasks', checkPermission('operations:manage_tasks'), requireOpenTrip, createOperationalTask);
router.patch('/trips/:operationId/tasks/:taskId', checkPermission('operations:manage_tasks'), requireOpenTrip, updateOperationalTask);
router.post('/trips/:operationId/tasks/:taskId/start', checkPermission('operations:manage_tasks'), requireOpenTrip, startTask);
router.post('/trips/:operationId/tasks/:taskId/block', checkPermission('operations:manage_tasks'), requireOpenTrip, blockTask);
router.post('/trips/:operationId/tasks/:taskId/complete', checkPermission('operations:manage_tasks'), requireOpenTrip, completeTask);
router.post('/trips/:operationId/tasks/:taskId/reopen', checkPermission('operations:manage_tasks'), requireOpenTrip, reopenTask);
router.post('/trips/:operationId/tasks/:taskId/cancel', checkPermission('operations:manage_tasks'), requireOpenTrip, cancelTask);
router.get('/trips/:operationId/communications', checkPermission('operations:view_communications'), listOperationalCommunications);
router.post('/trips/:operationId/communications', checkPermission('operations:manage_communications'), requireOpenTrip, createOperationalCommunication);
router.get('/trips/:operationId/incidents', checkPermission('operations:view_incidents'), listOperationalTripIncidents);
router.post('/trips/:operationId/incidents', checkPermission('operations:manage_incidents'), requireOpenTrip, createOperationalIncident);
router.get('/trips/:operationId/services', checkPermission('operations:view_trips'), listOperationalServices);
router.post('/trips/:operationId/services', checkPermission('operations:manage_services'), requireOpenTrip, createOperationalService);
router.patch('/trips/:operationId/services/:serviceId', checkPermission('operations:manage_services'), requireOpenTrip, updateOperationalService);
router.post('/trips/:operationId/services/:serviceId/assign-vendor', checkPermission('operations:manage_services'), requireOpenTrip, assignServiceVendor);
router.post('/trips/:operationId/services/:serviceId/assign-driver', checkPermission('operations:manage_services'), requireOpenTrip, assignTransportDriver);
router.post('/trips/:operationId/services/:serviceId/confirm', checkPermission('operations:manage_services'), requireOpenTrip, confirmOperationalService);
router.post('/trips/:operationId/services/:serviceId/decline', checkPermission('operations:manage_services'), requireOpenTrip, declineOperationalService);
router.post('/trips/:operationId/services/:serviceId/cancel', checkPermission('operations:manage_services'), requireOpenTrip, cancelOperationalService);

router.get('/trips/:operationId/costs', checkPermission('operations:view_costs'), listOperationalCosts);
router.post('/trips/:operationId/costs', checkPermission('operations:manage_costs'), requireOpenTrip, createOperationalCost);
router.get('/trips/:operationId/financial-summary', checkPermission('operations:view_costs'), getOperationalFinancialSummary);
router.get('/trips/:operationId/feedback', checkPermission('operations:view_feedback'), listOperationalFeedback);
router.post('/trips/:operationId/feedback', checkPermission('operations:manage_feedback'), requireOpenTrip, createOperationalFeedback);
router.get('/trips/:operationId/closure', checkPermission('operations:view_closure'), getOperationalClosure);
router.post('/trips/:operationId/closure/close', checkPermission('operations:close_trip'), requireOpenTrip, closeOperationalTrip);
router.post('/trips/:operationId/closure/reopen', checkPermission('operations:reopen_trip'), reopenOperationalTrip);

router.use(handleMulterError);

export default router;
