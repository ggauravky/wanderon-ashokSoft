# AI Planner Sales Phase 2

## Outcome

The normal AI Planner Lead workflow is now one click: Sales selects **Create Smart Quotation**, the backend loads the authorized Lead and its exact source Itinerary, persists a fully populated Quotation V2 draft, and opens that draft directly in the existing editor. Repeated clicks return the current active quotation rather than creating an accidental duplicate.

## Server-side Smart Build

`POST /api/quotations/v2/from-ai-lead/:leadId` accepts no browser-authored quotation payload. It uses the existing Sales/Admin Lead authorization boundary and the shared deterministic quotation mapping pipeline. Gemini is not called during Smart Build.

The build maps Lead customer identity and factual Itinerary content: origin, exact or flexible dates, separate adults/children/infants/seniors, total travelers, structured trip preferences, every itinerary day, readable time-slot text, persisted media, safe client copy, and policy defaults. Free-form Lead and planner requests remain in `specialRequests`; structured preferences do not get duplicated there.

Planner budget and AI estimates are retained only in internal `planningReference`. The draft starts with zero manual pricing, zero supplier/customer candidate prices, no inclusions, and safe exclusions. Admin remains the commercial authority.

## Candidate review

Derived Hotel stay segments, one Transport preference, and deduplicated Activities are internal `AI_PLANNER` candidates. They start unselected in `SUGGESTED` state with source labels and day provenance. Staff can review/use, dismiss, and restore them through a focused backend endpoint; Activities also support day grouping and explicit bulk selection. Review status and reviewer timestamps are backend-owned, and Sales cannot use the review endpoint to change commercial fields.

Unselected AI candidates are removed from public quotations, PDFs, Booking snapshots, and Operations. A selected but unreviewed AI candidate produces a warning during editing and blocks pricing, finalization, and sharing.

## Source provenance and controlled refresh

Quotation provenance stores source version, generation/update timestamps, and build mode. Staff can open a sanitized Source Plan drawer and compare Journey, Dates, Travelers, Preferences, Itinerary, Media, Stays, Transport, and Activities. A changed source never silently changes the quotation; selected safe updates flow through the existing server-resolved Smart Assist import path.

## Revision, public, Booking, and Operations propagation

Revision snapshots retain origin, date mode, senior counts, trip preferences, and internal planning reference. Public DTOs expose only safe customer-facing preferences when enabled and never expose planning estimates or candidate-review metadata. All three PDF templates render origin, exact/flexible travel dates, separate traveler categories, and selected reviewed services.

Booking conversion calculates travelers including seniors, copies structured trip preferences, and uses the frozen approved quotation snapshot. The source Itinerary advances to `QUOTATION_LINKED` after draft creation and `BOOKED` after conversion. These lifecycle updates are non-fatal so they cannot destroy a successfully saved quotation or booking. Operations continues to seed only from the immutable Booking snapshot.

## Schema and migration

Changes are additive: Quotation journey fields, `tripPreferences`, internal `planningReference`, provenance fields, candidate review metadata, and `Booking.quotationSnapshot.tripPreferences`. No data migration or new origin/senior/preference index is required; legacy prefix detection preserves older AI candidates.

## Verification

Run:

```bash
cd backend
npm run test:ai-planner-sales-phase2
npm run test:ai-planner-sales-phase1
npm run test:quotation-ai
npm run test:quotation-v2
npm run test:payment-reliability
npm run test:operations-phase1
npm run test:operations-phase2
npm run test:operations-phase3
npm run test:operations-phase4

cd ../frontend
npm run test:staff-foundation
npm run test:quotation-smart-builder
npm run test:quotation-ai-ui
npm run lint
npm run build
```

The connected-database Lead-to-Quotation, candidate-review, source-change, public/PDF, and Booking/Operations journeys remain release-gate manual QA.
