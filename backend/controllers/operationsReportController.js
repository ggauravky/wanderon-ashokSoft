import OperationalCost from '../models/OperationalCost.js';
import OperationalFeedback from '../models/OperationalFeedback.js';
import OperationalIncident from '../models/OperationalIncident.js';
import OperationalService from '../models/OperationalService.js';
import OperationalSettlement from '../models/OperationalSettlement.js';
import OperationalTask from '../models/OperationalTask.js';
import OperationalTrip from '../models/OperationalTrip.js';
import OperationalTripClosure from '../models/OperationalTripClosure.js';
import { bookingsForOperationalGroup, loadOperationalReadModel } from '../services/operationsReadModelService.js';
import { buildOperationsReport } from '../services/operationsReportService.js';
import { ensureOperationsDatabase, handleOperationsError } from './operationsControllerUtils.js';

const validDate = (value) => value && !Number.isNaN(new Date(value).getTime()) ? new Date(value) : null;

export const getOperationsReportOverview = async (req, res) => {
  try {
    if (!ensureOperationsDatabase(res)) return;
    const readModel = await loadOperationalReadModel(); const from = validDate(req.query.from); const to = validDate(req.query.to);
    let groups = readModel.groups.filter((group) => (!from || (group.startDate && new Date(group.startDate) >= from)) && (!to || (group.startDate && new Date(group.startDate) <= to)));
    if (req.query.sourceType) groups = groups.filter((group) => group.type === String(req.query.sourceType).toUpperCase());
    if (req.query.destination) groups = groups.filter((group) => String(group.destination || '').toLowerCase().includes(String(req.query.destination).toLowerCase()));
    const keys = groups.map((group) => group.operationKey);
    let trips = await OperationalTrip.find({ operationKey: { $in: keys } }).lean();
    if (req.query.coordinator) trips = trips.filter((trip) => String(trip.coordinatorId || '') === String(req.query.coordinator));
    const tripIds = trips.map((trip) => trip._id);
    const bookings = groups.flatMap((group) => bookingsForOperationalGroup(readModel, group));
    const [services, tasks, incidents, costs, settlements, feedback, closures] = tripIds.length ? await Promise.all([
      OperationalService.find({ operationalTripId: { $in: tripIds } }).lean(), OperationalTask.find({ operationalTripId: { $in: tripIds } }).lean(),
      OperationalIncident.find({ operationalTripId: { $in: tripIds } }).lean(), OperationalCost.find({ operationalTripId: { $in: tripIds }, ...(from || to ? { incurredAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {}) }).populate('vendorId', 'vendorCode name types').lean(),
      OperationalSettlement.find({ operationalTripId: { $in: tripIds }, ...(from || to ? { paidAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {}) }).lean(),
      OperationalFeedback.find({ operationalTripId: { $in: tripIds } }).lean(), OperationalTripClosure.find({ operationalTripId: { $in: tripIds }, ...(from || to ? { closedAt: { ...(from ? { $gte: from } : {}), ...(to ? { $lte: to } : {}) } } : {}) }).lean()
    ]) : [[], [], [], [], [], [], []];
    return res.json(buildOperationsReport({ groups, trips, services, tasks, incidents, costs, settlements, feedback, closures, bookings, now: readModel.now }));
  } catch (error) { return handleOperationsError(res, error, 'Unable to load Operations reports.'); }
};
