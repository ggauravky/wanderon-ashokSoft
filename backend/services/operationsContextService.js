import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import OperationalCommunication from '../models/OperationalCommunication.js';
import OperationalIncident from '../models/OperationalIncident.js';
import OperationalService from '../models/OperationalService.js';
import OperationalTask from '../models/OperationalTask.js';
import OperationalTrip from '../models/OperationalTrip.js';
import User from '../models/User.js';
import { OperationsDomainError } from './operationsExecutionService.js';
import { bookingsForOperationalGroup, loadOperationalReadModel, resolveOperationalGroup } from './operationsReadModelService.js';

export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));
export const isOperationsStaffRole = (role) => ['operations', 'admin', 'super_admin'].includes(String(role || '').toLowerCase());

export const buildOperationsContextSnapshot = (group = {}) => ({
  operationKey: String(group.operationKey || '').trim(),
  sourceType: String(group.type || group.sourceType || '').toUpperCase(),
  title: String(group.title || 'Operational journey').trim(),
  destination: String(group.destination || '').trim(),
  startDate: group.startDate ? new Date(group.startDate) : null,
  endDate: group.endDate ? new Date(group.endDate) : null
});

export const loadOperationsContext = async (operationId, { includeSource = false } = {}) => {
  if (!isValidObjectId(operationId)) throw new OperationsDomainError(400, 'Invalid Operational Trip identifier.', 'INVALID_OPERATION_ID');
  const operationalTrip = await OperationalTrip.findById(operationId);
  if (!operationalTrip) throw new OperationsDomainError(404, 'Operational departure no longer exists.', 'OPERATION_NOT_FOUND');
  const readModel = await loadOperationalReadModel({ includeSource });
  const group = resolveOperationalGroup(readModel, operationalTrip.operationKey);
  if (!group) throw new OperationsDomainError(409, 'The source Booking is no longer an eligible Operations handoff.', 'SOURCE_HANDOFF_UNAVAILABLE');
  return {
    operationalTrip,
    group,
    bookings: bookingsForOperationalGroup(readModel, group),
    contextSnapshot: buildOperationsContextSnapshot(group),
    readModel
  };
};

export const validateOperationsStaff = async (staffId, { required = false } = {}) => {
  const value = String(staffId || '').trim();
  if (!value && !required) return null;
  if (!isValidObjectId(value)) throw new OperationsDomainError(400, 'Invalid Staff identifier.', 'INVALID_STAFF_ID');
  const staff = await User.findOne({ _id: value, isActive: true, role: { $in: ['operations', 'admin', 'super_admin'] } }).select('_id name role');
  if (!staff) throw new OperationsDomainError(400, 'Assignee must be an active Operations or Administrator account.', 'INVALID_ASSIGNEE');
  return staff;
};

export const validateBookingInContext = (bookingId, bookings = [], { required = false } = {}) => {
  const value = String(bookingId || '').trim();
  if (!value && !required) return null;
  if (!isValidObjectId(value)) throw new OperationsDomainError(400, 'Invalid Booking identifier.', 'INVALID_BOOKING_ID');
  const booking = bookings.find((candidate) => String(candidate._id) === value);
  if (!booking) throw new OperationsDomainError(400, 'Selected Booking does not belong to this operational departure.', 'BOOKING_TRIP_MISMATCH');
  return booking;
};

export const validateServiceInTrip = async (serviceId, operationalTripId, { required = false } = {}) => {
  const value = String(serviceId || '').trim();
  if (!value && !required) return null;
  if (!isValidObjectId(value)) throw new OperationsDomainError(400, 'Invalid Operational Service identifier.', 'INVALID_SERVICE_ID');
  const service = await OperationalService.findOne({ _id: value, operationalTripId });
  if (!service) throw new OperationsDomainError(400, 'Selected Service does not belong to this operational departure.', 'SERVICE_TRIP_MISMATCH');
  return service;
};

export const validateIncidentInTrip = async (incidentId, operationalTripId, { required = false } = {}) => {
  const value = String(incidentId || '').trim();
  if (!value && !required) return null;
  if (!isValidObjectId(value)) throw new OperationsDomainError(400, 'Invalid Incident identifier.', 'INVALID_INCIDENT_ID');
  const incident = await OperationalIncident.findOne({ _id: value, operationalTripId });
  if (!incident) throw new OperationsDomainError(400, 'Selected Incident does not belong to this operational departure.', 'INCIDENT_TRIP_MISMATCH');
  return incident;
};

export const validateTaskInTrip = async (taskId, operationalTripId, { required = false } = {}) => {
  const value = String(taskId || '').trim();
  if (!value && !required) return null;
  if (!isValidObjectId(value)) throw new OperationsDomainError(400, 'Invalid Task identifier.', 'INVALID_TASK_ID');
  const task = await OperationalTask.findOne({ _id: value, operationalTripId });
  if (!task) throw new OperationsDomainError(400, 'Selected Task does not belong to this operational departure.', 'TASK_TRIP_MISMATCH');
  return task;
};

export const validateCorrectionInTrip = async (communicationId, operationalTripId) => {
  const value = String(communicationId || '').trim();
  if (!value) return null;
  if (!isValidObjectId(value)) throw new OperationsDomainError(400, 'Invalid Communication identifier.', 'INVALID_COMMUNICATION_ID');
  const communication = await OperationalCommunication.findOne({ _id: value, operationalTripId }).select('_id');
  if (!communication) throw new OperationsDomainError(400, 'Correction target does not belong to this operational departure.', 'COMMUNICATION_TRIP_MISMATCH');
  return communication;
};

export const bookingIdForPersistence = async (booking) => {
  if (booking?._id) return booking._id;
  if (!booking?.bookingId) return null;
  return Booking.findOne({ bookingId: booking.bookingId }).select('_id').then((record) => record?._id || null);
};
