# Operations Phase 2 — Execution & Vendor Report

## Architecture

Phase 2 preserves the Phase 1 Booking/Trip read model and adds a separate persistent execution layer:

- `OperationalTrip` owns coordinator assignment and journey-level execution notes.
- `OperationalService` owns Hotel, Transport, Activity, Guide, assignment, confirmation, documents, and immutable audit history.
- `Vendor` is a reusable, status-controlled directory with capability types, contacts, service areas, reference terms, and internal documents.

`Booking`, `Trip`, and `Booking.quotationSnapshot` remain authoritative source records and are never rewritten by Operations.

## Materialization and seeding

`POST /api/operations/trips/ensure` is the only materialization path. It reuses the exact Phase 1 `operationKey`, upserts `OperationalTrip` with `$setOnInsert`, and resolves current catalog Booking membership from the live read model. Dashboard and list GET requests never create execution records.

Custom quotation services are deterministically seeded from the immutable Booking snapshot. Unique `(operationalTripId, serviceKey)` keys and `$setOnInsert` make repeated ensures idempotent and preserve later operator edits. Catalog departures begin with no fabricated services. Source provider text is retained as context but is never automatically matched to a Vendor.

## APIs and RBAC

Protected `/api/operations` routes provide dashboard enrichment, departure listing/detail, coordinator selection, service CRUD and explicit transitions, document upload, and paginated Vendor CRUD/status operations. Every route requires authenticated `operations`, `admin`, or `super_admin` permission; Sales, Marketing, customers, and creators are denied.

Internal document uploads reuse the established Cloudinary/local storage utility and Multer's MIME/size validation. Vendor and service document metadata is exposed only through protected Operations APIs.

## Readiness and attention

Readiness is derived:

- `NOT_CONFIGURED`: no active execution services.
- `IN_PROGRESS`: at least one required service is not confirmed.
- `READY`: every required, non-cancelled service is confirmed.

Optional pending services do not block readiness. Near-departure unassigned, pending, or declined required services produce factual dashboard attention signals and aggregate metrics.

## UI

The Staff Control Center now includes:

- `/staff/operations/trips` — filterable, paginated departure execution list.
- `/staff/operations/trips/:id` — Overview, Stays, Transport, Activities & Guides, and read-only Source Handoff tabs.
- `/staff/operations/vendors` — factual Vendor KPIs, filters, desktop table, and mobile cards.
- Vendor create, detail, edit, active/inactive, document, and recent-usage views.

The UI follows the existing compact staff-console hierarchy, uses restrained semantic color, and preserves responsive layouts at mobile through desktop widths.

## Verification

- Operations Phase 1: 10/10 passing.
- Operations Phase 2: 11/11 passing.
- Staff access: 8/8 passing.
- Quotation V2: 10/10 passing.
- Payment reliability: 9/9 passing.
- Focused Operations lint: clean.
- Production frontend build: successful.

## Deferred scope

Phase 3 tasks, checklists, communications, complaints, issues, emergencies, and escalations are not implemented. Phase 4 payable amounts, expenses, Vendor settlements, trip closure, feedback, performance analytics, and reports are not implemented.
