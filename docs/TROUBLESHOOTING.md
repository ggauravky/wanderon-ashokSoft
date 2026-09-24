# WanderLuxe — Troubleshooting & Diagnostic Guide

This guide provides targeted solutions for common installation, runtime, database, network, and development issues across Windows, macOS, and Linux.

---

## Table of Contents

1. [Port Conflicts](#1-port-conflicts)
   - [Port 5173 Occupied (Frontend Vite)](#port-5173-occupied-frontend-vite)
   - [Port 5000 Occupied (Backend Express)](#port-5000-occupied-backend-express)
2. [Database & Network Issues](#2-database--network-issues)
   - [MongoDB DNS SRV Error (`querySrv ENOTFOUND`)](#mongodb-dns-srv-error-querysrv-enotfound)
   - [Database Fail-Closed Behavior (HTTP 503)](#database-fail-closed-behavior-http-503)
3. [Authentication & CORS](#3-authentication--cors)
   - [JWT_SECRET Missing or Weak Error](#jwt_secret-missing-or-weak-error)
   - [CORS Error / Origin Not Allowed](#cors-error--origin-not-allowed)
   - [401 Unauthorized / Expired Session](#401-unauthorized--expired-session)
4. [External Integrations](#4-external-integrations)
   - [Razorpay Script Blocked or Test Mode Refusal](#razorpay-script-blocked-or-test-mode-refusal)
   - [Cloudinary Media Upload Failure](#cloudinary-media-upload-failure)
   - [Gemini AI Planner Generating Fallback Templates](#gemini-ai-planner-generating-fallback-templates)
   - [Brevo Email / Twilio WhatsApp Unconfigured](#brevo-email--twilio-whatsapp-unconfigured)
5. [Frontend & Build Issues](#5-frontend--build-issues)
   - [Client-Side PDF Generation Hanging or Failing](#client-side-pdf-generation-hanging-or-failing)
   - [Vite Cache / Stale Dev Server State](#vite-cache--stale-dev-server-state)
   - [Case-Sensitivity Import Errors on Linux](#case-sensitivity-import-errors-on-linux)
6. [Dependency & Package Lock Issues](#6-dependency--package-lock-issues)
   - [`node_modules` Copied Between Different Operating Systems](#node_modules-copied-between-different-operating-systems)
   - [`npm ci` Verification Failure](#npm-ci-verification-failure)
   - [Safe Full Dependency Reset](#safe-full-dependency-reset)

---

## 1. Port Conflicts

### Port 5173 Occupied (Frontend Vite)

**Symptom:**
```text
Port 5173 is in use, trying another one...
Error: Port 5173 is already in use
```

**Cause:**
`frontend/vite.config.js` sets `strictPort: true`. Vite intentionally halts instead of switching to port 5174 so that backend CORS whitelists and proxy settings do not break.

**Diagnosis & Fix:**

**Windows (PowerShell):**
```powershell
# 1. Identify the PID holding port 5173
Get-NetTCPConnection -LocalPort 5173 | Select-Object LocalAddress, LocalPort, OwningProcess

# 2. Terminate the process by PID
Stop-Process -Id <PID> -Force
```

**macOS & Linux:**
```bash
# 1. Identify the PID holding port 5173
lsof -i :5173

# 2. Terminate the process by PID
kill -9 <PID>
```

---

### Port 5000 Occupied (Backend Express)

**Symptom:**
```text
Error: listen EADDRINUSE: address already in use :::5000
❌ Port 5000 is already in use by another running process.
```

**Diagnosis & Fix:**

**Windows (PowerShell):**
```powershell
# Identify the process
Get-NetTCPConnection -LocalPort 5000 | Select-Object LocalAddress, LocalPort, OwningProcess

# Terminate process
Stop-Process -Id <PID> -Force
```

**macOS & Linux:**
```bash
# On macOS, AirPlay Receiver sometimes uses port 5000:
# (System Settings -> General -> AirDrop & AirPlay -> Turn off AirPlay Receiver)

# Find and kill process:
lsof -i :5000
kill -9 <PID>
```

---

## 2. Database & Network Issues

### MongoDB DNS SRV Error (`querySrv ENOTFOUND`)

**Symptom:**
```text
querySrv ENOTFOUND _mongodb._tcp.<cluster>.mongodb.net
MongoServerSelectionError: connection timed out
```

**Cause:**
Certain local ISPs, corporate firewalls, or VPN virtual network adapters fail to resolve DNS SRV records for MongoDB Atlas clusters.

**Resolution Steps:**
1. **Repository Auto-Fix**: `backend/config/db.js` automatically configures Node to query Google Public DNS (`8.8.8.8`) and Cloudflare DNS (`1.1.1.1`).
2. **Check IP Whitelist**: Log in to MongoDB Atlas and verify that your current public IP address is added to **Network Access** (or set to `0.0.0.0/0` in sandbox development).
3. **VPN / Firewall**: If using a corporate VPN or custom antivirus network filter, temporarily disconnect or whitelist MongoDB Atlas ports (`27017`).
4. **Inspect Connection String**: Ensure your `MONGODB_URI` starts with `mongodb+srv://` and includes URL-encoded special characters in your password.

---

### Database Fail-Closed Behavior (HTTP 503)

**Symptom:**
- Backend terminal logs: `MongoDB URI is missing. Database-backed features will fail closed.`
- API calls to `/api/auth/login` or `/api/bookings` return **HTTP 503**:
  ```json
  { "message": "Authentication is temporarily unavailable." }
  ```

**Cause:**
WanderLuxe is built with a resilient fail-closed architecture. In development mode, the server process boots immediately to allow static asset exploration even when offline. Real user flows requiring database queries will safely fail closed with HTTP 503 until a database connection is established.

**Fix:**
1. Check [http://localhost:5000/api/readiness](http://localhost:5000/api/readiness). If it returns `503 not_ready`, the database is disconnected.
2. Supply a valid `MONGODB_URI` in `backend/.env`.
3. Restart the backend server.

---

## 3. Authentication & CORS

### JWT_SECRET Missing or Weak Error

**Symptom:**
```text
Error: JWT_SECRET is required. Refusing to start with unsigned or fallback authentication.
```
or in production:
```text
Error: JWT_SECRET must be a non-default secret containing at least 32 characters.
```

**Fix:**
Generate a secure 64-character secret using Node's crypto library:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Paste the generated string into `backend/.env` under `JWT_SECRET=`.

---

### CORS Error / Origin Not Allowed

**Symptom in Browser Console:**
```text
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy: 
Origin is not allowed by CORS policy.
```

**Fix:**
1. Verify `FRONTEND_URL` and `ALLOWED_ORIGINS` in `backend/.env` match your client URL:
   ```ini
   FRONTEND_URL=http://localhost:5173
   ALLOWED_ORIGINS=http://localhost:5173
   ```
2. In local development, the backend automatically allows any `localhost` origin when `NODE_ENV=development`. If you see this error, ensure `NODE_ENV=development` is set in `backend/.env`.

---

### 401 Unauthorized / Expired Session

**Symptom:**
Staff dashboard redirects to `/login` or requests return `401 Not authorized, token invalid or expired`.

**Fix:**
1. Open Browser DevTools -> **Application** (or **Storage**) -> **Local Storage** -> `http://localhost:5173`.
2. Clear the `wanderluxe_token` and `wanderluxe_user` keys.
3. Refresh the page and log in again at [http://localhost:5173/login](http://localhost:5173/login).

---

## 4. External Integrations

### Razorpay Script Blocked or Test Mode Refusal

**Symptom A: Script Blocked**
```text
Failed to load Razorpay Checkout SDK
```
- **Cause**: An ad-blocker (uBlock Origin, Brave Shields, Pi-hole) is blocking `https://checkout.razorpay.com/v1/checkout.js`.
- **Fix**: Disable ad-blocking extensions for `localhost:5173`.

**Symptom B: Test Mode Refusal**
```text
ERROR: Expected test mode, found: live. Refusing to run credential check on non-test key.
```
- **Cause**: `backend/scripts/testRazorpayIntegration.js` refuses to run against live credentials.
- **Fix**: Use keys starting with `rzp_test_...` in `backend/.env`.

---

### Cloudinary Media Upload Failure

**Symptom:**
Image upload requests fail with `Media storage is not configured.`

**Behavior:**
- In **development**: If Cloudinary credentials are not provided, files automatically save to the local disk directory (`backend/uploads/`).
- In **production**: Upload mutations fail closed if `CLOUDINARY_*` variables are missing.
- **Fix**: Set valid `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `backend/.env`.

---

### Gemini AI Planner Generating Fallback Templates

**Symptom:**
The AI Itinerary Planner generates itineraries, but the terminal logs indicate `source: template-engine`.

**Cause:**
`GEMINI_API_KEY` is empty or missing in `backend/.env`.

**Fix:**
The planner gracefully falls back to the internal travel knowledge engine (`travelKnowledge.json`). Structured quotation import and safe policy defaults also remain available. For dynamic writing, configure `GEMINI_API_KEY`, optionally set `GEMINI_MODEL` / `QUOTATION_AI_MODEL`, restart the backend, then run `npm run test:gemini` from `backend`. The diagnostic output reports only model, safe error code, latency, and a reference ID.

---

### Brevo Email / Twilio WhatsApp Unconfigured

**Symptom:**
- Quotation verification email fails with HTTP 503 `Recipient verification email is not configured.`
- WhatsApp service logs `{ sent: false, status: 'NOT_CONFIGURED' }`.

**Fix:**
These services are optional for general development. To enable them, provide valid credentials in `backend/.env`:
- Brevo: `BREVO_API_KEY` and `BREVO_SENDER_EMAIL`
- Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, and `TWILIO_WHATSAPP_NUMBER`

---

## 5. Frontend & Build Issues

### Client-Side PDF Generation Hanging or Failing

**Symptom:**
Exporting a quotation or booking confirmation PDF freezes or times out.

**Cause:**
`html2canvas` is waiting for external cross-origin images or web fonts to render.

**Fix:**
`frontend/src/utils/pdfGenerator.js` includes a 3.5-second timeout on image decode. If images fail to render, check that remote image URLs (Cloudinary, Unsplash) allow cross-origin requests (`crossorigin="anonymous"`).

---

### Vite Cache / Stale Dev Server State

**Symptom:**
Code edits do not reflect in the browser, or Vite displays stale bundling errors.

**Fix:**
Stop the frontend server (`Ctrl+C`) and restart Vite clearing the cache:
```bash
cd frontend
npx vite --force
```

---

### Case-Sensitivity Import Errors on Linux

**Symptom on Linux / Render:**
```text
Rollup failed to resolve import "../components/tripcard" from "src/pages/Home.jsx".
```

**Cause:**
The file on disk is `TripCard.jsx`, but the import statement specifies lowercase `tripcard`. Windows and macOS do not catch this error locally.

**Fix:**
Update the import path to match the exact casing of the filename on disk.

---

## 6. Dependency & Package Lock Issues

### `node_modules` Copied Between Different Operating Systems

**Symptom:**
```text
Error: Cannot find module '.../node_modules/.../binding.node'
or platform-specific native binary execution failures
```

**Cause:**
Copying `node_modules` from Windows to macOS/Linux (or vice-versa) transfers incompatible compiled native binaries.

**Fix:**
Never copy `node_modules`. Perform a clean install natively on each OS using `npm ci`.

---

### `npm ci` Verification Failure

**Symptom:**
```text
npm error code EUSAGE
npm error `npm ci` can only install when your package.json and package-lock.json or npm-shrinkwrap.json are in sync.
```

**Cause:**
`package.json` was edited manually without updating `package-lock.json`.

**Rule:**
- **DO NOT** run `npm audit fix --force` or `npm install --force`, as this can introduce breaking dependency changes.
- **Resolution**:
  ```bash
  npm install
  git commit -m "chore: sync package-lock.json with package.json"
  ```

---

### Safe Full Dependency Reset

If your dependencies become corrupted:

#### Windows (PowerShell):
```powershell
# 1. Inside backend directory
cd backend
Remove-Item -Recurse -Force node_modules
npm ci

# 2. Inside frontend directory
cd ..\frontend
Remove-Item -Recurse -Force node_modules
npm ci
```

#### macOS & Linux:
```bash
# 1. Inside backend directory
cd backend
rm -rf node_modules
npm ci

# 2. Inside frontend directory
cd ../frontend
rm -rf node_modules
npm ci
```
