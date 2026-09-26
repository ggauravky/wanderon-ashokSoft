# Quotation PDF production hardening

## Scope and architecture

The three existing React templates remain `signature_luxe` (Signature Luxe), `journey` (Journey Journal), and `minimal` (Expedition Dossier). No fourth template or separate document model was introduced. The previously referenced `exportPagedElementToPdf` did not exist, so V2 downloads could fail at dynamic import; it is now implemented as the compatibility exporter.

For finalized staff quotations, `POST /api/quotations/:id/v2/pdf` authorizes the staff member against the quotation, reads the requested immutable revision, builds the existing customer-safe revision DTO, and renders that DTO through the same React templates in headless Chromium. Only a finalized revision belonging to that quotation is accepted. Chromium receives the DTO through `addInitScript`, not a public token or a new data endpoint. The renderer waits for fonts, image/document previews, and layout validation before printing A4 pages. Browser-native text and links remain selectable. The service is off by default; drafts and unavailable-service responses retain the page-by-page html2canvas/jsPDF fallback. Public share downloads continue to use their already authorized immutable DTO and the browser fallback.

The internal print page is blank without server-injected data. Chromium blocks network requests outside the configured frontend/API origins and exact HTTPS media hosts, and blocks service workers. It runs with sandboxing enabled unless an operator explicitly sets `QUOTATION_PDF_DISABLE_SANDBOX=true`. The endpoint is staff RBAC-protected and rate-limited; no supplier-cost or internal attachment fields enter the render DTO.

## Media and content

- Hotel primary-gallery media takes precedence over the legacy hero URL; the full gallery is normalized and split into continuation cards so secondary images are not silently dropped. Hotel notes and amenities now appear in all three templates.
- Transport mode icons, vehicle media, customer notes, references, schedule, seats, and baggage appear in the transport cards. Expedition Dossier adds detail pages when its compact matrix cannot carry those facts.
- Hotel vouchers, tickets, and general customer documents are tied to their related service. Visibility rules are enforced both in the public DTO and in the presentation model; approval/booking flags and visibility survive DTO serialization. Internal-only or non-HTTPS documents do not enter the customer model.
- PDF.js is lazy-loaded with a worker for first-page ticket previews. Image tickets use contained previews. All document pages retain a titled original link and QR code. A failed preview leaves the original link and a visible fallback.
- Morning, afternoon, evening, highlights, selected activities/add-ons, policy prose, hotel notes, and gallery continuations are printed rather than omitted by compact templates.

## Layout and QA

The PDF preflight waits for fonts, images, and document previews, then measures every A4 page for horizontal overflow, vertical overflow, and actual content-to-footer collision. Unsafe pages abort export instead of being clipped. Long itinerary prose, hotel notes/amenities/gallery, and policy text are split into continuation fragments. The print helper no longer injects Tailwind from a CDN or changes CORS mode after an image error.

Local Chromium generated real PDFs for all three templates from the 14-day stress fixture. Physical PDF page counts matched the page models: Signature Luxe **40** (6.40 MB), Journey Journal **32** (6.83 MB), and Expedition Dossier **31** (3.03 MB). Each prepared **4 customer documents** with **0 document-preview failures** and no measured overlap. The minimal fixture produced 6/4/3 pages, the broken-media fixture 8/6/7 pages with visible image fallbacks, and the 20-day extreme fixture 97/78/61 pages (template order as above), all without measured overlap. Cover, itinerary, hotel, transport, image-ticket, PDF-ticket, and terms pages were rendered and visually inspected. The PDF text layer contains the final customer price and itinerary slots; embedded ticket thumbnails are images, with full originals linked separately. A separate server-renderer smoke PDF has four physical A4 pages, selectable text, and the expected quotation title metadata.

Focused quotation PDF tests cover customer-safe fields, gallery selection and continuation, transport/document relationships, visibility, price exposure, pagination, template registry, and file naming. Native-renderer tests cover exact-origin/HTTPS allowlisting. Frontend quotation/staff regression tests passed (35/35); selected backend quotation, AI Planner, document, and renderer regressions passed (75/75). Frontend production build passed. Lint exits successfully with existing repository warnings; the build reports a pre-existing large-chunk warning. Package installation reported audit findings that were not modified as part of this scoped pass.

## Render deployment requirements

`QUOTATION_SERVER_PDF_ENABLED=true` enables native output. Set `FRONTEND_URL` to the production HTTPS SPA origin. Set `QUOTATION_PDF_API_ORIGIN` when the API is on a different origin, and `QUOTATION_PDF_MEDIA_HOSTS` to a comma-separated list of exact trusted HTTPS hosts (Cloudinary is the default). `QUOTATION_PDF_CHROMIUM_EXECUTABLE` may point to an operator-managed Chromium binary. Node 20+ and a Chromium binary with its Linux system libraries are required. Install Chromium during the backend build (`npx playwright install chromium`) and ensure its system dependencies are present; [Playwright's browser guide](https://playwright.dev/docs/browsers) documents `install --with-deps`. Because Render native runtime dependency availability can differ from local Windows, a [Render Docker service](https://render.com/docs/docker) with explicit Chromium/system packages is the predictable production path; [Render native runtime documentation](https://render.com/docs/native-runtimes) should be checked for the chosen instance. Only set `QUOTATION_PDF_DISABLE_SANDBOX=true` where a root/container runtime requires it after reviewing that security trade-off.

The native renderer was successfully smoke-tested locally with installed Chrome and a real A4 PDF. It has **not** been enabled or verified on Render; the feature flag should remain off until Chromium installation, memory/headroom, HTTPS origins, and a production smoke test are confirmed. The browser fallback remains operational while the flag is off.

## Known limits

- Cross-origin PDF.js thumbnails require the storage host to send CORS headers; an uncooperative host yields the visible fallback and original link. The browser-native renderer only fetches explicitly allowlisted HTTPS media hosts.
- Only the first page of an attached PDF is embedded as a preview; the full source remains available through its original link and QR code. Original ticket bytes are not merged into the quotation PDF.
- Server-native output is currently staff-only for immutable revisions. Unsaved drafts and public share downloads use the validated browser exporter.
- Very large quotations create many pages and can require substantial Chromium memory and time. The local extreme fixture verifies layout, not production-instance capacity or live customer documents.
