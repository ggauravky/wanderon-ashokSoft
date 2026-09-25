# WanderLuxe — Environment Variables Reference

This document is the authoritative engineering reference for all environment variables supported by the WanderLuxe platform. Every variable listed here is verified against active source code in `backend/config/environment.js`, `backend/server.js`, and `frontend/src/services/apiConfig.js`.

---

## Table of Contents

1. [Golden Rules & Security Policy](#golden-rules--security-policy)
2. [Classification Matrix](#classification-matrix)
3. [Backend Environment Variables](#backend-environment-variables)
4. [Frontend Environment Variables](#frontend-environment-variables)
5. [Safe Local Development Templates](#safe-local-development-templates)
6. [Team Secret Sharing Policy](#team-secret-sharing-policy)
7. [When Docs and Code Differ](#when-docs-and-code-differ)

---

## Golden Rules & Security Policy

> [!CAUTION]
> **VITE_ Client-Side Security Boundary**:
> Any variable in `frontend/.env` prefixed with `VITE_` is automatically statically embedded into client-side JavaScript bundles by Vite during development and production builds. 
> 
> **NEVER put secret keys in `frontend/.env`**:
> - ❌ `RAZORPAY_KEY_SECRET`
> - ❌ `JWT_SECRET`
> - ❌ `MONGODB_URI`
> - ❌ `CLOUDINARY_API_SECRET`
> - ❌ `BREVO_API_KEY`
> - ❌ `TWILIO_AUTH_TOKEN`
> - ❌ `GEMINI_API_KEY`
>
> All sensitive operations and credentials must remain strictly inside `backend/.env`.

---

## Classification Matrix

| Tier | Description | Examples |
| :--- | :--- | :--- |
| **Tier 1: Core Required** | Required for backend/frontend to boot and serve traffic. | `PORT`, `NODE_ENV`, `JWT_SECRET`, `FRONTEND_URL`, `VITE_API_URL` |
| **Tier 2: Feature-Specific** | Required for specific application modules to operate; fails gracefully/closed if missing. | `MONGODB_URI`, `RAZORPAY_KEY_ID`, `GEMINI_API_KEY`, `CLOUDINARY_*` |
| **Tier 3: Notifications / External** | Optional transactional notifications; unconfigured services report `NOT_CONFIGURED`. | `BREVO_*`, `TWILIO_*` |
| **Tier 4: Tooling / Provisioning** | One-off environment variables consumed by command-line scripts. | `STAFF_NAME`, `STAFF_EMAIL`, `STAFF_PASSWORD`, `STAFF_ROLE` |

---

## Backend Environment Variables

File location: `backend/.env` (derived from `backend/.env.example`)

### 1. Core Server & Authentication

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `PORT` | No | Yes | Public | `5000` | Port for the Express server. Defaults to `5000` if omitted. On Render, injected automatically. |
| `NODE_ENV` | Yes | Yes | Public | `development` / `production` | Execution environment. In `production`, requires DB connection at boot and enforces strict JWT rules. |
| `JWT_SECRET` | **YES** | **YES** | **Secret** | `64-char hex string` | Secret key used for signing and verifying JWT tokens. Runtime validation fails at startup if missing. In production, rejected if < 32 characters or if matching default placeholders (`"secret"`, `"dev-secret"`). |

### 2. Database

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `MONGODB_URI` (or `MONGO_URI`) | No* | **YES** | **Secret** | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` | MongoDB Atlas connection string. In dev, server boots without it, but database-backed endpoints fail closed with HTTP 503. In prod, boot fails immediately if missing. |

*\* Note: Required for real user flows (login, bookings, staff portal).*

### 3. CORS & Client Access

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `FRONTEND_URL` | Yes | Yes | Public | `http://localhost:5173` | Canonical URL of the client app. Whitelisted for CORS; used in verification emails and WhatsApp links. |
| `ALLOWED_ORIGINS` | No | Yes | Public | `http://localhost:5173` | Comma-separated list of approved origin domains allowed by CORS middleware. |
| `ALLOW_VERCEL_PREVIEWS` | No | No | Public | `false` | When set to `'true'`, allows dynamic Vercel preview deployment URLs (`https://*.vercel.app`) to access the API. |

### 4. Razorpay Payments

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `RAZORPAY_KEY_ID` | Feature | **YES** | Public/Key | `rzp_test_...` (Dev) / `rzp_live_...` (Prod) | Razorpay Key ID. Must start with `rzp_test_` in development. Checkout order creation fails without it. |
| `RAZORPAY_KEY_SECRET` | Feature | **YES** | **Secret** | `<secret-key>` | Razorpay Key Secret. Used for server-side order generation and HMAC SHA-256 signature verification. |
| `RAZORPAY_WEBHOOK_SECRET` | Feature | **YES** | **Secret** | `<webhook-secret>` | Secret configured in Razorpay Dashboard for webhook signature verification (`/api/payments/razorpay/webhook`). |

### 5. Google Gemini AI (Planner and Quotation Smart Builder)

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `GEMINI_API_KEY` | Feature | Optional | **Secret** | _(secret)_ | Server-side Google Gemini key. Never expose it through a `VITE_` variable. Structured quotation import and safe defaults remain available when omitted. |
| `GEMINI_MODEL` | Feature | Optional | No | `gemini-3.8-flash` | Central primary model for planner and AI writing. |
| `QUOTATION_AI_MODEL` | Feature | Optional | No | `gemini-3.1-flash-lite` | Low-cost quotation-only primary model. The general AI Planner continues to use `GEMINI_MODEL`. |
| `QUOTATION_AI_FALLBACK_MODEL` | Feature | Optional | No | `gemini-3.5-flash-lite` | Quotation-only fallback used for retryable model/provider failures. |
| `DEMO_QUOTATION_STAFF_EMAIL` | Development | Optional | No | `staff@example.com` | Existing active Admin, Super Admin, or Sales account used by the idempotent local demo seed. The seed refuses production. |

### 6. Cloudinary Media Storage

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | Feature | **YES** | Public | `<cloud-name>` | Cloudinary account cloud identifier. |
| `CLOUDINARY_API_KEY` | Feature | **YES** | Public/Key | `<api-key>` | Cloudinary public API key. |
| `CLOUDINARY_API_SECRET` | Feature | **YES** | **Secret** | `<api-secret>` | Cloudinary API secret. In development, image uploads fall back to local disk (`./uploads`) if unconfigured. In production, upload mutations fail closed. |

### 7. Brevo Transactional Email

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `BREVO_API_KEY` | Feature | Optional | **Secret** | `xkeysib-...` | Brevo (formerly Sendinblue) API v3 key. Used for sending Quotation recipient OTP verification emails. Returns HTTP 503 if missing when sending. |
| `BREVO_SENDER_EMAIL` | Feature | Optional | Public | `quotes@wanderluxe.com` | Verified sender email address in Brevo. |
| `BREVO_SENDER_NAME` | No | No | Public | `WanderLuxe` | Friendly sender name. Defaults to `"WanderLuxe"`. |

### 8. Twilio WhatsApp Notifications

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Failure Impact |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Optional | Optional | Public/ID | `AC...` | Twilio Account SID. |
| `TWILIO_AUTH_TOKEN` | Optional | Optional | **Secret** | `<auth-token>` | Twilio Auth Token. |
| `TWILIO_WHATSAPP_NUMBER` | Optional | Optional | Public | `whatsapp:+14155238886` | Twilio registered WhatsApp sender number. Missing credentials report `{ sent: false, status: 'NOT_CONFIGURED' }`. |

### 9. Staff Provisioning Script Inputs

These variables are consumed exclusively when executing `npm run staff:create`:

| Variable | Required for Script? | Type | Allowed Values | Purpose |
| :--- | :---: | :---: | :--- | :--- |
| `STAFF_NAME` | Yes | Public | e.g. `"John Doe"` | Full name of the staff member. |
| `STAFF_EMAIL` | Yes | Public | e.g. `"john@wanderluxe.com"` | Unique email address for login. |
| `STAFF_PASSWORD` | Yes | **Secret** | Minimum 8 characters | Initial plain-text password (hashed with bcrypt before storage). |
| `STAFF_ROLE` | Yes | Public | `super_admin`, `admin`, `operations`, `sales`, `marketing` | Assigned role authority. |
| `STAFF_IS_ACTIVE` | No | Public | `true` / `false` (default: `true`) | Active account state flag. |

---

## Frontend Environment Variables

File location: `frontend/.env` (derived from `frontend/.env.example`)

| Variable | Dev Required? | Prod Required? | Type | Default / Example | Purpose & Behavior |
| :--- | :---: | :---: | :---: | :--- | :--- |
| `VITE_API_URL` | No | **YES** | Public | `/api` (Dev) / `https://api.wanderluxe.com` (Prod) | Base URL for backend API requests. In local dev, leave as `/api` so that Vite dev server proxies requests to `http://localhost:5000`. In production, points to the live backend domain. |
| `VITE_RAZORPAY_KEY_ID` | Feature | **YES** | Public | `rzp_test_...` (Dev) / `rzp_live_...` (Prod) | Public Razorpay Key ID used by the client-side Razorpay Checkout modal. Must match backend `RAZORPAY_KEY_ID`. |
| `VITE_SITE_URL` | No | Yes | Public | `http://localhost:5173` | Canonical public site URL used for generating client-side share links and QR codes. |

---

## Safe Local Development Templates

### Safe `backend/.env` (Local Development)

```ini
# Core
PORT=5000
NODE_ENV=development

# Database (Ask maintainer for dev Atlas URI)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/wanderluxe-dev?retryWrites=true&w=majority

# Auth (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=4f7b2a9e1d8c3f5a0b6e9d2c8f1a4b7e3d6c9f2a5b8e1d4c7f0a3b6e9d2c5f8a

# CORS & Client
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=false

# Feature: Razorpay (Test mode only)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=yyyyyyyyyyyyyyyyyyyyyyyy
RAZORPAY_WEBHOOK_SECRET=

# Feature: Gemini AI (Optional)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.8-flash
QUOTATION_AI_MODEL=gemini-3.1-flash-lite
QUOTATION_AI_FALLBACK_MODEL=gemini-3.5-flash-lite
DEMO_QUOTATION_STAFF_EMAIL=

# Feature: Cloudinary (Optional in dev - falls back to ./uploads)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Feature: Brevo Email (Optional)
BREVO_API_KEY=
BREVO_SENDER_EMAIL=
BREVO_SENDER_NAME=WanderLuxe

# Feature: Twilio WhatsApp (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_NUMBER=
```

### Safe `frontend/.env` (Local Development)

```ini
# Leave as /api for Vite proxy routing
VITE_API_URL=/api

# Public Razorpay Key ID (Must match backend test key)
VITE_RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxxxxx

# Local client URL
VITE_SITE_URL=http://localhost:5173
```

---

## Team Secret Sharing Policy

To protect customer data, payment credentials, and infrastructure security:

1. **NEVER commit `.env` files**: `.gitignore` is configured to ignore `.env`, `.env.local`, and `.env.*.local`. Always double-check `git status` before committing.
2. **NEVER share credentials through public channels**: Do not share API keys, MongoDB URIs, or secrets through Slack public channels, Discord, GitHub issues, pull request descriptions, or screenshots.
3. **Use the Approved Password Manager**: Obtain development credentials from the project maintainer through the team's approved secure secret-sharing channel (e.g., 1Password, Bitwarden, or encrypted vault).
4. **Secret Compromise Protocol**: If any secret is accidentally committed to a branch or exposed publicly:
   - **Immediately rotate the credential** in the provider dashboard (MongoDB Atlas, Razorpay, Cloudinary, etc.).
   - Merely deleting the commit or pushing a revert does **NOT** revoke an exposed secret.

---

## When Docs and Code Differ

The active codebase and the `.env.example` templates in `backend/` and `frontend/` are the ultimate source of truth.

If you introduce or modify an environment variable:
1. Update `backend/.env.example` or `frontend/.env.example`.
2. Update this document (`docs/ENVIRONMENT_VARIABLES.md`).
3. Add appropriate validation in `backend/config/environment.js`.
4. Open a documentation update alongside your feature PR.
