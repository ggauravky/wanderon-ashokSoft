# WanderLuxe — Shared Sales Queue Architecture & Route Migration Report

**Date**: September 15, 2026  
**Status**: COMPLETED & VERIFIED (47/47 Automated Tests Passed • 100% E2E Verified)  
**Repository**: [https://github.com/ggauravky/wanderon-ashokSoft](https://github.com/ggauravky/wanderon-ashokSoft)

---

## Executive Summary

The WanderLuxe Sales Workspace has completed an architectural migration from a siloed, individual-assignment CRM model (`/admin/sales`) to a unified **Shared Sales Queue** at the canonical URL **`/staff/sales`**.

Under the previous model, Travel Expert Requests (`callback_request`) were locked down by individual specialists through a "claim" or administrative assignment mechanism. This introduced operational bottlenecks: high-priority traveler callback requests were hidden behind individual queues, unassigned leads required manual dispatch, and specialists lacked shared visibility into team interactions.

The new architecture establishes:
1. **Canonical Route Migration**: The sales workspace is now hosted at `/staff/sales`. Legacy references, bookmarks, and requests to `/admin/sales` seamlessly forward via an instant backwards-compatible HTTP `<Navigate to="/staff/sales" replace />` redirect.
2. **Shared Sales Queue for Expert Requests**: All Sales Specialists (`ashokSoftSales1@gmail.com`, `ashokSoftSales2@gmail.com`) and Administrators operate from a single, shared pool of Travel Expert Requests.
3. **Removal of Assignment & Claiming**: The concept of individual lead ownership has been decommissioned for `callback_request` leads. Attempting to claim or assign a callback request is explicitly rejected with `400 Bad Request`.
4. **Action Attribution over Ownership**: All team actions (call outcomes, contact channels, timestamps, notes, and scheduled follow-ups) are attributed directly to the active specialist (`loggedBy`, `loggedByName`, `loggedAt`) within `Lead.callOutcomes`, providing an audit trail without gating lead access.
5. **Preservation of General CRM (Option B)**: General CRM leads (`leadType = 'general'`, `'trip_enquiry'`, etc.) managed in the Bookings & CRM tab continue to support administrative assignment without regression.

---

## 1. Route Migration & Redirection Architecture

### 1.1 Route Mapping Table

| URL Route | Role Permissions | Behavior / Redirection | Status |
| :--- | :--- | :--- | :--- |
| **`/staff/sales`** | `sales`, `admin`, `super_admin` | **Canonical Sales Desk Workspace**. Displays shared queue KPIs, inquiry table with Last Activity attribution, detail drawer, direct dialer/WhatsApp, and stage controls. | **Canonical** |
| **`/admin/sales`** | `All` | **Replace Redirect**. Executes `<Navigate to="/staff/sales" replace />`. URL immediately changes to `/staff/sales` in history without back-button traps. | **Redirect** |
| **`/admin/login`** | `Public / Staff` | Pre-authenticated or newly authenticated `sales` users are dynamically routed to `/staff/sales`. `admin` users route to `/admin`. | **Gateway** |
| **`/admin`** | `admin`, `super_admin` | Master Admin Control Center. Any attempt by a `sales` role to access `/admin` is intercepted by `RoleProtectedRoute` and rebounded to `/staff/sales`. | **Protected** |

### 1.2 Code Modifications for Routing

1. **`frontend/src/App.jsx`**:
   ```jsx
   {/* Canonical Dedicated Sales Portal Workspace */}
   <Route 
     path="staff/sales" 
     element={
       <RoleProtectedRoute allowedRoles={['admin', 'super_admin', 'sales']}>
         <SalesPortal />
       </RoleProtectedRoute>
     } 
   />

   {/* Backwards-Compatible Redirect: /admin/sales -> /staff/sales */}
   <Route 
     path="admin/sales" 
     element={<Navigate to="/staff/sales" replace />} 
   />
   ```

2. **`frontend/src/contexts/AuthContext.jsx`**:
   ```javascript
   // In staffLogin:
   return {
     success: true,
     user: staffUser,
     role: staffUser.role,
     destination: staffUser.role === 'sales' ? '/staff/sales' : '/admin'
   };
   ```

3. **`frontend/src/pages/AdminLogin.jsx`**:
   ```javascript
   // Pre-authenticated session check:
   if (['admin', 'super_admin'].includes(currentUserRole)) {
     navigate('/admin', { replace: true });
   } else if (currentUserRole === 'sales') {
     navigate('/staff/sales', { replace: true });
   }

   // On login form submission:
   const destination = result.destination || (result.role === 'sales' ? '/staff/sales' : '/admin');
   navigate(destination, { replace: true });
   ```

4. **`frontend/src/components/RoleProtectedRoute.jsx`**:
   ```javascript
   if (normalizedRole === 'sales') {
     return <Navigate to="/staff/sales" replace />;
   }
   ```

5. **`frontend/src/components/AdminExpertRequests.jsx`**:
   ```jsx
   <Link to="/staff/sales" title="Open Dedicated Sales Portal Desk">
     <Headphones size={15} />
     <span>Open Sales Desk</span>
   </Link>
   ```

---

## 2. Shared Sales Queue Architecture

### 2.1 Problem & Resolution

* **Previous Issue**: Leads had `assignedToUser` and `assignedTo`. If Sales Specialist 1 claimed a lead, Sales Specialist 2 could not see it or log interaction notes. Unclaimed leads sat in an "unassigned pool" waiting for someone to manually claim them.
* **Architectural Fix**:
  - `GET /api/leads`: When requested by `sales` role, the server strictly filters `leadType = 'callback_request'` and omits any `assignedToUser` restriction. All callback requests are returned uniformly.
  - Legacy leads with existing `assignedTo` or `assignedToUser` data are returned equally to all specialists (no data deletion or migration required).
  - All Sales Specialists (`AshokSoft Sales 1`, `AshokSoft Sales 2`) see the exact same collection of leads with synchronized metrics.

### 2.2 Rejection of Claiming & Assignment on Expert Requests

To prevent accidental re-introduction of ownership locks, the backend endpoints `claimLead` and `assignLead` explicitly check `lead.leadType === 'callback_request'`:

```javascript
// backend/controllers/leadController.js: claimLead
if (lead.leadType === 'callback_request') {
  return res.status(400).json({
    success: false,
    message: 'Expert Requests use the shared Sales queue and cannot be claimed.'
  });
}

// backend/controllers/leadController.js: assignLead
if (lead.leadType === 'callback_request') {
  return res.status(400).json({
    success: false,
    message: 'Expert Requests use the shared Sales queue and cannot be assigned.'
  });
}
```

---

## 3. Action Attribution Mechanism

Rather than relying on document ownership, WanderLuxe implements **Action Attribution**:

1. **Actor Recording in `callOutcomes`**:
   When any specialist logs a call or communication outcome (`POST /api/leads/:id/log-contact`):
   ```javascript
   lead.callOutcomes.push({
     outcome,
     channel: channel || 'call',
     notes: notes || '',
     loggedAt: new Date(),
     loggedBy: userId,
     loggedByName: userName
   });
   ```
2. **Real-time Attribution Display**:
   - **Table Column ("Last Activity")**: Replaces the old "Sales Owner" column. Displays:
     `CONNECTED by AshokSoft Sales 1 (19h ago)` or `No contact yet`.
   - **Drawer ("Interaction History & Action Attribution")**: Displays every logged attempt with outcome tag, channel, notes, timestamp, and author name (`Logged by: AshokSoft Sales 1`).
   - **Lead Status Transition**: Any specialist can update lead stage (`NEW` $\rightarrow$ `CONTACTED` $\rightarrow$ `IN_PROGRESS` $\rightarrow$ `QUALIFIED` $\rightarrow$ `LOST` / `CONVERTED`) without needing ownership rights.

---

## 4. Sales Portal & Admin View Visual Polish

### 4.1 `/staff/sales` (Sales Desk)
- **Header**: "WanderLuxe Sales Desk" with `SHARED SALES QUEUE` badge and subtext `"Welcome back, [Specialist Name] • Open team collaboration"`.
- **5 Shared KPI Metric Cards**:
  1. `Total Requests`: Full count of all callback requests in shared queue.
  2. `New Inquiries`: Requests in `NEW` stage awaiting first contact.
  3. `Due Today`: Requests with scheduled callback window matching today's date.
  4. `In Progress`: Requests with active discussions (`CONTACTED`, `IN_PROGRESS`).
  5. `Qualified Leads`: High-intent travelers qualified for custom quotation builder.
- **Filter Chips**: All Requests, New, Due Today, Overdue / Follow-ups, In Progress, Qualified.
- **Table**: Columns: `REQUEST`, `TRAVELER`, `TRIP / DESTINATION`, `CALLBACK SCHEDULE`, `STATUS`, `PRIORITY`, `LAST ACTIVITY`, `ACTIONS`.
- **No Claim Buttons**: All rows provide direct `Call`, `WhatsApp`, and `View` actions.

### 4.2 `/admin` (Expert Requests Tab)
- **5 Operational Metric Cards**: Total Requests, New Inquiries, Due Today, In Progress, Qualified. Removed the legacy "Unassigned Pool" card.
- **Header Action**: `[ Open Sales Desk ]` navigating to `/staff/sales`.
- **Table & Drawer**: Replaced "Sales Owner" with "Last Activity"; replaced "Sales Specialist Ownership" drawer section with "Shared Queue & Action Attribution"; purged dead `showAssignModal` assignment modal code.

---

## 5. Automated Verification Results

A dedicated test suite was written in `backend/test_shared_expert_requests_sales_queue.js` and executed against the live MongoDB Atlas database and Express server.

### Test Results Summary: **47 PASSED, 0 FAILED (100% Pass Rate)**

| # | Test Assertion | Result |
| :---: | :--- | :---: |
| 1 | Sales Specialist 1 account exists in DB | **PASS** |
| 2 | Sales Specialist 2 account exists in DB | **PASS** |
| 3 | Admin user account exists in DB | **PASS** |
| 4 | Sales 1 login returns 200 OK | **PASS** |
| 5 | Sales 1 returned role is strictly "sales" | **PASS** |
| 6 | Sales 1 client destination route maps to `/staff/sales` | **PASS** |
| 7 | Sales 1 receives valid JWT token | **PASS** |
| 8 | Sales 2 login returns 200 OK | **PASS** |
| 9 | Sales 2 returned role is strictly "sales" | **PASS** |
| 10 | Sales 2 client destination route maps to `/staff/sales` | **PASS** |
| 11 | Sales 2 receives valid JWT token | **PASS** |
| 12 | Admin login returns 200 OK | **PASS** |
| 13 | Admin returned role is admin/super_admin | **PASS** |
| 14 | Admin client destination route maps to `/admin` | **PASS** |
| 15 | Fixture callback lead 1 created (unassigned) | **PASS** |
| 16 | Fixture callback lead 2 created (legacy assigned to Sales 2) | **PASS** |
| 17 | Fixture non-callback lead 3 created (`trip_enquiry`) | **PASS** |
| 18 | Sales 1 queue query returns 200 OK | **PASS** |
| 19 | Sales 1 sees unassigned callback request (Lead 1) | **PASS** |
| 20 | Sales 1 sees legacy assigned callback request (Lead 2, assigned to Sales 2) | **PASS** |
| 21 | Sales 2 queue query returns 200 OK | **PASS** |
| 22 | Sales 2 sees unassigned callback request (Lead 1) | **PASS** |
| 23 | Sales 2 sees callback request (Lead 2) | **PASS** |
| 24 | Shared queue count parity across Sales 1 and Sales 2 (11 vs 11) | **PASS** |
| 25 | Sales role CANNOT see non-callback leads (server forces `callback_request`) | **PASS** |
| 26 | All returned leads for sales role are strictly `leadType === "callback_request"` | **PASS** |
| 27 | Sales role blocked with 403 Forbidden from accessing non-callback lead dossier | **PASS** |
| 28 | Sales 1 successfully logged contact on shared Lead 1 | **PASS** |
| 29 | Lead 1 status automatically transitioned to `CONTACTED` | **PASS** |
| 30 | Latest outcome recorded as `CONNECTED` | **PASS** |
| 31 | Action attribution `loggedByName` matches `"AshokSoft Sales 1"` | **PASS** |
| 32 | Action attribution `loggedBy` matches Sales 1 user ID | **PASS** |
| 33 | Sales 2 successfully retrieved Lead 1 dossier | **PASS** |
| 34 | Sales 2 sees Sales 1 attribution in interaction history | **PASS** |
| 35 | Sales 2 successfully updated Lead 1 status to `QUALIFIED` without ownership barrier | **PASS** |
| 36 | Lead 1 stage confirmed as `QUALIFIED` | **PASS** |
| 37 | Direct claim on `callback_request` returns 400 Bad Request | **PASS** |
| 38 | Claim rejection message explains shared queue architecture | **PASS** |
| 39 | Direct assign on `callback_request` returns 400 Bad Request | **PASS** |
| 40 | Assign rejection message explains shared queue architecture | **PASS** |
| 41 | General non-callback lead can still be assigned by Admin (Option B backwards compat) | **PASS** |
| 42 | General lead `assignedToUser` correctly updated | **PASS** |
| 43 | Sales 1 dashboard query returns 200 OK | **PASS** |
| 44 | Sales 2 dashboard query returns 200 OK | **PASS** |
| 45 | Total expert requests metric is identical for Sales 1 & Sales 2 | **PASS** |
| 46 | New inquiries metric is identical for Sales 1 & Sales 2 | **PASS** |
| 47 | Due today metric is identical for Sales 1 & Sales 2 | **PASS** |

---

## 6. End-to-End Browser & DevTools Verification

| Flow Tested | Method | Observed Result | Verdict |
| :--- | :--- | :--- | :---: |
| **Legacy URL Redirect** | Navigated to `http://localhost:5173/admin/sales` in browser | Replaced with `http://localhost:5173/staff/sales` instantly without page flicker or error. | **PASS** |
| **Sales 1 Staff Login** | Submitted `ashokSoftSales1@gmail.com` / `AshokSoftSales1@123` at `/admin/login` | Logged in with role `sales`, redirected to `/staff/sales`. Header shows "WanderLuxe Sales Desk • Shared Sales Queue". | **PASS** |
| **Sales 1 Queue Inspection** | Inspected lead table and metrics on `/staff/sales` | All 9 shared leads visible. Metrics: 9 Total, 0 New, 0 Due Today, 2 In Progress, 6 Qualified. | **PASS** |
| **Action Attribution Audit** | Inspected table rows on `/staff/sales` | "Last Activity" column displays `CONNECTED by AshokSoft Sales 1 (19h ago)`. No Claim buttons. | **PASS** |
| **Dossier Drawer View** | Clicked "View" on lead | Drawer opened showing direct dialer bar, traveler dossier, Shared Sales Queue badge, Log Outcome, and full action history. | **PASS** |
| **Admin Route Rebound** | Navigated to `http://localhost:5173/admin` as Sales 1 | Intercepted by `RoleProtectedRoute` and rebounded back to `/staff/sales`. | **PASS** |
| **Admin Expert Requests Tab** | Logged in as Admin, visited `/admin` $\rightarrow$ Expert Requests | Clean 5-card metric bar, `[ Open Sales Desk ]` link to `/staff/sales`, Last Activity attribution table. Zero assignment modals. | **PASS** |

---

## 7. Conclusion

The WanderLuxe Sales Workspace has successfully transitioned to the **Shared Sales Queue Architecture** with canonical route **`/staff/sales`**. Lead claiming bottlenecks have been eliminated in favor of complete team transparency and per-action attribution, while retaining full backwards compatibility for legacy links and general CRM leads.
