import crypto from 'crypto';
import { INCIDENT_SCOPES, INCIDENT_SEVERITIES, INCIDENT_STATUSES, INCIDENT_TYPES } from '../models/OperationalIncident.js';
import { OperationsDomainError } from './operationsExecutionService.js';

const clean = (value) => String(value || '').trim();
const actorFields = (actor, now) => ({ actorId: actor?.id || null, actorName: clean(actor?.name), at: now });
const pushHistory = (incident, action, fromStatus, toStatus, actor, note, now) => {
  incident.history.push({ action, fromStatus, toStatus, note: clean(note), ...actorFields(actor, now) });
};

export const createIncidentCode = (now = new Date(), randomBytes = crypto.randomBytes) => `INC-${now.getUTCFullYear()}-${randomBytes(3).toString('hex').toUpperCase()}`;

export const validateIncidentFields = (payload = {}, now = new Date()) => {
  const title = clean(payload.title);
  const description = clean(payload.description);
  const incidentType = String(payload.incidentType || '').toUpperCase();
  const severity = String(payload.severity || '').toUpperCase();
  const scope = String(payload.scope || '').toUpperCase();
  if (!title) throw new OperationsDomainError(400, 'Incident title is required.', 'INCIDENT_TITLE_REQUIRED');
  if (!description) throw new OperationsDomainError(400, 'Incident description is required.', 'INCIDENT_DESCRIPTION_REQUIRED');
  if (!INCIDENT_TYPES.includes(incidentType)) throw new OperationsDomainError(400, 'Invalid incident type.', 'INVALID_INCIDENT_TYPE');
  if (!INCIDENT_SEVERITIES.includes(severity)) throw new OperationsDomainError(400, 'Invalid incident severity.', 'INVALID_INCIDENT_SEVERITY');
  if (!INCIDENT_SCOPES.includes(scope)) throw new OperationsDomainError(400, 'Invalid incident scope.', 'INVALID_INCIDENT_SCOPE');
  const reportedAt = payload.reportedAt ? new Date(payload.reportedAt) : now;
  if (Number.isNaN(reportedAt.getTime()) || reportedAt.getTime() > now.getTime() + 10 * 60 * 1000) throw new OperationsDomainError(400, 'Reported time must be valid and cannot be in the future.', 'INVALID_REPORTED_AT');
  return { title, description, incidentType, severity, scope, reportedAt, actionTaken: clean(payload.actionTaken) };
};

export const validateIncidentScopeRelations = (scope, { booking = null, service = null } = {}) => {
  if (scope === 'TRIP_WIDE' && (booking || service)) throw new OperationsDomainError(400, 'Trip-wide Incidents cannot include a Booking or Service scope reference.', 'INVALID_INCIDENT_SCOPE_RELATION');
  if (scope === 'BOOKING' && (!booking || service)) throw new OperationsDomainError(400, 'Booking-scoped Incidents require a Booking from this journey and no Service reference.', 'INVALID_INCIDENT_SCOPE_RELATION');
  if (scope === 'SERVICE' && (!service || booking)) throw new OperationsDomainError(400, 'Service-scoped Incidents require a Service from this journey and no Booking reference.', 'INVALID_INCIDENT_SCOPE_RELATION');
  return true;
};

export const startIncident = (incident, actor, now = new Date()) => {
  if (incident.status === 'IN_PROGRESS') return false;
  if (incident.status !== 'OPEN') throw new OperationsDomainError(409, 'Only an open Incident can be started.', 'INVALID_INCIDENT_TRANSITION');
  incident.status = 'IN_PROGRESS';
  pushHistory(incident, 'STARTED', 'OPEN', 'IN_PROGRESS', actor, '', now);
  return true;
};

export const escalateIncident = (incident, note, actor, now = new Date()) => {
  const value = clean(note);
  if (!value) throw new OperationsDomainError(400, 'An escalation note is required.', 'ESCALATION_NOTE_REQUIRED');
  if (['RESOLVED', 'CLOSED'].includes(incident.status)) throw new OperationsDomainError(409, 'A resolved or closed Incident cannot be escalated.', 'INVALID_INCIDENT_TRANSITION');
  if (incident.escalation?.status === 'ESCALATED' && incident.escalation?.note === value) return false;
  incident.escalation = { status: 'ESCALATED', escalatedAt: now, escalatedBy: actor.id, note: value, acknowledgedAt: null, acknowledgedBy: null };
  pushHistory(incident, 'ESCALATED', incident.status, incident.status, actor, value, now);
  return true;
};

export const acknowledgeIncidentEscalation = (incident, actor, now = new Date()) => {
  if (incident.escalation?.status === 'ACKNOWLEDGED') return false;
  if (incident.escalation?.status !== 'ESCALATED') throw new OperationsDomainError(409, 'Only an escalated Incident can be acknowledged.', 'INVALID_ESCALATION_TRANSITION');
  incident.escalation.status = 'ACKNOWLEDGED';
  incident.escalation.acknowledgedAt = now;
  incident.escalation.acknowledgedBy = actor.id;
  pushHistory(incident, 'ESCALATION_ACKNOWLEDGED', incident.status, incident.status, actor, '', now);
  return true;
};

export const resolveIncident = (incident, summary, actor, now = new Date()) => {
  const value = clean(summary);
  if (!value) throw new OperationsDomainError(400, 'A resolution summary is required.', 'RESOLUTION_SUMMARY_REQUIRED');
  if (incident.status === 'RESOLVED' && incident.resolutionSummary === value) return false;
  if (!['OPEN', 'IN_PROGRESS'].includes(incident.status)) throw new OperationsDomainError(409, 'Only an active Incident can be resolved.', 'INVALID_INCIDENT_TRANSITION');
  const from = incident.status;
  incident.status = 'RESOLVED';
  incident.resolutionSummary = value;
  incident.resolvedAt = now;
  incident.resolvedBy = actor.id;
  pushHistory(incident, 'RESOLVED', from, 'RESOLVED', actor, value, now);
  return true;
};

export const closeIncident = (incident, actor, now = new Date()) => {
  if (incident.status === 'CLOSED') return false;
  if (incident.status !== 'RESOLVED') throw new OperationsDomainError(409, 'Only a resolved Incident can be closed.', 'INVALID_INCIDENT_TRANSITION');
  incident.status = 'CLOSED';
  incident.closedAt = now;
  incident.closedBy = actor.id;
  pushHistory(incident, 'CLOSED', 'RESOLVED', 'CLOSED', actor, '', now);
  return true;
};

export const reopenIncident = (incident, reason, actor, now = new Date()) => {
  const value = clean(reason);
  if (!value) throw new OperationsDomainError(400, 'A reopen reason is required.', 'REOPEN_REASON_REQUIRED');
  if (!['RESOLVED', 'CLOSED'].includes(incident.status)) throw new OperationsDomainError(409, 'Only a resolved or closed Incident can be reopened.', 'INVALID_INCIDENT_TRANSITION');
  const from = incident.status;
  incident.status = 'IN_PROGRESS';
  incident.resolvedAt = null;
  incident.resolvedBy = null;
  incident.closedAt = null;
  incident.closedBy = null;
  pushHistory(incident, 'REOPENED', from, 'IN_PROGRESS', actor, value, now);
  return true;
};

export const summarizeIncidents = (incidents = [], now = new Date()) => {
  const active = incidents.filter((incident) => ['OPEN', 'IN_PROGRESS'].includes(incident.status));
  const { start, end } = (() => { const value = new Date(now); const start = new Date(value); start.setHours(0, 0, 0, 0); return { start, end: new Date(start.getTime() + 86400000) }; })();
  return {
    open: incidents.filter((incident) => incident.status === 'OPEN').length,
    inProgress: incidents.filter((incident) => incident.status === 'IN_PROGRESS').length,
    active: active.length,
    resolved: incidents.filter((incident) => incident.status === 'RESOLVED').length,
    critical: active.filter((incident) => incident.severity === 'CRITICAL').length,
    high: active.filter((incident) => incident.severity === 'HIGH').length,
    escalated: active.filter((incident) => incident.escalation?.status === 'ESCALATED').length,
    resolvedToday: incidents.filter((incident) => incident.resolvedAt && new Date(incident.resolvedAt) >= start && new Date(incident.resolvedAt) < end).length
  };
};

export const isKnownIncidentStatus = (status) => INCIDENT_STATUSES.includes(status);
