# Quotation AI Smart Builder: Final Hardening Report

## Workflow

AI Planner -> saved itinerary -> authenticated or signed guest lead handoff -> Lead `sourceItineraryId` -> Quotation V2 Smart Assist preview -> staff-selected sections/candidates -> editable draft -> existing pricing, revision, share, and booking flow. This remains Quotation V2.

Staff can start from a lead, a saved itinerary, a public shared-plan URL/token, or a quotation-ready JSON file. Saved and lead-linked plans are resolved by the server using the staff member's access rights. JSON uploads are size- and shape-limited, and embedded identifiers are not trusted. Import apply reconstructs its patch from the authorized source; it does not accept a client-supplied patch. A changed source requires a fresh preview.

## Safety Boundaries

- The deterministic mapper carries trip facts, flexible dates as flexible dates, and only explicit meal facts. It does not convert a couple to a honeymoon, imply a hotel meal plan, invent inclusions, or use planner estimates as quotation prices.
- Hotel, activity, and transport suggestions start unselected with zero commercial values. Staff explicitly selects and prices services. Unselected AI candidates are omitted from public DTOs, PDFs, and booking conversion.
- AI text calls have a fixed field/action allowlist and limited trip-only context. Customer identity, supplier costs, and quotation pricing are excluded. Responses are bounded, validated, and previewed before staff application. AI cannot write pricing, customer identity, booking identifiers, or legal/payment numeric terms through import or text assistance.
- Payment defaults derive percentages and due days from the quotation's structured payment settings. Cancellation and refund defaults do not assert unsupported percentages or refund promises. Existing canonical policy text wins over legacy fields; legacy values remain readable in snapshots and public output.
- A guest lead link requires a short-lived itinerary-bound proof issued on save. Staff plan/lead imports are authorized server-side. AI endpoints are rate-limited. Import and AI-content saves generate audit events. Published revisions remain immutable.

## Editor

The Smart Assist panel offers search/pick, preview, section and candidate choices, conflict resolution, source-change warning, and import undo. Field-level Generate/Improve/Shorten/Format actions show a current-versus-suggested dialog with explicit Apply/Discard. Terms offer deterministic per-field defaults, Fill Safe Defaults, per-field AI, and Generate All; payment terms remain tied to structured settings. Inclusions and exclusions have factual generators, and missing day descriptions can be suggested in one batch.

## Verification

- `backend/test_quotation_ai_assist.js`: deterministic mapping, forbidden fields, merge preservation, defaults, privacy, handoff proof, Sales lead scope, rate limiting, and shared-link parsing.
- `backend/test_quotation_v2.js`: V2 behavior and public DTO candidate filtering.
- Payment reliability and frontend staff foundation suites passed during this pass.
- Frontend lint passed with warnings; production build passed. The live Vite app loaded and unauthenticated access to the Staff quotation route redirected to Staff Sign In.

## Manual QA Still Needed

The local backend was not running during browser QA, so Vite API proxy requests failed. An authenticated Sales/Admin session with a running API and representative MongoDB data is required to exercise the end-to-end editor: lead-linked and owned imports, shared link/JSON upload, candidate selections, conflict decisions, save/undo, AI calls with a configured Gemini key, PDF rendering, public OTP view, and booking conversion. Those flows were not claimed as browser-verified here. AI-assisted wording is unavailable without a configured provider; deterministic import and safe defaults continue to work. PDF/OCR ingestion is intentionally unsupported.
