# WanderLuxe — Developer Onboarding & Local Setup Guide

Welcome to the WanderLuxe engineering team. This guide will walk you through setting up your local development environment from scratch on **Windows (PowerShell)**, **macOS (Intel & Apple Silicon)**, or **Linux (Ubuntu/Debian)**.

Follow this guide step-by-step to go from repository access to running the full-stack application locally.

---

## Table of Contents

1. [5-Minute Quick Start](#5-minute-quick-start)
2. [Prerequisites & System Requirements](#prerequisites--system-requirements)
3. [Repository Structure & Package Management](#repository-structure--package-management)
4. [Step 1: Clone the Repository](#step-1-clone-the-repository)
5. [Step 2: Install Node.js (v22 LTS)](#step-2-install-nodejs-v22-lts)
6. [Step 3: Install Dependencies (`npm ci`)](#step-3-install-dependencies-npm-ci)
7. [Step 4: Configure Environment Files](#step-4-configure-environment-files)
8. [Step 5: Generate a JWT Secret](#step-5-generate-a-jwt-secret)
9. [Step 6: Start the Backend Server](#step-6-start-the-backend-server)
10. [Step 7: Start the Frontend Application](#step-7-start-the-frontend-application)
11. [Step 8: Verify Your Local Setup](#step-8-verify-your-local-setup)
12. [Understanding Database Behavior & Fail-Closed Design](#understanding-database-behavior--fail-closed-design)
13. [Staff Account Provisioning](#staff-account-provisioning)
14. [Onboarding Checklist](#onboarding-checklist)

---

## 5-Minute Quick Start

If you already have Node.js 22 LTS, npm 10+, Git, and your development credentials ready:

### Terminal 1: Backend

```bash
# macOS / Linux (Bash / Zsh)
git clone <repository-url> wanderon-ashokSoft
cd wanderon-ashokSoft/backend
npm ci
cp .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm run dev
```

```powershell
# Windows (PowerShell)
git clone <repository-url> wanderon-ashokSoft
cd wanderon-ashokSoft\backend
npm ci
Copy-Item .env.example .env
# Edit .env with your MONGODB_URI and JWT_SECRET
npm run dev
```

### Terminal 2: Frontend

```bash
# macOS / Linux (Bash / Zsh)
cd wanderon-ashokSoft/frontend
npm ci
cp .env.example .env
npm run dev
```

```powershell
# Windows (PowerShell)
cd wanderon-ashokSoft\frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Prerequisites & System Requirements

| Tool | Version Requirement | Purpose | Notes |
| :--- | :--- | :--- | :--- |
| **Node.js** | `^20.19.0` or `>=22.12.0` (Recommended: **Node 22 LTS**) | Runtime environment | Pinned in `.nvmrc` and `.node-version` |
| **npm** | `>=10.0.0` (Included with Node 22) | Package manager | Use `npm ci`, not `npm install` |
| **Git** | `>=2.30.0` | Version control | Configured with LF line endings |
| **Modern Browser** | Chrome, Edge, Safari, or Firefox | Client application | Chrome/Edge recommended for DevTools |
| **Code Editor** | VS Code (Recommended) | Development | Extensions: ESLint, Tailwind CSS IntelliSense |

> [!IMPORTANT]
> **MongoDB Local Installation is NOT Required**: The team uses remote **MongoDB Atlas** database clusters for development. You do not need to install MongoDB Community Server or MongoDB Compass locally unless you explicitly choose to develop offline.

---

## Repository Structure & Package Management

The repository is organized into two independent Node packages:

```text
wanderon-ashokSoft/
├── backend/          # Node.js + Express API server (Port 5000)
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── frontend/         # React 19 + Vite 8 SPA (Port 5173)
│   ├── package.json
│   ├── package-lock.json
│   └── .env.example
├── docs/             # Engineering & onboarding documentation
├── .nvmrc            # Node version pin (22)
├── .node-version     # Node version pin (22)
└── .gitattributes    # Cross-platform LF line endings
```

- **No Root `package.json`**: By design, the project does not use a monorepo orchestration tool (such as Turborepo, Nx, or Concurrently). This keeps scripts explicit, fast, and transparent.
- **Two Terminals Required**: Run the backend in one terminal and the frontend in a second terminal.
- **Separate Lockfiles**: `frontend/` and `backend/` each maintain their own `package-lock.json`. Always run npm commands inside their respective directories.

---

## Step 1: Clone the Repository

Clone the project into your local workspace:

```bash
# macOS / Linux / Windows
git clone https://github.com/ggauravky/wanderon-ashokSoft.git
cd wanderon-ashokSoft
```

Verify your git state:

```bash
git status
```

---

## Step 2: Install Node.js (v22 LTS)

The repository requires Node.js `^20.19.0 || >=22.12.0` (due to Vite 8 build tool requirements). We standardize on **Node 22 LTS**.

### macOS & Linux (via nvm)

We recommend using [nvm (Node Version Manager)](https://github.com/nvm-sh/nvm):

```bash
# Install Node 22 LTS
nvm install 22

# Activate Node 22 (or automatically load from .nvmrc)
nvm use

# Verify installed versions
node --version  # Should output v22.x.x
npm --version   # Should output 10.x.x or higher
```

> [!NOTE]
> **Apple Silicon (M1/M2/M3/M4) & Intel Macs**: Node 22 runs natively on both ARM64 and x64 architectures. No special Rosetta flags or emulation are required.

### Windows 10/11 (via nvm-windows or Official Installer)

Option A: **nvm-windows** (Recommended if managing multiple Node versions):
```powershell
nvm install 22.14.0
nvm use 22.14.0
```

Option B: **Official MSI Installer**:
Download and install the **Node.js 22 LTS** installer from [nodejs.org](https://nodejs.org/).

Verify in **PowerShell**:
```powershell
node --version  # Should output v22.x.x
npm --version   # Should output 10.x.x or higher
```

### Windows Subsystem for Linux (WSL) — Optional

If you prefer developing inside WSL (Ubuntu):
1. Install Node 22 via `nvm` **inside** the WSL terminal.
2. Clone the repository directly inside the Linux filesystem (e.g. `~/projects/wanderon-ashokSoft`), not the mounted `/mnt/c/` path, for optimal I/O performance.
3. Run `npm ci` strictly inside WSL.

> [!WARNING]
> **Do NOT Share `node_modules` Between Windows and WSL/macOS/Linux**: Node modules contain platform-specific binaries. Never copy `node_modules` from Windows to Linux/macOS or vice-versa. Run `npm ci` natively in each environment.

---

## Step 3: Install Dependencies (`npm ci`)

Always use `npm ci` for onboarding and clean builds. 

`npm ci` (Clean Install) installs the exact package versions recorded in `package-lock.json` without modifying the lockfile.

### 1. Install Backend Dependencies

Open **Terminal 1**:

```bash
# macOS / Linux / Windows
cd backend
npm ci
```

### 2. Install Frontend Dependencies

Open **Terminal 2**:

```bash
# macOS / Linux / Windows
cd frontend
npm ci
```

---

## Step 4: Configure Environment Files

Both `backend/` and `frontend/` require a local `.env` configuration file created from their respective `.env.example` templates.

### 1. Backend Environment

In **Terminal 1** (`backend/` directory):

**macOS / Linux (Bash / Zsh):**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Open `backend/.env` in your editor. For basic local development, verify or set the following values:

```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=<ask-team-maintainer-for-development-mongo-uri>
JWT_SECRET=<generate-in-step-5>
FRONTEND_URL=http://localhost:5173
ALLOWED_ORIGINS=http://localhost:5173
ALLOW_VERCEL_PREVIEWS=false
```

> [!TIP]
> **Where to get `MONGODB_URI`**: Request the development MongoDB Atlas connection string from your project lead or maintainer through the team's approved secure channel. Never commit this string to version control.

### 2. Frontend Environment

In **Terminal 2** (`frontend/` directory):

**macOS / Linux (Bash / Zsh):**
```bash
cp .env.example .env
```

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

Open `frontend/.env` in your editor. For local development, the default proxy handles API routing:

```ini
# Leave as /api to route through the Vite development proxy to localhost:5000
VITE_API_URL=/api

# Optional: Razorpay Public Key ID for testing payment modals
VITE_RAZORPAY_KEY_ID=

# Local site URL
VITE_SITE_URL=http://localhost:5173
```

> [!CAUTION]
> **Vite Security Rule**: Any variable starting with `VITE_` is baked directly into the client-side JavaScript bundle and is visible to anyone inspecting network traffic or browser source code. **NEVER** place `JWT_SECRET`, `MONGODB_URI`, `RAZORPAY_KEY_SECRET`, or any external API keys in `frontend/.env`!

---

## Step 5: Generate a JWT Secret

The backend runtime validator refuses to start without a valid `JWT_SECRET`. In production, secrets shorter than 32 characters or default strings (such as `"secret"`, `"dev-secret"`) are actively rejected.

Generate a secure 64-character hexadecimal secret using this cross-platform Node command:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the generated string and paste it into `backend/.env`:

```ini
JWT_SECRET=4f7b2a9e1d8c3f5a0b6e9d2c8f1a4b7e3d6c9f2a5b8e1d4c7f0a3b6e9d2c5f8a
```

---

## Step 6: Start the Backend Server

In **Terminal 1** (`backend/` directory):

```bash
npm run dev
```

The backend server runs with Node's native file watcher (`node --watch server.js`).

### Expected Terminal Output:

```text
🚀 WanderLuxe Backend Server running on port 5000 in development mode
[Razorpay] Configured: test mode
[Razorpay] Webhook verification: not configured
✅ MongoDB Atlas Database connected successfully!
```

Verify backend health in your browser or via curl:
- **Liveness probe**: [http://localhost:5000/health](http://localhost:5000/health) (Returns `{ status: "ok", databaseConnected: true }`)
- **Readiness probe**: [http://localhost:5000/api/readiness](http://localhost:5000/api/readiness) (Returns HTTP 200 when database is connected, HTTP 503 if disconnected)

---

## Step 7: Start the Frontend Application

In **Terminal 2** (`frontend/` directory):

```bash
npm run dev
```

Vite will start the development server:

```text
  VITE v8.x.x  ready in 250 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Important Vite Configuration: `strictPort: true`

`frontend/vite.config.js` is intentionally configured with `strictPort: true` on port `5173`. 
- If port `5173` is already in use by another application or an orphaned process, Vite will **fail immediately** with an error rather than silently hopping to port 5174 or 5175.
- This prevents silent proxy mismatches and broken CORS origins.
- See [docs/TROUBLESHOOTING.md](DEVELOPMENT_SETUP.md#port-conflicts) if you encounter a port conflict.

---

## Step 8: Verify Your Local Setup

Once both servers are running, complete these verification steps:

1. Open **http://localhost:5173** in your browser. The WanderLuxe homepage should render with full hero styling, search bar, and curated journeys.
2. Open DevTools (**F12** or **Cmd+Option+I**), switch to the **Console** tab, and verify that there are no red network errors or uncaught exceptions.
3. Test the Vite Proxy: Navigate to a trip card or open [http://localhost:5173/api/trips](http://localhost:5173/api/trips). You should receive a JSON response from the backend through the proxy.
4. Test Authentication: Visit [http://localhost:5173/login](http://localhost:5173/login). If you have created a staff user (see [Staff Provisioning](#staff-account-provisioning)), test logging into the staff workspace.

---

## Understanding Database Behavior & Fail-Closed Design

WanderLuxe implements a resilient **fail-closed** architecture:

1. **Non-Blocking Development Boot**: In `development` mode, `server.js` starts listening on port 5000 immediately, and initiates the MongoDB Atlas connection asynchronously in the background.
2. **Buffer Commands Disabled**: `mongoose.set("bufferCommands", false)` is enabled in `backend/config/db.js`. Queries fail immediately rather than hanging indefinitely if the database is offline.
3. **Fail-Closed API Routes**: If MongoDB is temporarily unreachable or your IP is not whitelisted:
   - The server process **does not crash**.
   - Public static pages and the `/health` endpoint continue to respond.
   - Database-dependent endpoints (login, bookings, quotations, staff center) return **HTTP 503 Service Unavailable** with `{ message: "Authentication is temporarily unavailable." }`.
   - Once MongoDB reconnects, all endpoints automatically recover without requiring a server restart.

---

## Staff Account Provisioning

To access staff dashboards (Admin, Operations, Sales, Marketing), you need a user record with an authorized staff role. The backend provides an automated provisioning script:

```bash
# Terminal 1 (inside backend/)
```

### macOS / Linux (Bash / Zsh):
```bash
STAFF_NAME="Alex Morgan" \
STAFF_EMAIL="alex@wanderluxe.com" \
STAFF_PASSWORD="YourSecurePassword123" \
STAFF_ROLE="admin" \
npm run staff:create
```

### Windows (PowerShell):
```powershell
$env:STAFF_NAME="Alex Morgan"
$env:STAFF_EMAIL="alex@wanderluxe.com"
$env:STAFF_PASSWORD="YourSecurePassword123"
$env:STAFF_ROLE="admin"
npm run staff:create
```

**Supported Staff Roles:**
- `super_admin`: Complete access to all administrative and business tools.
- `admin`: Full administration access (destinations, bookings, team analytics, media).
- `operations`: Read-only Operations dashboard for confirmed departure handoffs and readiness signals.
- `sales`: Sales portal, expert inquiries, quotation builder, and customer bookings.
- `marketing`: Campaigns, promotional banners, and lead acquisition analytics.

Once created, log in at [http://localhost:5173/login](http://localhost:5173/login) using your credentials.

---

## Onboarding Checklist

Use this checklist to confirm your environment is ready for feature development:

- [ ] Node.js version is `^20.19.0 || >=22.12.0` (`node -v`)
- [ ] npm version is `>=10.0.0` (`npm -v`)
- [ ] Git cloned and working on a clean branch (`git status`)
- [ ] Backend dependencies installed via `npm ci` (in `backend/`)
- [ ] Frontend dependencies installed via `npm ci` (in `frontend/`)
- [ ] `backend/.env` created from `backend/.env.example`
- [ ] `frontend/.env` created from `frontend/.env.example`
- [ ] Valid `JWT_SECRET` generated (32+ characters)
- [ ] `MONGODB_URI` added to `backend/.env`
- [ ] Backend running on [http://localhost:5000](http://localhost:5000)
- [ ] Backend readiness verified at [http://localhost:5000/api/readiness](http://localhost:5000/api/readiness)
- [ ] Frontend running on [http://localhost:5173](http://localhost:5173)
- [ ] Homepage loads in browser without console errors
- [ ] Optional: Staff user created via `npm run staff:create`
- [ ] All tests passing: `npm run test:staff-foundation` (frontend) and `npm run test:quotation-v2` (backend)

You are now fully onboarded and ready to contribute! See [CONTRIBUTING.md](CONTRIBUTING.md) for branch and pull request guidelines.
