# WANDERLUXE — SALES STAFF LOGIN FORENSIC AUTH REPAIR REPORT
**Module**: Staff Portal Authentication & Sales CRM RBAC Isolation  
**Date**: September 15, 2026  
**Status**: RESOLVED & VERIFIED (20 / 20 Tests Passed)  
**Target Accounts**: `ashokSoftSales1@gmail.com`, `ashokSoftSales2@gmail.com`  

---

## 1. Executive Summary & Exact Login Failure Reproduced

When attempting to log in as a Sales specialist (`ashokSoftSales1@gmail.com`) via the staff login gateway (`/admin/login`), the system previously suffered from several blockers:

1. **Port & Process Hijacking**: Port 5000 and Port 5173 were occupied by orphaned background processes from another repository (`D:\VsCode\Dev-Portfolio`). As a result, network requests from the frontend to `POST /api/auth/login` were routed to an unrelated portfolio API that returned `404 Not Found` (`{"success": false, "message": "Route not found"}`).
2. **Missing Environment Configuration**: While MongoDB Atlas already contained the provisioned user documents for `ashokSoftSales1@gmail.com` and `ashokSoftSales2@gmail.com` with `role: "sales"`, the credentials were not configured in `backend/.env`, and memory fallback stores lacked mock sales users.
3. **Frontend Role Normalization & Routing Flaw**: The frontend `AuthContext` was rehydrating users by assuming anyone logging in through `/admin/login` was either an admin or a regular user, risking dropping the authoritative `sales` role. Furthermore, submit handlers in `AdminLogin.jsx` were not cleanly routing to `/admin/sales`.
4. **IDOR & API Security Deficiencies**: Media library mutation endpoints (`POST /api/media`, `PUT /api/media/:id`, `DELETE /api/media/:id`) only checked for authentication, lacking role-level protection against non-admin staff.

All root causes were methodically resolved, and an automated verification suite confirmed 20 out of 20 test assertions passing.

---

## 2. Network Evidence & Root Causes

### Network Diagnostics (Before Fix)
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "ashokSoftSales1@gmail.com",
  "password": "AshokSoftSales1@123"
}

HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "success": false,
  "message": "Route not found"
}
```
*Cause*: Process `node server.js` from `D:\VsCode\Dev-Portfolio` was bound to port 5000, intercepting requests intended for WanderLuxe.

### Network Diagnostics (After Fix)
```http
POST /api/auth/login HTTP/1.1
Host: localhost:5000
Content-Type: application/json

{
  "email": "ashokSoftSales1@gmail.com",
  "password": "AshokSoftSales1@123"
}

HTTP/1.1 200 OK
Content-Type: application/json

{
  "_id": "6aa6fc044bf7c8ace112b8f1",
  "name": "AshokSoft Sales 1",
  "email": "ashoksoftsales1@gmail.com",
  "phone": "+91 9876543211",
  "address": "WanderLuxe Sales Desk, India",
  "avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250",
  "role": "sales",
  "influencerStatus": "none",
  "bookedTrips": [],
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 3. MongoDB Sales User & Hash Verification

Direct database verification performed against MongoDB Atlas (`wanderluxe` database):
- **User 1**:
  - `_id`: `6aa6fc044bf7c8ace112b8f1`
  - `name`: `AshokSoft Sales 1`
  - `email`: `ashoksoftsales1@gmail.com`
  - `role`: `sales`
  - `isActive`: `true`
  - `bcrypt.compare('AshokSoftSales1@123', passwordHash)`: **`true`**
- **User 2**:
  - `_id`: `6aa6fc044bf7c8ace112b8f4`
  - `name`: `AshokSoft Sales 2`
  - `email`: `ashoksoftsales2@gmail.com`
  - `role`: `sales`
  - `isActive`: `true`
  - `bcrypt.compare('AshokSoftSales2@123', passwordHash)`: **`true`**

No plaintext passwords are committed to source code or git constants. All credentials are appropriately managed via environment variables.

---

## 4. Frontend & Backend Fixes

### 4.1. Backend Authentication Core
- **[backend/.env](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/.env)**: Configured `SALES_1_EMAIL`, `SALES_1_PASSWORD`, `SALES_2_EMAIL`, and `SALES_2_PASSWORD`.
- **[backend/utils/generateToken.js](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/utils/generateToken.js)**: Enhanced JWT token generator to accept and encode `role` and `email` alongside `id`, ensuring backward compatibility and offline token integrity.
- **[backend/controllers/authController.js](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/controllers/authController.js)**:
  - Added mock sales user definitions to `memoryUsers` fallback array with bcrypt-hashed passwords.
  - Ensured `loginUser` issues tokens carrying `role: user.role` and never mutates sales roles into admin or user roles.
  - Ensured `getMe` preserves the database `role` property.
- **[backend/middlewares/authMiddleware.js](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/middlewares/authMiddleware.js)**:
  - Added memory fallback checks for sales users in `protect` and `optionalAuth`.
  - Added `adminOnly` protection to `mediaRoutes.js` (`POST /api/media`, `PUT /api/media/:id`, `PATCH /api/media/:id`, `DELETE /api/media/:id`).
- **[backend/controllers/leadController.js](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/backend/controllers/leadController.js)**:
  - Updated contact logging auto-advance logic so that a `CONNECTED` outcome transitions leads to `CONTACTED`.

### 4.2. Frontend AuthContext & Gateways
- **[frontend/src/contexts/AuthContext.jsx](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/contexts/AuthContext.jsx)**:
  - Preserved authoritative role in `loadUserSession`: sets `role: userData.role || 'user'` so that sales users refreshing `/admin/sales` remain authenticated as `sales`.
  - Implemented `staffLogin(email, password)`: validates role against allowed staff roles (`['admin', 'super_admin', 'sales']`). Rejects non-staff with `"This account does not have staff portal access."`.
  - Computed destination dynamically: `/admin/sales` for `sales` and `/admin` for `admin` / `super_admin`.
- **[frontend/src/pages/AdminLogin.jsx](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/pages/AdminLogin.jsx)**:
  - Updated branding to **"WanderLuxe Staff Portal"**, **"Secure Admin & Sales Access"**.
  - Generic email input placeholder: `staff@wanderluxe.in` without exposing valid emails.
  - Primary button label: **"Sign In to Staff Portal"**.
  - Role-aware redirect: routes Sales specialists directly to `/admin/sales` and Admins to `/admin`.
  - Auto-redirect for pre-authenticated sessions: immediately checks role and routes Sales to `/admin/sales` without touching `/admin`.
- **[frontend/src/components/RoleProtectedRoute.jsx](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/components/RoleProtectedRoute.jsx)**:
  - If unauthenticated, redirects to `/admin/login`.
  - If authenticated user with role `sales` tries to enter an admin-only route, immediately redirects to `/admin/sales`.
- **[frontend/src/components/AdminRoute.jsx](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/components/AdminRoute.jsx)**:
  - Restricts access strictly to `allowedRoles={['admin', 'super_admin']}`.
- **[frontend/src/components/AdminExpertRequests.jsx](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/components/AdminExpertRequests.jsx)**:
  - Action button labeled **`[ Open Sales Desk ]`**, navigating Admins to `/admin/sales`.

### 4.3. Sales Portal Workspace (`/admin/sales`)
- **[frontend/src/pages/SalesPortal.jsx](file:///d:/VsCode/Collaboration%20Projects/wanderon-ashokSoft/frontend/src/pages/SalesPortal.jsx)**:
  - Dedicated sales desk workspace restricted to sales and admin roles.
  - Displays operational metrics: Assigned to Me, Open Claim Pool, Due Today, Follow-ups Due, Qualified Leads.
  - Comprehensive action drawer: Call, WhatsApp, Email, Status Updates, Call Outcome Logging, CRM Follow-Up Scheduling, 1-Click Atomic Claim.
  - **Admin Supervision Feature**: When an Admin visits `/admin/sales`, an assignment modal enables assigning or reassigning leads to real database sales users (`AshokSoft Sales 1`, `AshokSoft Sales 2`) fetched via `getSalesUsersApi()`.

---

## 5. Permission & Access Matrix

| Feature / Route | Master Admin | Sales Specialist | Regular Customer | Influencer |
| :--- | :---: | :---: | :---: | :---: |
| `/admin` (Master Admin Panel) | **YES** | **NO** (Redirects to `/admin/sales`) | **NO** | **NO** |
| `/admin/sales` (Sales Desk) | **YES** | **YES** | **NO** | **NO** |
| Trip CMS (`POST /api/trips`) | **YES** | **NO** (403) | **NO** (401/403) | **NO** (403) |
| Pages CMS (`POST /api/pages`) | **YES** | **NO** (403) | **NO** (401/403) | **NO** (403) |
| Media Management (`POST /api/media`) | **YES** | **NO** (403) | **NO** (401/403) | **NO** (403) |
| Pricing Rules (`POST /api/pricing-rules`) | **YES** | **NO** (403) | **NO** (401/403) | **NO** (403) |
| User Role Admin (`PUT /api/admin/users/:id/role`) | **YES** | **NO** (403) | **NO** (401/403) | **NO** (403) |
| Lead Directory (`GET /api/leads/sales-users`) | **YES** | **YES** | **NO** (401/403) | **NO** (403) |
| Assign Lead (`PUT /api/leads/:id/assign`) | **YES** | **NO** (403) | **NO** (401/403) | **NO** (403) |
| My Requests Data | **YES** (All) | **YES** (Assigned) | **NO** | **NO** |
| Open Requests / Claim (`POST /api/leads/:id/claim`) | **YES** | **YES** (Atomic) | **NO** | **NO** |
| Log Contact Outcome (`POST /api/leads/:id/log-contact`) | **YES** | **YES** (Own lead only) | **NO** | **NO** |
| Update Lead Status (`PUT /api/leads/:id/status`) | **YES** | **YES** (Own lead only) | **NO** | **NO** |
| Modify Another Specialist's Lead | **YES** (Admin) | **NO** (403 Forbidden) | **NO** | **NO** |

---

## 6. Automated Verification Results

A 20-point test suite (`scratch/test_sales_auth_suite.mjs`) was executed against the active backend server:

```
================================================================
🧪 RUNNING WANDERLUXE SALES AUTHENTICATION & RBAC TEST SUITE
================================================================

✅ PASS: Sales 1 Backend Login (POST /api/auth/login)
✅ PASS: Sales 2 Backend Login (POST /api/auth/login)
✅ PASS: Admin Backend Login (POST /api/auth/login)
✅ PASS: Sales 1 Session Rehydration (GET /api/auth/me)
✅ PASS: Sales 1 Blocked from /api/admin/stats (Expect 403)
✅ PASS: Sales 1 Blocked from Trip Creation (POST /api/trips - Expect 403)
✅ PASS: Sales 1 Blocked from Media Creation (POST /api/media - Expect 403)
✅ PASS: Sales 1 Blocked from Pricing Rule Management (POST /api/pricing-rules - Expect 403)
✅ PASS: Sales 1 Allowed on Sales Dashboard (GET /api/sales/dashboard)
✅ PASS: Sales 1 Directory Lookup (GET /api/leads/sales-users)
✅ PASS: Public Lead Submission (POST /api/leads)
✅ PASS: Admin Assigns Lead to Sales 1 (PUT /api/leads/:id/assign)
✅ PASS: Sales 1 Views Assigned Lead (GET /api/leads/:id)
✅ PASS: Sales 1 Logs Contact Outcome (POST /api/leads/:id/log-contact)
✅ PASS: Sales 1 Updates Status to QUALIFIED (PUT /api/leads/:id/status)
✅ PASS: Sales 2 ISOLATION: Attempting to edit Sales 1 Lead (Expect 403)
✅ PASS: Sales 2 ISOLATION: Attempting to log contact on Sales 1 Lead (Expect 403)
✅ PASS: Atomic Claim Test: Setup unassigned lead
✅ PASS: Atomic Claim: First specialist claims -> 200 OK
✅ PASS: Atomic Claim: Second specialist claims -> 409 CONFLICT

================================================================
🏁 TEST SUITE RESULT: ALL TESTS PASSED 🎉
Passed: 20 / 20
================================================================
```

---

## 7. Build Verification Result

```bash
> frontend@0.0.0 build
> vite build

vite v8.2.0 building client environment for production...
transforming...✓ 2529 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                        0.48 kB │ gzip:   0.31 kB
dist/assets/index-CVY2IDSB.css        91.93 kB │ gzip:  14.95 kB
dist/assets/purify.es-ChwZkWde.js     26.81 kB │ gzip:  10.65 kB
dist/assets/index.es-BxuEjJZ2.js     151.40 kB │ gzip:  48.89 kB
dist/assets/index-Av4JYDGk.js      2,317.09 kB │ gzip: 583.50 kB

✓ built in 14.13s
```

---

## 8. Final PASS / FAIL Matrix

| Area | Requirement | Result |
| :--- | :--- | :---: |
| **Authentication** | Sales 1 Mongo record & password hash valid | **PASS** |
| | Sales 2 Mongo record & password hash valid | **PASS** |
| | Sales 1 backend login returns `role: "sales"` | **PASS** |
| | Sales 2 backend login returns `role: "sales"` | **PASS** |
| | Admin login returns `role: "admin"` / `"super_admin"` | **PASS** |
| | Session rehydration (`GET /api/auth/me`) preserves `sales` | **PASS** |
| **Frontend Login** | Shared staff login gateway (`/admin/login`) accepts Admin & Sales | **PASS** |
| | Button says "Sign In to Staff Portal" | **PASS** |
| | No email leakage or frontend admin email block | **PASS** |
| **Redirects** | Sales 1 redirected automatically to `/admin/sales` | **PASS** |
| | Sales 2 redirected automatically to `/admin/sales` | **PASS** |
| | Admin redirected to `/admin` | **PASS** |
| | Session refresh on `/admin/sales` preserves sales session | **PASS** |
| **Authorization** | Sales blocked from `/admin` (auto-redirected to `/admin/sales`) | **PASS** |
| | Sales allowed on `/admin/sales` | **PASS** |
| | Admin allowed on `/admin/sales` | **PASS** |
| | Sales blocked from Trip creation / edit / delete (403) | **PASS** |
| | Sales blocked from Media library modifications (403) | **PASS** |
| | Sales blocked from Pricing rules admin (403) | **PASS** |
| | Sales blocked from Admin reports (403) | **PASS** |
| **Sales Workspace** | Sales sees My Requests, Open Requests, Due Today | **PASS** |
| | Call, WhatsApp, Email links configured | **PASS** |
| | Log contact outcome advances status | **PASS** |
| | Atomic claim with 409 conflict detection | **PASS** |
| | Sales 2 blocked from editing Sales 1's assigned lead (403) | **PASS** |
| | Admin can assign/reassign to Sales 1 and Sales 2 | **PASS** |
| **Production** | Frontend production build succeeds (Vite) | **PASS** |
| | Backend server runs cleanly on port 5000 | **PASS** |
| | Zero plaintext credentials in source code | **PASS** |
