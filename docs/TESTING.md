# WanderLuxe — Testing & Diagnostics Guide

This document is the authoritative engineering guide for running tests, static analysis, and diagnostic suites across the WanderLuxe platform.

---

## Table of Contents

1. [Testing Philosophy & Test Classification](#testing-philosophy--test-classification)
2. [Command Inventory Matrix](#command-inventory-matrix)
3. [Frontend Tests & Static Analysis](#frontend-tests--static-analysis)
4. [Backend Unit & Integration Tests](#backend-unit--integration-tests)
5. [Payment & Diagnostics Safety](#payment--diagnostics-safety)
6. [Database Migrations & Maintenance](#database-migrations--maintenance)
7. [Data Integrity & Schema Validation](#data-integrity--schema-validation)
8. [Continuous Integration (CI) Pre-Flight Checklist](#continuous-integration-ci-pre-flight-checklist)

---

## Testing Philosophy & Test Classification

WanderLuxe test scripts are categorized into five distinct tiers based on side effects, network access, and safety:

| Tier | Category | Description | Safe for Routine Local Dev? |
| :---: | :--- | :--- | :---: |
| **A** | **Offline / Unit Test** | In-memory verification, pure logic, mock data. Zero DB or external network calls. | **YES** (Always run before PR) |
| **B** | **Static Analysis / Build** | Oxlint linting, Vite bundle compilation, data integrity checks. | **YES** (Always run before PR) |
| **C** | **External Service Test** | Connects to external sandbox APIs (e.g. Razorpay test mode). Requires credentials. | **YES** (Sandbox only) |
| **D** | **Diagnostic / Read-Only** | Queries live database for inspection. Zero data mutation. | **YES** (Safe on any DB) |
| **E** | **Data Mutating / Migration** | Creates users, applies additive schema versioning, or modifies records. | ⚠️ **CAUTION** (Review before running) |

---

## Command Inventory Matrix

| Working Directory | Command | Category | Purpose | Mutates Data? | Requires DB? |
| :--- | :--- | :---: | :--- | :---: | :---: |
| `frontend/` | `npm run lint` | **B** | Run Oxlint linter across frontend JavaScript/JSX | No | No |
| `frontend/` | `npm run build` | **B** | Compile production Vite bundle to `dist/` | No | No |
| `frontend/` | `npm run test:staff-foundation` | **A** | Verify RBAC navigation rules and staff module guards | No | No |
| `frontend/` | `npm run preview` | **B** | Serve compiled production build locally | No | No |
| `backend/` | `npm run test:quotation-v2` | **A** | Unit test Quotation V2 engine, hashing, and DTOs | No | No |
| `backend/` | `npm run test:ai-planner-sales-phase1` | **A** | Verify itinerary persistence contracts, guest tokens, Sales queue isolation, and dossier sanitization | No | No |
| `backend/` | `npm run test:payment-reliability` | **A** | Verify Razorpay HMAC SHA-256 signatures & math | No | No |
| `backend/` | `npm run test:razorpay` | **C** | Test Razorpay test credentials & API connectivity | No | Optional |
| `backend/` | `npm run payment:inspect -- <id>` | **D** | Inspect booking payment state, receipts, and balances | No | **Yes** |
| `backend/` | `npm run staff:create` | **E** | Provision a new staff user from environment variables | **YES** | **Yes** |
| `backend/` | `npm run quotations:v2:migrate` | **E** | Idempotent migration: set schemaVersion & build indexes | **YES** | **Yes** |
| Root | `node scripts/validateTravelData.js` | **B** | Validate travel knowledge base JSON integrity | No | No |

---

## Frontend Tests & Static Analysis

All frontend commands must be executed from the `frontend/` directory.

### 1. Oxlint Linting

```bash
cd frontend
npm run lint
```
Runs [Oxlint](https://oxc.rs/docs/guide/usage/linter.html), an ultra-fast JavaScript/React linter. Checks for syntax errors, React hooks violations, and unused variables. Expected output: `Finished in ... ms with 0 problems`.

### 2. Staff RBAC Foundation Unit Test

```bash
cd frontend
npm run test:staff-foundation
```
Uses Node's native test runner (`node --test`) to test `src/staff/staffAccess.test.js`. Verifies:
- Administrators (`admin`, `super_admin`) have access to all department workspaces.
- Sales role sees only Sales workspace (`Overview`, `Expert Requests`, `AI Planner Leads`, `Quotations`, `Bookings`).
- Marketing role sees only Marketing workspace (`Campaigns`, `Banners`, `Analytics`).
- Customer and unknown roles receive zero staff navigation access.
- Operations role currently has no exposed frontend navigation.

### 3. Production Build Validation

```bash
cd frontend
npm run build
```
Executes Vite's production build. Verifies TypeScript-free JSX compilation, asset bundling, and CSS processing.

---

## Backend Unit & Integration Tests

All backend commands must be executed from the `backend/` directory.

### 1. AI Planner Sales Phase 1 Test (Offline Unit Test)

```bash
cd backend
npm run test:ai-planner-sales-phase1
```
Verifies queue/RBAC isolation, complete Itinerary persistence mapping, TTL configuration, purpose-bound guest authorization, lifecycle/version fields, source-derived Lead summaries, concurrent Lead-idempotency indexing, and dossier secret suppression. Existing databases must remove any historical duplicate non-null `sourceItineraryId` values before creating the partial unique Lead index.

### 2. Quotation V2 Engine Test (Offline Unit Test)

```bash
cd backend
npm run test:quotation-v2
```
Tests the core business logic of the Quotation V2 system (`test_quotation_v2.js`):
- Schema validation and DTO transformations.
- Customer privacy: Verifies internal vendor costs, margins, and private notes are suppressed from public client DTOs.
- Attachment category normalization and visibility rules (`all`, `customer_only`, `staff_only`).
- SHA-256 token hashing and verification hash generation.

### 3. Payment Reliability Test Suite (Offline Unit Test)

```bash
cd backend
npm run test:payment-reliability
```
Runs `test_payment_reliability.js` using Node native `assert` and `crypto`:
- Verifies checkout HMAC SHA-256 signature verification (asserts valid signatures pass and tampered signatures fail).
- Verifies webhook HMAC SHA-256 signature verification.
- Validates payment calculation math (deposit vs full payment balances).
- Validates QR code payload formatting and digital receipt structures.

---

## Payment & Diagnostics Safety

### 1. Razorpay Integration Test

```bash
cd backend
npm run test:razorpay
```

> [!IMPORTANT]
> **Safety Guard — Test Mode Enforcement**:
> `backend/scripts/testRazorpayIntegration.js` strictly refuses to execute if configured with production credentials:
> ```text
> ERROR: Expected test mode, found: live. Refusing to run credential check on non-test key.
> ```
> This script requires valid `rzp_test_...` credentials in `backend/.env`. It validates sandbox connectivity by performing a test query against Razorpay's `/orders` API.

### 2. Payment State Inspector (Read-Only Diagnostic)

When debugging customer bookings or payment reconciliation, use the payment inspector tool:

```bash
cd backend
# Inspect a booking by WanderLuxe booking reference or MongoDB ObjectId
npm run payment:inspect -- WLX-20260919-4821

# Inspect and assert expected payment state:
npm run payment:inspect -- WLX-20260919-4821 --expect=deposit
npm run payment:inspect -- WLX-20260919-4821 --expect=full
npm run payment:inspect -- WLX-20260919-4821 --expect=balance
```

**Diagnostic Output Includes:**
- Booking status (`confirmed`, `pending`, `cancelled`).
- Payment method, transaction ID, and amount paid.
- Deposit breakdown and outstanding balance.
- Inventory allocation status.
- Coupon code usage and affiliate commission tracking.

---

## Database Migrations & Maintenance

> [!WARNING]
> The scripts in this section modify records in the database. Run them only against your development database, never against an unbacked production database without prior review.

### 1. Staff User Provisioning

Creates a new staff member account in MongoDB:

```bash
# Terminal inside backend/
# Linux / macOS:
STAFF_NAME="Jane Smith" STAFF_EMAIL="jane@wanderluxe.com" STAFF_PASSWORD="Password123" STAFF_ROLE="sales" npm run staff:create

# Windows PowerShell:
$env:STAFF_NAME="Jane Smith"; $env:STAFF_EMAIL="jane@wanderluxe.com"; $env:STAFF_PASSWORD="Password123"; $env:STAFF_ROLE="sales"; npm run staff:create
```

- **Idempotency**: If a user with the same email and role already exists, no changes are made (`status: already_exists`).
- **Safety**: Throws an error if the user exists with a *different* role, preventing accidental privilege escalation.

### 2. Quotation V2 Migration

```bash
cd backend
npm run quotations:v2:migrate
```

- **Behavior**: Migrates legacy quotations by assigning `schemaVersion: 1` to unversioned documents.
- **Additive Indexing**: Builds additive compound indexes on `Quotation`, `QuotationRevision`, `QuotationShare`, and `Booking` collections.
- **Idempotent**: Safe to run repeatedly; only modifies unversioned records.

---

## Data Integrity & Schema Validation

### Travel Knowledge Base Validation

WanderLuxe maintains a curated offline travel database in `frontend/src/data/travelKnowledge.json`. Validate its data schema and cross-references using the root test runner:

```bash
# From repository root
node scripts/validateTravelData.js
```

**Validations Performed:**
- Verifies destination slugs, IDs, regional classifications, and seasons.
- Checks that all referenced travel styles match valid IDs.
- Validates day-by-day attraction coordinates, weather profiles, and activity tags.
- Expected result: `0 errors, 0 warnings`.

---

## Continuous Integration (CI) Pre-Flight Checklist

Before opening a pull request, run this verification suite locally:

```bash
# 1. Frontend Lint & Build
cd frontend
npm run lint
npm run test:staff-foundation
npm run build

# 2. Backend Unit Tests
cd ../backend
npm run test:ai-planner-sales-phase1
npm run test:ai-planner-sales-phase2
npm run test:quotation-v2
npm run test:payment-reliability

# 3. Data Integrity
cd ..
node scripts/validateTravelData.js
```

The Phase 2 suite covers deterministic Lead-to-Quotation mapping, exact and flexible dates, separate senior counts, stay segmentation, review-only candidates, zero commercial pricing, source comparison, public filtering, revision propagation, and additive schema contracts. Complete the relevant manual Lead, candidate-review, source-change, PDF/share, and Booking/Operations journeys against a connected development database before release.

If all steps pass without errors, your branch is ready for manual review.
