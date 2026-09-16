# WanderLuxe Staff Control Center Rebuild: Phase 2 Foundation Report

**Date:** 2026-09-16

**Phase result:** PASS

**Current branch:** `main`

**Current HEAD:** `f6324d8 sales`

## 1. Baseline Git State

- Local `main` initially pointed to `d13b42a` and was one commit behind `origin/main`.
- Existing untracked content was limited to `.serena/` and `ADMIN_STAFF_DASHBOARD_PHASE_1_ARCHITECTURE_AUDIT.md`; both were preserved.
- `git fetch` confirmed the single upstream commit `f6324d8 sales`.
- The upstream delta was inspected before synchronization. It contained the expected ObjectId/synthetic-identity hardening, including `backend/utils/mongoId.js` and related controller/middleware changes.
- `git pull --ff-only` completed successfully. Local `main`, `origin/main`, and `origin/HEAD` now resolve to `f6324d8`.
- No reset, clean, force checkout, force push, or collaborator-file overwrite was used.

## 2. Phase 1 Findings Used

The implementation follows these Phase 1 findings:

- `AdminDashboard.jsx` remains the canonical Admin workspace and was not extended or refactored.
- `/staff/sales` remains the canonical Sales workspace.
- `/admin/sales` remains a compatibility redirect.
- `AuthContext`, the current JWT, and `RoleProtectedRoute` remain the authentication/session foundation.
- Only `admin`, `super_admin`, and `sales` are currently accepted by `staffLogin()`.
- Frontend navigation metadata is presentation only; backend authorization remains authoritative.
- The Staff foundation performs no business-domain fetches.

## 3. Files Added

- `frontend/src/staff/StaffShell.jsx`
- `frontend/src/staff/StaffOverview.jsx`
- `frontend/src/staff/staffNavigation.js`
- `frontend/src/staff/staffAccess.js`
- `frontend/src/staff/staffAccess.test.js`
- `frontend/src/staff/components/StaffSidebar.jsx`
- `frontend/src/staff/components/StaffTopbar.jsx`
- `frontend/src/staff/components/StaffMobileNav.jsx`
- `frontend/src/staff/components/StaffWorkspaceCard.jsx`
- `STAFF_CONTROL_CENTER_PHASE_2_FOUNDATION_REPORT.md`

## 4. Files Modified

- `frontend/src/App.jsx`: adds the standalone `/staff` protected route and nested overview route.
- `frontend/package.json`: adds `test:staff-foundation` using Node's built-in test runner.

No Admin, Sales, authentication, route-guard, or backend source file was modified by Phase 2.

## 5. New `/staff` Route Architecture

`/staff` is a top-level route outside the customer `MainLayout` boundary:

```text
AuthProvider
└── BrowserRouter
    ├── /staff
    │   └── RoleProtectedRoute(admin, super_admin, sales)
    │       └── StaffShell
    │           └── Outlet
    │               └── StaffOverview (index)
    └── /
        └── MainLayout
            ├── customer routes
            ├── existing /admin routes
            └── existing /staff/sales route
```

This preserves route matching for `/staff/sales` while making `/staff` capable of receiving future nested workspace routes.

## 6. StaffShell Architecture

`StaffShell` owns layout state only:

- resolves visible navigation from the central registry;
- derives the presentation role label;
- renders desktop and mobile navigation;
- renders a sticky Staff top bar;
- exposes `user`, `roleLabel`, and `visibleModules` through Outlet context;
- handles sign-out through the existing `AuthContext.logout()`;
- renders nested content through React Router's `Outlet`.

It does not import AdminDashboard, SalesPortal, API clients, charts, or business modules.

## 7. Navigation Registry

`staffNavigation.js` is the single presentation registry for Phase 2. Each module defines:

- `id`
- `label`
- `path`
- `icon`
- `roles`
- `section`
- `status`
- `description`
- optional exact-route behavior

`staffAccess.js` provides pure helpers:

- `normalizeStaffRole(role)`
- `canViewStaffModule(role, module)`
- `getVisibleStaffModules(role)`
- `getStaffRoleLabel(role)`
- `getStaffSectionLabel(sectionId, role)`

These helpers govern UI presentation only and do not duplicate backend `ACTION_PERMISSIONS`.

## 8. Role Visibility Matrix

| Navigation item | Super Admin | Admin | Sales | Marketing | Operations | Customer/unknown |
|---|---:|---:|---:|---:|---:|---:|
| Overview | Yes | Yes | Yes | No | No | No |
| Admin Control Center | Yes | Yes | No | No | No | No |
| Sales Desk | Yes | Yes | Yes | No | No | No |

Presentation labels remain separate from backend role values:

| Backend role | UI label |
|---|---|
| `super_admin` | Super Administrator |
| `admin` | Administrator |
| `sales` | Sales Specialist |
| `marketing` | Marketing |
| `operations` | Operations |

## 9. Desktop UI Structure

- Fixed 288px navy/slate sidebar at 1024px and above.
- Compact sticky white top bar with page title, current staff identity, role context, and an Open Website link.
- Light neutral workspace canvas with hairline borders and restrained elevation.
- Overview content contains a welcome panel, current role, and registry-generated workspace links only.
- No fake metrics, notifications, charts, online counts, or fabricated operational data were added.
- The visual direction uses the selected Linear-style principles of compact radii, low-shadow hierarchy, clear typography, and restrained emerald emphasis, adapted to the existing WanderLuxe brand rather than copied.

## 10. Mobile UI Structure

- The fixed desktop sidebar is removed below 1024px.
- A top-bar menu button opens a slide-out navigation dialog.
- Drawer width is capped at 20rem and 88vw.
- Escape closes the drawer.
- Clicking the backdrop closes the drawer.
- Body scroll is locked while the drawer is open and restored after close.
- Focus moves to the drawer close button, is trapped within the drawer in both Tab directions, and returns to the menu trigger after close.
- The background shell is hidden from assistive technology while the modal drawer is open.
- Links and controls retain semantic elements and visible focus behavior.

Responsive browser checks were run at 360, 390, 430, 768, 1024, 1280, 1440, and 1920px. No tested width produced horizontal document overflow.

## 11. Existing Route Compatibility

| Route | Result | Evidence |
|---|---|---|
| `/admin/login` | PASS | Existing Staff login rendered and retained its customer MainLayout behavior. |
| `/admin` | PASS | Existing `AdminDashboard` rendered after Admin login. |
| `/admin/quotations` | PASS by unchanged route contract | Route definition and guard were not changed. |
| `/admin/quotations/:id` | PASS by unchanged route contract | Route definition and allowed roles were not changed. |
| `/admin/quotations/:quoteId/edit` | PASS by unchanged route contract | Route definition and guard were not changed. |
| `/admin/bookings/:id` | PASS by unchanged route contract | Route definition and guard were not changed. |
| `/staff/sales` | PASS | Existing `SalesPortal` rendered after Sales login. |
| `/admin/sales` | PASS | Runtime redirected to `/staff/sales`. |
| `/staff` | PASS | New standalone StaffShell rendered. |

## 12. Existing Admin Regression Result

PASS.

- Admin login still routes to `/admin`.
- The existing AdminDashboard rendered with its original navigation and analytics surface.
- Direct Admin navigation to `/staff` rendered the new shell with Overview, Admin Control Center, and Sales Desk.
- Phase 2 did not edit or import Admin business logic.

## 13. Existing Sales Regression Result

PASS.

- Sales login still routes to `/staff/sales`.
- Existing SalesPortal rendered and its shared queue remained available.
- Direct Sales navigation to `/staff` rendered the new shell.
- Sales saw Overview and Sales Desk only.
- Direct Sales navigation to `/admin` still redirected to `/staff/sales`.
- Phase 2 did not edit Sales business logic.

## 14. Public Website Regression Result

PASS for the browser-smoke scope.

- `/` rendered the public home experience and primary heading with no console error.
- `/trips/india` rendered the existing trip catalog and public trip links.
- Customer Navbar and Footer remained on the legacy/public route tree.
- Customer Navbar and Footer were absent from `/staff`.

## 15. Business API Network Check

PASS: zero business-domain requests originate from StaffShell or StaffOverview.

- No Phase 2 Staff file imports `services/api`, Axios, or any Admin/Sales business module.
- No Phase 2 Staff file contains `fetch`, Axios calls, or `/api/` endpoints.
- The existing global `AuthProvider` may perform its normal session validation (`/api/auth/me`); this is not a StaffShell business-data request.
- Browser console inspection found no errors on the tested Staff routes.
- The browser control surface did not expose request-level network capture, so the zero-business-request result is additionally grounded by complete source inspection of the isolated Staff directory.

## 16. Build Result

PASS.

```text
vite v8.2.0
2537 modules transformed
production build completed in approximately 2.85s
```

The existing oversized main-chunk warning remains. Phase 2 did not expand scope into application-wide code splitting.

## 17. Lint Result

### New Phase 2 code

PASS.

```text
npm exec oxlint -- src/staff src/App.jsx
0 errors
0 warnings
```

### Full repository lint

FAIL due only to the same 11 pre-existing hook-order errors identified in Phase 1:

- `src/components/TripCard.jsx`: 3 errors
- `src/components/ShareItineraryModal.jsx`: 8 errors

The repository also has existing warnings in unrelated files. No new Phase 2 lint diagnostic was introduced.

## 18. Automated Foundation Test Result

PASS.

Command:

```text
npm run test:staff-foundation
```

Result:

```text
tests: 5
pass: 5
fail: 0
```

Covered behavior:

- Admin and Super Admin see Overview, Admin Control Center, and Sales Desk.
- Sales sees Overview and Sales Desk.
- Sales cannot see Admin Control Center.
- Customer, Influencer, empty, and unknown role values receive no Staff navigation.
- Role casing is normalized.
- Presentation labels normalize backend role values.

## 19. Browser E2E Matrix

| Test | Result | Runtime result |
|---|---|---|
| 1. Unauthenticated `/staff` | PASS | Redirected to `/admin/login`. |
| 2. Admin `/admin` | PASS | Existing AdminDashboard rendered. |
| 3. Admin `/staff` | PASS | Standalone StaffShell rendered. |
| 4. Admin navigation visibility | PASS | Admin Control Center and Sales Desk visible. |
| 5. Sales `/staff/sales` | PASS | Existing SalesPortal rendered. |
| 6. Sales `/staff` | PASS | Standalone StaffShell rendered. |
| 7. Sales navigation visibility | PASS | Sales Desk visible; Admin Control Center absent. |
| 8. Sales `/admin` | PASS | Redirected to `/staff/sales`. |
| 9. `/admin/sales` | PASS | Redirected to `/staff/sales`. |
| 10. Customer/unknown Staff visibility | PASS | Pure access tests return no modules; unchanged route guard denies non-staff roles. No customer account was created solely for this test. |
| 11. Existing homepage `/` | PASS | Public homepage rendered with no console error. |
| 12. Existing public Trip routes | PASS | `/trips/india` rendered its catalog. |

Additional browser checks:

- no duplicate customer navigation or Footer inside StaffShell;
- no white screen or route loop;
- no console errors on tested Staff/public routes;
- mobile drawer Escape and backdrop close both work;
- drawer focus containment and trigger-focus restoration work;
- no horizontal overflow at all eight requested widths;
- logout returns to `/admin/login`;
- direct URL entry works for `/staff`, `/staff/sales`, `/admin`, `/admin/sales`, `/`, and `/trips/india`.

## 20. Known Limitations

- `/staff` is an intentionally empty foundation; no business module has been migrated.
- Login destinations remain `/admin` for Admin/Super Admin and `/staff/sales` for Sales.
- Marketing and Operations login/workspaces remain disabled.
- Existing `/admin` and `/staff/sales` remain inside the customer MainLayout because changing them is outside Phase 2.
- Full repository lint remains red because of the 11 pre-existing errors listed above.
- Live browser checks used the repository's local development/memory-resilient authentication path; production Mongo, payments, and Cloudinary were not exercised.
- The main production bundle remains oversized and should be addressed during later module extraction/lazy-loading phases.

## 21. Phase 2 PASS / FAIL Matrix

| Acceptance criterion | Result |
|---|---|
| Current main/upstream work preserved | PASS |
| ObjectId-hardening baseline preserved | PASS |
| `/staff` exists | PASS |
| `/staff` uses StaffShell | PASS |
| Customer Navbar/Footer excluded from StaffShell | PASS |
| Nested Outlet foundation exists | PASS |
| Admin can access `/staff` | PASS |
| Sales can access `/staff` | PASS |
| Sales cannot see Admin Control Center | PASS |
| `/admin` remains AdminDashboard | PASS |
| `/staff/sales` remains SalesPortal | PASS |
| `/admin/sales` redirect remains | PASS |
| Login redirect behavior unchanged | PASS |
| Marketing login not enabled | PASS |
| No Marketing workspace added | PASS |
| No Admin module migrated | PASS |
| No Sales business logic migrated | PASS |
| No backend behavior changed by Phase 2 | PASS |
| StaffShell business-data requests | PASS: 0 |
| No fake data or KPIs | PASS |
| Responsive behavior | PASS |
| Accessibility behavior | PASS |
| Production frontend build | PASS |
| No new lint errors | PASS |
| Browser console | PASS: no errors observed |
| Existing customer pages | PASS |

## 22. Recommended Phase 3 Objective

Extract exactly one shared Expert Requests workspace for Admin and Sales while preserving the backend-enforced shared callback queue, existing route compatibility, and current quotation/follow-up ownership rules. Do not combine this with broader Admin migration, Marketing enablement, or auth cleanup.

## Final Console Summary

```text
PHASE 2 STAFF FOUNDATION: PASS

Current HEAD:
- f6324d8 sales

Upstream synchronized:
YES

Files added:
- frontend/src/staff/StaffShell.jsx
- frontend/src/staff/StaffOverview.jsx
- frontend/src/staff/staffNavigation.js
- frontend/src/staff/staffAccess.js
- frontend/src/staff/staffAccess.test.js
- frontend/src/staff/components/StaffSidebar.jsx
- frontend/src/staff/components/StaffTopbar.jsx
- frontend/src/staff/components/StaffMobileNav.jsx
- frontend/src/staff/components/StaffWorkspaceCard.jsx
- STAFF_CONTROL_CENTER_PHASE_2_FOUNDATION_REPORT.md

Files modified:
- frontend/src/App.jsx
- frontend/package.json

/staff route:
PASS

Standalone StaffShell:
PASS

Customer Navbar/Footer excluded:
PASS

Admin /staff access:
PASS

Sales /staff access:
PASS

Sales Admin-navigation isolation:
PASS

Existing /admin:
PASS

Existing /staff/sales:
PASS

Existing /admin/sales redirect:
PASS

Business API requests from StaffShell:
0

Frontend build:
PASS

Lint:
- Phase 2 files: PASS, 0 errors and 0 warnings
- Full repository: FAIL, 11 pre-existing hook-order errors only

Staff foundation tests:
PASS, 5/5

Browser E2E:
PASS

Public website regression:
PASS

Backend changed by Phase 2:
NO

Recommended Phase 3:
- Extract one shared Expert Requests workspace only.
```
