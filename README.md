# WanderLuxe

> High-performance luxury travel and expedition management platform.

WanderLuxe is a full-stack modern travel platform featuring curated experiential itineraries, an enterprise custom quotation builder (Quotation V2), end-to-end Razorpay payments with instant verification, an Operations execution, coordination, Incident, and Vendor workspace, and an AI-driven itinerary planner powered by Google Gemini.

---

## Architecture at a Glance

WanderLuxe uses a clean, decoupled architecture:

```text
Browser (Traveler / Staff)
        │
        ▼
React 19 SPA (Vite 8) ──────[ Local Proxy: /api ]──────► Express REST API (Port 5000)
(Port 5173 / strictPort)                                     │
                                                             ├─► MongoDB Atlas
                                                             ├─► Razorpay (Payments)
                                                             ├─► Google Gemini (AI Planner)
                                                             ├─► Cloudinary (Media CDN)
                                                             ├─► Brevo (Email OTP)
                                                             └─► Twilio (WhatsApp E-Ticket)
```

- **Frontend**: React 19 SPA built with Vite 8 and Tailwind CSS, featuring luxury visual aesthetics, role-based staff views, and client-side PDF document generation.
- **Backend**: Node.js 22 LTS REST API server built with Express 4 and Mongoose 8, featuring strict RBAC, idempotent trip execution materialization, cryptographic signature validation, and resilient fail-closed database connectivity.
- **Persistence**: MongoDB Atlas with additive schema versioning and compound indexes.
- **Operations**: Phase 1 supplies the live Booking/Trip departure read model; Phase 2 persists service execution and Vendors; Phase 3 persists human tasks, factual customer communication history, and auditable Incident lifecycles without changing service-readiness semantics.

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 8, React Router 7, Tailwind CSS, Lucide React, Framer Motion |
| **Backend** | Node.js 22 LTS, Express 4, Mongoose 8, JWT, bcryptjs |
| **Database** | MongoDB Atlas |
| **Payments** | Razorpay SDK (Order API, Checkout, Webhooks, HMAC SHA-256) |
| **AI Planner** | Google Generative AI (`gemini-1.5-flash`) |
| **Media & CDN** | Cloudinary SDK (with local disk `./uploads` fallback for dev) |
| **Notifications** | Brevo v3 (Transactional Email / OTP), Twilio (WhatsApp) |
| **Testing** | Node Native Test Runner (`node --test`), Oxlint |

---

## Repository Structure

```text
wanderon-ashokSoft/
├── backend/            # Express REST API server (Port 5000)
│   ├── config/         # Database and runtime environment validation
│   ├── controllers/    # API request handlers
│   ├── middlewares/    # JWT auth and RBAC guards
│   ├── models/         # Mongoose data schemas
│   ├── routes/         # Express endpoint definitions
│   ├── scripts/        # Migration, diagnostics, and staff creation tools
│   ├── services/       # Core business logic (pricing, Razorpay, emails)
│   └── package.json    # Backend dependencies and test scripts
├── frontend/           # React 19 SPA client (Port 5173)
│   ├── src/            # Components, pages, contexts, quotation UI, staff center
│   ├── public/         # Static web assets
│   ├── vite.config.js  # Vite server config (strictPort: 5173, /api proxy)
│   ├── vercel.json     # SPA routing rewrite rules for Vercel
│   └── package.json    # Frontend dependencies and build scripts
├── docs/               # Authoritative engineering documentation
├── scripts/            # Root validation and data integrity suites
├── .nvmrc              # Pinned Node version (22)
├── .node-version       # Pinned Node version (22)
└── .gitattributes      # Cross-platform LF line endings
```

---

## Quick Start (Two Terminals)

### 1. Prerequisites
- **Node.js**: `^20.19.0 || >=22.12.0` (Recommended: **Node 22 LTS** via `.nvmrc`)
- **npm**: `>=10.0.0`
- **Git**

### 2. Terminal 1: Backend
```bash
# macOS / Linux (Bash / Zsh):
cd backend
npm ci
cp .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm run dev

# Windows (PowerShell):
cd backend
npm ci
Copy-Item .env.example .env
# Set MONGODB_URI and JWT_SECRET in .env
npm run dev
```

### 3. Terminal 2: Frontend
```bash
# macOS / Linux (Bash / Zsh):
cd frontend
npm ci
cp .env.example .env
npm run dev

# Windows (PowerShell):
cd frontend
npm ci
Copy-Item .env.example .env
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## Development URLs

| Service / Endpoint | URL | Purpose |
| :--- | :--- | :--- |
| **Frontend Web App** | [http://localhost:5173](http://localhost:5173) | Main traveler and staff web interface |
| **Backend API Root** | [http://localhost:5000](http://localhost:5000) | Express REST API server |
| **Backend Liveness Probe** | [http://localhost:5000/health](http://localhost:5000/health) | Process liveness check |
| **Backend Readiness Probe** | [http://localhost:5000/api/readiness](http://localhost:5000/api/readiness) | Database readiness check (HTTP 200 = ready, 503 = offline) |
| **Vite Dev Proxy** | [http://localhost:5173/api](http://localhost:5173/api) | Proxies requests from client to backend port 5000 |

---

## Common Commands

### Frontend (`cd frontend`)
```bash
npm run dev                    # Start Vite development server (port 5173, strictPort)
npm run build                  # Production bundle build to dist/
npm run lint                   # Run Oxlint static analysis
npm run test:staff-foundation  # Run staff RBAC navigation unit tests
npm run preview                # Preview production build locally
```

### Backend (`cd backend`)
```bash
npm run dev                    # Start Express with native watcher (--watch)
npm start                      # Production server start
npm run test:quotation-v2      # Run Quotation V2 engine unit tests
npm run test:payment-reliability # Run Razorpay HMAC crypto & math tests
npm run test:razorpay          # Run Razorpay test mode connectivity check
npm run payment:inspect -- <id># Inspect booking payment state (read-only diagnostic)
npm run staff:create           # Provision staff user (reads STAFF_* env vars)
npm run quotations:v2:migrate  # Idempotent database schema migration
```

---

## Documentation

Comprehensive engineering documentation is available in the `docs/` directory:

- 📖 [**Development Setup & Onboarding**](docs/DEVELOPMENT_SETUP.md): Step-by-step setup guide for Windows (PowerShell), macOS (Intel/Apple Silicon), and Linux.
- 🔑 [**Environment Variables Reference**](docs/ENVIRONMENT_VARIABLES.md): Complete catalog of required and optional configuration keys.
- 🏛️ [**System Architecture & Design**](docs/ARCHITECTURE.md): Request lifecycles, authentication, RBAC, Quotation V2, and payment workflows.
- 🧪 [**Testing & Diagnostics**](docs/TESTING.md): Test classifications, safety rules, and validation commands.
- 🤝 [**Contributing Guidelines**](docs/CONTRIBUTING.md): Git branch conventions, line endings, case sensitivity rules, and PR checklists.
- 🛠️ [**Troubleshooting Guide**](docs/TROUBLESHOOTING.md): Solutions for port conflicts, MongoDB DNS SRV issues, and session debugging.
- 🚀 [**Deployment Operations**](docs/DEPLOYMENT.md): Production setup for Vercel (frontend), Render (backend), and Razorpay live webhooks.

---

## Deployment

- **Frontend**: Hosted on [Vercel](https://vercel.com/) (Root: `frontend`, Build: `npm run build`, Output: `dist`, SPA rewrite in `vercel.json`).
- **Backend**: Hosted on [Render](https://render.com/) (Root: `backend`, Build: `npm ci`, Start: `npm start`, Health Check: `/health`).
- **Database**: Managed on [MongoDB Atlas](https://www.mongodb.com/atlas).

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full configuration details.

---

## Security

- **Client-Side Security Boundary**: Any variable in `frontend/.env` prefixed with `VITE_` is visible in client-side bundles. **Never** put database URIs, JWT secrets, or payment secrets in `frontend/.env`.
- **Secret Sharing**: Never share secrets via Git, public channels, issues, or screenshots. Obtain development credentials through the team's approved password manager.
- **Fail-Closed Architecture**: Unauthenticated requests, missing database connections, and invalid signatures fail closed with strict HTTP status codes.
