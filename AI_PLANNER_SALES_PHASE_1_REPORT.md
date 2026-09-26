# AI Planner Sales Phase 1

## Architecture

The canonical chain is now AI Planner → persisted Itinerary → one linked Lead → Sales AI Planner Leads dossier → existing Quotation V2 builder. Customer identity and CRM lifecycle stay in Lead; complete trip-planning facts stay in Itinerary; commercial pricing remains in Quotation.

## Persistence and guest retention

`POST /api/ai/generate` uses optional authentication and persists the generated plan before returning success. Itinerary now stores planner context, season context, structured health checks, media, lifecycle status, version, and generation/edit timestamps. Authenticated plans have no retention expiry. Anonymous unconverted plans receive a configurable absolute TTL using `AI_GUEST_ITINERARY_RETENTION_DAYS` (default seven days).

Guests receive separate, short-lived JWT proofs for `ai_itinerary_guest_edit` and `ai_itinerary_lead_handoff`; neither token is stored in MongoDB. Updates require ownership, Admin authority, or the itinerary-bound guest edit token. Lead-linked plans clear their TTL and cannot be casually hard-deleted.

## Lead linkage and queue separation

AI Planner enquiries continue using `Lead` with `leadType=trip_enquiry`, `source=ai_planner`, and `sourceItineraryId`. Lead summary facts are derived from the authorized Itinerary, while customer identity comes from the Lead form. Repeated submission of the same source Itinerary returns the existing Lead. A partial unique index on `Lead.sourceItineraryId` also makes this invariant safe under concurrent submissions; existing deployments should audit any historical duplicate non-null source IDs before building the new index.

Sales queue semantics are server-authoritative: `expert_requests` contains callback requests only, `ai_planner` contains AI Planner trip enquiries only, and `all_sales` is their authorized union. A queue can narrow but never broaden access.

## Sales workspace and dossier

The Staff Sales navigation now includes AI Planner Leads for Sales, Admin, and Super Admin. The list is paginated and supports search and practical CRM filters without loading full day plans. The dedicated dossier endpoint returns a sanitized Lead, complete current source Itinerary, CRM activity, quotation history, source-plan state, and updated-after-enquiry indicator.

The detail UI presents customer facts, trip summary, traveler breakdown, structured preferences, day plans and media, AI stay and food suggestions, packing, tips, planning estimates, feasibility checks, CRM activity, and quotations. AI amounts are labeled planning estimates, not commercial prices.

## Quotation boundary

Phase 1 originally handed `leadId` and the authoritative `itineraryId` to `/staff/sales/quotations/new`. Phase 2 now builds and persists the populated Quotation V2 draft server-side from the authorized Lead and its linked Itinerary. See `AI_PLANNER_SALES_PHASE_2_REPORT.md`; Phase 1 remains the source-persistence, Lead-linkage, and Sales-dossier foundation.

## Security and tests

The dossier is restricted server-side to Sales, Admin, and Super Admin and excludes ownership fields, email storage metadata, share tokens, guest proofs, JWTs, and payment data. `npm run test:ai-planner-sales-phase1` covers the persistence contract, TTL, token purposes, authorization, queue isolation, source-derived summaries, lifecycle fields, and dossier sanitization. Existing Expert Request, AI Planner, quotation, payment, Staff access, lint, and production-build suites remain the regression boundary.
