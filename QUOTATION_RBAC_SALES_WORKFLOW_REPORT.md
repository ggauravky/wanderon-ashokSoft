# Phase 6: Quotation RBAC + Sales Workflow Report
**Super Admin × Operations × Sales × Marketing × Influencer Creator Security Matrix**

---

## 1. Executive Summary

Phase 6 completes the enterprise-grade role-based access control (**RBAC**) and sales workflow architecture, hardening the entire Quotation & CRM Lead management ecosystem across administrative roles:
1. **Super Admin**: Unrestricted system authority across all resources, unlimited custom discount discretion, platform settings, and user role management.
2. **Operations / Admin**: Operational fulfillment, draft trip package cataloging (`POST /convert-to-trip`), departure batches, bookings CRM, and approved quotation processing. Disallowed from deleting platform users or modifying core pricing markup rules.
3. **Sales Specialist**: Scoped lead handling, quotation builder, custom itinerary creation, proposal dispatch, and converting quotes to private booking orders. Strictly capped at 10% maximum sales discount without manager approval. Blocked from deleting quotations or converting quotes to public catalog packages (`POST /convert-to-trip` ➔ HTTP 403 Forbidden).
4. **Marketing Specialist**: Manages SEO meta tags, CMS pages, blog articles, and trip catalog previews. Strictly blocked from modifying quotation pricing or discounts (➔ HTTP 403), converting quotes (➔ HTTP 403), or viewing internal supplier costs and profit margins. Customer phone and email are automatically masked for privacy.
5. **Influencer Creator**: Partnership affiliate dashboard, coupon attribution, and payout requests remain 100% intact and untouched.

---

## 2. Granular Permissions & Route Enforcement Matrix

| Action / Route | Super Admin | Operations | Sales Specialist | Marketing | Influencer |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `POST /api/quotations` (Create Quote) | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `PATCH /api/quotations/:id` (Edit Quote) | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `DELETE /api/quotations/:id` (Delete Quote) | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `POST /api/quotations/:id/send` (Send Quote) | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `POST /api/quotations/:id/convert-to-trip` | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `POST /api/quotations/:id/create-booking` | ✅ ALLOW | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `PUT /api/leads/:id/assign` (Assign Lead) | ✅ ALLOW | ✅ ALLOW | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN | ❌ 403 FORBIDDEN |
| `GET /api/quotations` (Internal Costs) | ✅ VISIBLE | ✅ VISIBLE | ✅ VISIBLE | 🔒 STRIPPED | ❌ 403 FORBIDDEN |
| `GET /api/leads` (Customer Phone/Email) | ✅ VISIBLE | ✅ VISIBLE | ✅ VISIBLE | 🔒 MASKED | ❌ 403 FORBIDDEN |
| Max Commercial Discount Allowed | ♾️ Unrestricted | ♾️ Unrestricted | 10% Max (Escalation) | 0% | N/A |

---

## 3. Key Architectural Features

### A. Server-Side RBAC Enforcement
- Reusable `requireRoles(...roles)` middleware dynamically validates token credentials against database and memory sessions.
- Role-specific middlewares: `superAdminOnly`, `adminOnly`, `operationsOrAdmin`, `salesOrAdmin`, `marketingOrAdmin`, and `influencerOnly`.

### B. Sales Workspace & Pipeline Scoping
- Quotations and CRM Leads automatically scope for `sales` users:
  - `Quotation.find({ $or: [{ assignedTo: req.user._id }, { createdBy: req.user._id }, { assignedTo: null }] })`
  - Leads query returns assigned leads or the open unassigned pool.

### C. Field-Level Security & Privacy Masking
- **Marketing Quotation Masking**: Automatically strips `totalInternalCost`, `projectedMargin`, `projectedMarginPercent`, `costPerNight`, `unitCost`, and `auditTrail`.
- **Marketing Lead Masking**: Masks customer phone numbers (`+91 98******10`) and email addresses (`ro***@example.com`).

### D. Lead Assignment Engine
- Super Admin and Admin can assign leads to specific sales concierge specialists via `PUT /api/leads/:id/assign` with 1-click modal actions in the Admin CRM UI.

---

## 4. Verification Scoreboard

| Test Suite | Purpose | Result |
| :--- | :--- | :---: |
| **Phase 6 RBAC & Sales Matrix** | Super Admin, Operations, Sales, Marketing, Lead Assignment, Influencer | **32 / 32 PASSED** ✅ |
| **Phase 5 Conversion Engine Suite** | Path A, Path B, Idempotency, Status Guards, Analytics | **33 / 33 PASSED** ✅ |
| **Phase 4 Customer View Suite** | Preview, Sanitization, Option Switch, Approval, Expiry | **36 / 36 PASSED** ✅ |
| **Phase 3 Pricing Engine Suite** | Multi-Segment Hotels, Concessions, GST, Snapshots | **41 / 41 PASSED** ✅ |
| **Phase 2 Admin Wizard Suite** | Lead Prefill, Multi-Tier, Sanitization, Booking Conversion | **35 / 35 PASSED** ✅ |
| **Phase 1 Architecture Suite** | Mongoose Models, State Transitions, Number Sequencing | **45 / 45 PASSED** ✅ |
| **HTTP API Endpoint Suite** | REST Controllers, Public Share, Calculation Previews | **28 / 28 PASSED** ✅ |
| **Frontend Production Build** | Full production bundle compilation with Vite | **Built in 3.05s (0 errors)** ✅ |

---

## 5. Modified Files Reference

- [`backend/middlewares/authMiddleware.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/middlewares/authMiddleware.js): Added `requireRoles`, `superAdminOnly`, `marketingOrAdmin`, updated `influencerOnly`.
- [`backend/routes/quotationRoutes.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/routes/quotationRoutes.js): Applied explicit RBAC guards across all quotation routes.
- [`backend/routes/leadRoutes.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/routes/leadRoutes.js): Added `PUT /:id/assign` route and role-scoped read/write permissions.
- [`backend/controllers/quotationController.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/controllers/quotationController.js): Implemented sales scoping and marketing field-masking in `getQuotations` and `getQuotationById`.
- [`backend/controllers/leadController.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/controllers/leadController.js): Implemented `assignLead`, sales lead scoping, and marketing privacy masking.
- [`frontend/src/services/api.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/services/api.js): Exported `assignLeadApi`.
- [`frontend/src/pages/AdminDashboard.jsx`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/pages/AdminDashboard.jsx): Implemented role-adaptive navigation, sales workspace filtering, and lead assignment action.
- [`backend/scripts/testQuotationRbacPhase6.js`](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/scripts/testQuotationRbacPhase6.js): Automated test suite for Phase 6.
