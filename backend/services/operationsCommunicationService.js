import { COMMUNICATION_CHANNELS, COMMUNICATION_DIRECTIONS, COMMUNICATION_TYPES } from '../models/OperationalCommunication.js';
import { OperationsDomainError } from './operationsExecutionService.js';

const clean = (value) => String(value || '').trim();

export const validateCommunicationPayload = (payload = {}, now = new Date()) => {
  const direction = String(payload.direction || '').toUpperCase();
  const channel = String(payload.channel || '').toUpperCase();
  const communicationType = String(payload.communicationType || '').toUpperCase();
  const summary = clean(payload.summary);
  if (!COMMUNICATION_DIRECTIONS.includes(direction)) throw new OperationsDomainError(400, 'A valid communication direction is required.', 'INVALID_COMMUNICATION_DIRECTION');
  if (!COMMUNICATION_CHANNELS.includes(channel)) throw new OperationsDomainError(400, 'A valid communication channel is required.', 'INVALID_COMMUNICATION_CHANNEL');
  if (!COMMUNICATION_TYPES.includes(communicationType)) throw new OperationsDomainError(400, 'A valid communication type is required.', 'INVALID_COMMUNICATION_TYPE');
  if (!summary) throw new OperationsDomainError(400, 'Communication summary is required.', 'COMMUNICATION_SUMMARY_REQUIRED');
  const occurredAt = payload.occurredAt ? new Date(payload.occurredAt) : now;
  if (Number.isNaN(occurredAt.getTime())) throw new OperationsDomainError(400, 'Invalid communication time.', 'INVALID_OCCURRED_AT');
  if (occurredAt.getTime() > now.getTime() + 10 * 60 * 1000) throw new OperationsDomainError(400, 'Communication time cannot be in the future.', 'FUTURE_OCCURRED_AT');
  return { direction, channel, communicationType, summary, details: clean(payload.details), occurredAt };
};
