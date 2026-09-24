# Quotation AI Smart Builder Report

## Architecture

AI Planner -> Saved Itinerary + Planner Context -> Lead `sourceItineraryId` -> Quotation V2 Smart Import -> deterministic mapping + optional AI text drafts -> human review -> existing Admin pricing -> immutable revision/share/booking flow.

The implementation preserves the existing Quotation V2 engine and does not create a Quotation V3 or replacement workflow.

## Schema Enhancements

- `Itinerary.plannerContext` stores trip-only context.
- `Lead.sourceItineraryId` links AI Planner enquiries to a saved itinerary.
- `Quotation.sourceItineraryId` records the AI source plan for quotation drafts.

Customer identity is not stored in `plannerContext`.

## Protected Fields

Smart Assist never writes `manualPricing`, `pricing`, final customer price, supplier costs, deposit/balance amounts, payment schedule amounts, discounts/markup, GST/TCS, booking references, PNRs, vehicle numbers, driver details, or customer identity.

## Implementation

- Backend service: `backend/services/quotationAiService.js`
- Backend routes: `/api/quotations/v2/ai/import-preview`, `/api/quotations/:id/v2/ai/import-apply`, and AI draft text endpoints
- Planner handoff: real saved itinerary, canonical lead type/source, required email, no fake success
- Planner export: quotation-ready JSON
- Quotation editor: Smart Assist preview/apply/draft panel

## Tests

- `backend/test_quotation_ai_assist.js` covers journey mapping, traveler/senior handling, flexible date handling, itinerary array formatting, pricing isolation, and fill-empty conflict behavior.

## Limitations

- AI wording degrades to safe starter copy when Gemini is unavailable.
- Hotel, activity, and transport candidates require staff review and manual pricing.
- PDF/OCR import is intentionally unsupported in V1.
