# Operations Phase 3 — Tasks, Communications & Incidents

## Architecture

Phase 3 extends the existing `OperationalTrip` boundary without changing Booking, Trip, quotation, service, or Vendor authority:

- `OperationalTask` stores human coordination work, assignment, due dates, links, and an immutable lifecycle history.
- `OperationalCommunication` stores append-only factual logs of communications that already occurred. It never claims a provider sent or delivered a message.
- `OperationalIncident` stores issue scope, selected severity, ownership, internal escalation, resolution, documents, and a complete lifecycle timeline.
- All three store a small immutable journey context snapshot for fast, understandable global lists. No customer prices, supplier costs, margins, payment credentials, or share tokens enter that snapshot.

## Tasks and checklist

The standard checklist is initialized only by explicit `POST`, uses stable `(operationalTripId, taskKey)` identity, and applies `bulkWrite` with `$setOnInsert`. Repeated initialization cannot duplicate tasks or overwrite assignees, edited dates, notes, or status. Due dates are derived against the journey start using India-safe calendar boundaries; unknown travel dates remain `null`. The Transport-specific driver-details task is added only when a real Transport execution service exists.

Task status is changed only through start, block, complete, reopen, or cancel endpoints. Required reasons, actor metadata, timestamps, idempotent completion, and optimistic concurrency preserve the audit trail. Assignment accepts only active Operations, Admin, or Super Admin accounts and does not make records private.

## Communication semantics

Customer Updates are trip-wide or tied to a Booking that belongs to the current operational group. Service, Incident, Task, and correction references are also validated within the same journey. Past timestamps are accepted; invalid or unreasonable future timestamps are rejected. There are no update or delete routes for normal Staff.

## Incident lifecycle

Incident codes use collision-safe random identifiers. Scope validates trip-wide, Booking, or Service relationships; Service scope derives its Vendor relationship and display snapshot. Explicit actions cover start, assignment, escalation, escalation acknowledgement, resolution, close, and reasoned reopen. Repeated compatible transitions are idempotent. Incident evidence reuses the protected Operations upload path, and customer updates or manually requested follow-up tasks link back to the Incident.

## Dashboard and UI

The Operations dashboard adds real Open Tasks, Overdue Tasks, Open Incidents, and Critical Incidents metrics plus capped urgent-task and active-issue lists. Task and Incident attention reasons enrich the departure attention surface while Phase 2 execution readiness remains service-only.

Staff routes include `/staff/operations/tasks`, `/staff/operations/issues`, `/staff/operations/issues/:incidentId`, and lazy `tasks`, `updates`, and `issues` tabs on Trip Execution detail. Desktop tables become mobile cards, severity is always accompanied by text, and Phase 3 dialogs support Escape close and labelled controls.

## RBAC and verification

Six Phase 3 permissions are restricted to `operations`, `admin`, and `super_admin`. Mongo disconnection returns controlled `503` responses; Sales, Marketing, customer, and creator roles are denied.

`backend/test_operations_phase3.js` covers models/indexes, context privacy, checklist idempotency and due dates, task lifecycle and assignment roles, append-only communication validation, relationship scope, Incident lifecycle/escalation, dashboard attention/readiness separation, and RBAC. Existing Phase 1, Phase 2, quotation, payment, staff-access, lint, and production-build suites remain the regression authority.

## Deferred Phase 4

Vendor payables and settlements, expense ledgers, profitability, trip financial closure, customer feedback analytics, post-trip reports, Vendor performance scoring, and trip closure workflow are not implemented.
