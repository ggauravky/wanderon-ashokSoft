# Hotel Catalog and Quotation Integration

## Scope

- Separate `Hotel` property model and Admin Hotels workspace. The existing Operations `Vendor` model and execution workflow remain unchanged; linking a HOTEL-type Vendor is optional.
- Role-guarded `/api/hotels` list/detail/create/edit/status endpoints. Sales list/detail returns only ACTIVE properties through a safe DTO. Admin sees internal contact, vendor, notes, and reference rates.
- Structured property, location, stay, room, meal, media, and commercial reference data. Media references are validated against active Media Library images and normalized on the server.
- Quotation V2 catalog picker, AI stay replacement, manual option fallback, room and meal selection, stay configuration, and explicit catalog refresh. The server reconstructs catalog identity and images before draft save.

## Trust and lifecycle

1. Admin creates a DRAFT Hotel, saves its room types, chooses a Media Library hero, and specifies available meal plans. Activation validates those facts. INACTIVE and ARCHIVED hotels disappear from Sales search; archival does not touch old quotations.
2. Sales chooses an ACTIVE property and a valid room/meal combination. The catalog API never supplies supplier rates or contacts to Sales. New quotation catalog options start with zero component price and UNCONFIRMED availability.
3. Admin can explicitly request a matching reference rate for a dated stay. Expired, not-yet-valid, inactive, wrong-room, wrong-meal, and too-short rates are rejected server-side.
4. The saved quotation contains Hotel code, catalog version, room ID, meal code, property name, location, amenities, and media snapshot. Normal saves keep those facts frozen. Explicit refresh re-reads the active Hotel and preserves stay and commercial fields.
5. The existing immutable Quotation Revision remains the source for customer view, PDF, Booking, and Operations. Neither a catalog edit nor archive rewrites a revision.

## Verification

- `backend/npm run test:hotel-catalog`: model, role guard, activation, safe DTO, escaped search, trusted media, forged field rejection, snapshot freeze/refresh, rate validity, and public quotation privacy.
- Existing Quotation V2, AI handoff/assist, PDF renderer, Staff access, Smart Builder UI, and frontend PDF tests are run as regressions.
- Frontend Oxlint and Vite production build are run. Oxlint currently reports repository-wide warnings but exits successfully.

## Live QA pending

A connected development database and real Admin/Sales sessions are required to verify CRUD, Cloudinary upload, role denials, full quotation save/reload, PDF preview, AI candidate replacement, Booking snapshot, and Operations handoff in the browser. No live catalog records were created during offline development.
