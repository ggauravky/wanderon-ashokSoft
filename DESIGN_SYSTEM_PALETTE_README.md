# WanderLuxe Design System & Color Palette Guide
> **Comprehensive UI/UX Audit & Unified Color System for Customer-Facing Pages & Staff/Admin Dashboards**

---

## 1. Executive Website Review

An exhaustive audit of the codebase (`frontend/src/components`, `frontend/src/pages`, `frontend/src/index.css`, `frontend/tailwind.config.js`, and `frontend/src/App.css`) was conducted across customer journeys, sales consoles, and administrative panels.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CURRENT AUDIT SUMMARY                           │
├──────────────────────┬─────────────────────────────────────────────────┤
│ Brand Identity       │ Discrepancy: WanderOn vs Wanderly vs WanderLuxe │
│ Typography           │ Inter loaded in Tailwind; Plus Jakarta Sans     │
│                      │ imported in CSS but underutilized in headings   │
│ Button Styles        │ Fragmented border-radii (50px, 2xl, xl, md)     │
│ Cards & Surfaces     │ Strong Apple-glass styling; borders vary        │
│ Form Inputs          │ Split between dark slate & light borders        │
│ Color Cohesion       │ 4 competing greens, 3 competing dark navies     │
└──────────────────────┴─────────────────────────────────────────────────┘
```

---

### A. Current UI & Layout Architecture
- **Strengths:** 
  - The layout leverages modern, high-end travel patterns: immersive hero video backgrounds with subtle overlays, floating "Apple-glass" headers (`backdrop-blur-xl`), and rounded responsive cards with micro-animations.
  - Good use of sticky elements (e.g., sticky booking bar on `TripDetails.jsx`, sticky sub-navbars, and quick-filter tabs).
- **Weaknesses:**
  - **Inconsistent Layout Containers:** Pages alternate between `.travel-container` (max-w-7xl), `.travel-container-wide` (max-w-[1440px]), and raw `container mx-auto px-4`.
  - **Surface Inconsistency:** Some customer modals use a dark glassmorphic style (`apple-glass-dark`, `bg-[#0b132b]/85`), while admin modals use plain flat white dialogs (`bg-white rounded-2xl`).

---

### B. Branding & Identity
- **The Core Issue:** There is a 3-way naming and branding discrepancy in the codebase:
  1. `frontend/src/components/Logo.jsx` and `index.html`: Displays **Wanderly** with subtitle *"Where Nature Opens Up"*.
  2. `Navbar.jsx`, `Footer.jsx`, `TripCard.jsx`, `QuotationBuilder`: Branded as **WanderLuxe** (luxury/experiential expedition branding).
  3. Git repository and folders: Titled **wanderon-ashokSoft**.
- **Visual Impact:**
  - The brand logo in `Logo.jsx` uses a bright orange pin (`#f97316`) and `#059669` emerald compass, whereas the top desktop Navbar renders a minimalist emerald box with an icon and `WanderLuxe` typography.
  - **Recommendation:** Standardize on **WanderLuxe** across all public touchpoints and administrative portals to reinforce an elevated, curated expedition brand identity.

---

### C. Typography
- **Current Setup:**
  - `frontend/src/index.css` imports both **Plus Jakarta Sans** (400 to 800) and **Inter** (400 to 700).
  - However, `tailwind.config.js` only configures `sans: ['Inter', 'sans-serif']`. As a result, *Plus Jakarta Sans* is rarely applied, despite being loaded over the network.
- **Hierarchy & Legibility:**
  - Headings frequently overuse `font-black` (weight 900) and `tracking-tight` across `h1`, `h2`, `h3`, and small badge pills (`text-[10px] font-black uppercase`). This can feel visually heavy.
  - Body text is crisp and legible with Inter, but text colors are fragmented across `#1e293b`, `text-slate-900`, `text-slate-700`, `#333`, and `#444`.
- **Recommendation:**
  - Configure `fontFamily.display: ['Plus Jakarta Sans', 'sans-serif']` for titles, hero headers, and destination cards.
  - Retain `fontFamily.sans: ['Inter', 'sans-serif']` for dense UI elements, booking forms, pricing tables, and staff CRM dashboards.

---

### D. Buttons & CTAs
- **Current State:**
  - `App.css` defines pill-shaped buttons with `border-radius: 50px` (e.g., `.contact-btn`, `.hero-cta`).
  - Modern components (`Navbar.jsx`, `TripDetails.jsx`, `CallbackForm.jsx`) use `rounded-2xl` or `rounded-xl`.
  - In `AdminDashboard.jsx`, action buttons shift between `bg-emerald-600`, `bg-indigo-600` (for lead assignment), and `bg-rose-600` (for logout).
- **Hover & Interaction:**
  - Buttons currently have varied hover transitions (some have `hover:-translate-y-1` with shadow elevation, while others only change background color).
- **Recommendation:** Standardize on a unified radius system: `rounded-xl` for dense dashboard buttons and `rounded-2xl` for primary consumer CTAs.

---

### E. Cards & Surfaces
- **Customer Cards (`TripCard.jsx`, `DestinationCard.jsx`):**
  - Well-structured with `rounded-3xl`, subtle slate borders (`border-slate-200/80`), and dual-level shadows on hover.
  - Metadata overlays (weather pills, batch availability, star ratings) are clean and informative.
- **Admin/Staff Cards (`SalesPortal.jsx`, `AdminDashboard.jsx`):**
  - Metric summary cards use varied background colors (`bg-emerald-950/60`, `bg-teal-950/60`, `bg-amber-950/60`, `bg-indigo-950/60`, `bg-purple-950/60`), which creates high visual noise on dashboards.
- **Recommendation:** Adopt consistent surface elevations with neutral borders, reserving vibrant color accents strictly for status pills and KPI trend indicators.

---

### F. Backgrounds & Scaffolding
- **Current Variations:**
  - Main customer layout: `bg-[#f8fafc]` (Slate 50).
  - Admin dashboard: `bg-slate-100/70` (`#f1f5f9`).
  - Sales portal: `bg-slate-950` (`#020617`).
  - Navbar transparent mode & hero overlays: `#0b132b`.
  - Footer: `#080d1e`.
- **Recommendation:** Unify light mode to a single canvas (`#F8FAFC`) and dark mode/admin scaffolding to `#0B132B` and `#0F172A`.

---

### G. Forms & Inputs
- **Current State:**
  - `CallbackForm.jsx`: Dark inputs with `bg-slate-800/80 border-slate-700/80 text-white placeholder-slate-500`.
  - `AdminDashboard.jsx` & `Checkout.jsx`: Light inputs with `bg-slate-50 border-slate-200 text-slate-900`.
  - `App.css` Search Bar: Older styling with `border: 1.5px solid #ddd; border-radius: 50px`.
- **Focus Rings:**
  - Focus rings alternate between `focus:border-emerald-500`, `focus:border-indigo-500`, and default browser outlines.
- **Recommendation:** Establish a single set of form tokens for light and dark contexts with consistent focus rings (`ring-2 ring-emerald-600/20 border-emerald-600`).

---

### H. Overall Visual Style
- **Aesthetic Direction:** **"Outdoor Luxury & Scandinavian Utility"** — balancing the awe of nature with the precision, trust, and cleanliness required for high-value travel transactions.
- **Verdict:** The visual foundation is high quality, but refining color consistency will elevate the platform from a "developer-assembled app" to a cohesive luxury travel brand.

---

## 2. The Unified Minimal Palette (13 Essential Colors)

Designed to feel **premium, modern, clean, travel-focused, and trustworthy**, while maintaining high contrast (WCAG AA/AAA compliance) across customer-facing flows and high-density staff dashboards.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CORE COLOR SPECTRUM                             │
├──────────────────────┬─────────┬───────────────────────────────────────┤
│ 1. Primary Brand     │ #059669 │ Alpine Emerald (Nature & Adventure)   │
│ 2. Secondary         │ #0F766E │ Glacial Teal (Highland Lakes & Fjords)│
│ 3. Accent            │ #D97706 │ Horizon Amber (Golden Hour & Stars)   │
│ 4. Dark / Navy       │ #0B132B │ Midnight Obsidian (Night Sky & Luxury)│
│ 5. Light Background  │ #F8FAFC │ Cloud Canvas (Crisp & Clean)          │
│ 6. Card Background   │ #FFFFFF │ Pure Surface (Elevated Panels)        │
│ 7. Border Color      │ #E2E8F0 │ Mist Slate (Subtle Dividers)          │
│ 8. Primary Text      │ #0F172A │ Deep Charcoal (Maximum Readability)   │
│ 9. Secondary Text    │ #64748B │ Muted Slate (Metadata & Descriptions) │
│ 10. Success          │ #10B981 │ Summit Green (Verified & Paid)        │
│ 11. Warning          │ #F59E0B │ Caution Amber (Urgent & Limited Seats)│
│ 12. Error            │ #EF4444 │ Crimson Coral (Alerts & Overdue)      │
│ 13. Info             │ #0284C7 │ Arctic Blue (Guides & Permits)        │
└──────────────────────┴─────────┴───────────────────────────────────────┘
```

---

### Detailed Color Specifications

| # | Color Name | HEX | RGB | Where It Should Be Used |
|---|------------|-----|-----|-------------------------|
| **1** | **Alpine Emerald** | `#059669` | `rgb(5, 150, 105)` | Primary CTAs, active navigation links, main brand compass logo, hero buttons, key conversion triggers. |
| **2** | **Glacial Teal** | `#0F766E` | `rgb(15, 118, 110)` | Secondary buttons, departure calendar highlights, category tabs, filter pill badges, itinerary day indicators. |
| **3** | **Horizon Amber** | `#D97706` | `rgb(217, 119, 6)` | Golden star ratings, VIP/Featured badges, "Early Bird" departure tags, review highlights. |
| **4** | **Midnight Obsidian** | `#0B132B` | `rgb(11, 19, 43)` | Navbar background, footer canvas, staff portal headers, hero gradient scrims, dark modal overlays. |
| **5** | **Cloud Canvas** | `#F8FAFC` | `rgb(248, 250, 252)` | Default page background for public catalog, trip details, checkout, and admin dashboard body. |
| **6** | **Pure Surface** | `#FFFFFF` | `rgb(255, 255, 255)` | Trip cards, customer quotation cards, dashboard table containers, modal cards, dropdown menus. |
| **7** | **Mist Slate** | `#E2E8F0` | `rgb(226, 232, 240)` | Card boundaries, input borders, divider lines, table cell separators, quotation section dividers. |
| **8** | **Deep Charcoal** | `#0F172A` | `rgb(15, 23, 42)` | Headings (`h1`-`h4`), trip package titles, quotation pricing totals, high-priority table data. |
| **9** | **Muted Slate** | `#64748B` | `rgb(100, 116, 139)` | Subtitles, pickup hub labels, luggage checklist descriptions, durations, timestamp labels. |
| **10** | **Summit Green** | `#10B981` | `rgb(16, 185, 129)` | Verified booking badge, payment success checkmarks, positive profit metrics, coupon active tags. |
| **11** | **Caution Amber** | `#F59E0B` | `rgb(245, 158, 11)` | "Only 2 Seats Left", callback due today, pending KYC verification, quotation awaiting review. |
| **12** | **Crimson Coral** | `#EF4444` | `rgb(239, 68, 68)` | Form validation errors, payment failure notifications, overdue CRM lead badges, cancel booking button. |
| **13** | **Arctic Blue** | `#0284C7` | `rgb(2, 132, 199)` | AI Planner insights, permit requirements, travel advisory notices, weather details, CRM notes. |

---

## 3. UI Component Usage Guidelines

### A. Recommended Button Colors & States
```
Primary Button (Book Now / Request Callback / Create Trip):
- Normal:     Background #059669 | Text #FFFFFF | Border Transparent
- Hover:      Background #047857 | Text #FFFFFF | Shadow 0 10px 20px -5px rgba(5,150,105,0.3)
- Active:     Background #065F46 | Scale 0.98

Secondary Button (View Itinerary / Customize / Filter):
- Normal:     Background #F1F5F9 | Text #0F172A | Border 1px solid #E2E8F0
- Hover:      Background #E2E8F0 | Text #059669 | Border 1px solid #CBD5E1
- Active:     Background #CBD5E1

Ghost / Text Button (Cancel / Share / Learn More):
- Normal:     Background Transparent | Text #64748B
- Hover:      Background #F1F5F9 | Text #0F172A

Danger Button (Delete Trip / Cancel Booking / Reject Application):
- Normal:     Background #FEE2E2 | Text #B91C1C | Border 1px solid #FECACA
- Hover:      Background #EF4444 | Text #FFFFFF
```

---

### B. Navbar Colors
- **Top Bar (Scrolled State):**
  - Surface: `rgba(255, 255, 255, 0.92)` with `backdrop-filter: blur(16px)`
  - Border Bottom: `1px solid rgba(226, 232, 240, 0.8)`
  - Nav Links: `#334155` (Slate 700), Hover: `#059669` (Alpine Emerald)
  - Active Menu Indicator: `Background: rgba(5, 150, 105, 0.08) | Text: #059669`
- **Top Bar (Unscrolled Hero State):**
  - Surface: `linear-gradient(180deg, rgba(11, 19, 43, 0.95) 0%, rgba(11, 19, 43, 0.4) 60%, transparent 100%)`
  - Nav Links: `#FFFFFF`, Hover: `#6EE7B7` (Emerald 300)
- **Mega-Menu Dropdowns:**
  - Card Background: `#FFFFFF` with `box-shadow: 0 20px 40px -10px rgba(15, 23, 42, 0.12)`
  - Border: `1px solid #E2E8F0`
  - Item Hover: `#F8FAFC` with left accent line in `#059669`

---

### C. Footer Colors
- **Canvas:** `#0B132B` (Midnight Obsidian)
- **Border Top:** `1px solid #1E293B`
- **Headings (`h3`, `h4`):** `#F8FAFC` with accent tags in `#34D399`
- **Body & Links:** `#94A3B8`, Hover: `#FFFFFF`
- **VIP Newsletter Card:**
  - Background: `linear-gradient(135deg, #0F172A 0%, #064E3B 100%)`
  - Border: `1px solid rgba(16, 185, 129, 0.25)`
  - Input: `Background #1E293B | Text #FFFFFF | Border #334155 | Focus #059669`
  - Submit Button: `Background #059669 | Text #FFFFFF | Hover #10B981`
- **Social Icons:**
  - Default: `Background #1E293B | Icon #94A3B8`
  - Hover: `Background #059669 | Icon #FFFFFF`

---

### D. Form & Input Colors
- **Input Background (Light Mode):** `#FFFFFF`
- **Input Border (Resting):** `#CBD5E1` (Slate 300)
- **Input Border (Hover):** `#94A3B8` (Slate 400)
- **Input Focus State:**
  - Border: `#059669`
  - Outline/Ring: `0 0 0 3px rgba(5, 150, 105, 0.15)`
- **Placeholder Text:** `#94A3B8`
- **Input Text:** `#0F172A`
- **Error State:**
  - Border: `#EF4444`
  - Ring: `0 0 0 3px rgba(239, 68, 68, 0.15)`
  - Helper Text: `#DC2626`
- **Disabled State:**
  - Background: `#F1F5F9` | Text: `#94A3B8` | Border: `#E2E8F0`

---

### E. Dashboard Colors (Staff Sales CRM & Master Admin)
- **Page Canvas:** `#F8FAFC`
- **Admin Navigation Banner / Top Header:** `#0B132B` with border `#1E293B`
- **Data Table Header:**
  - Background: `#F1F5F9`
  - Text: `#475569` (uppercase, tracking-wider, `font-bold`, `text-[11px]`)
  - Border Bottom: `1px solid #E2E8F0`
- **Data Table Rows:**
  - Background: `#FFFFFF`
  - Alternate Zebra Stripe (Optional): `#F8FAFC`
  - Row Hover: `#F0FDF4` (Light Emerald tint) or `#F1F5F9`
  - Border Bottom: `1px solid #F1F5F9`
- **Metric KPI Cards:**
  - Card Surface: `#FFFFFF`
  - Card Border: `1px solid #E2E8F0`
  - Metric Number: `#0F172A`
  - Trend Pill (+14%): `Background #ECFDF5 | Text #065F46 | Border #A7F3D0`
- **CRM Status Badges:**
  - `NEW`: `Background #EFF6FF | Text #1D4ED8 | Border #BFDBFE`
  - `DUE TODAY`: `Background #FEF3C7 | Text #B45309 | Border #FDE68A`
  - `OVERDUE`: `Background #FEE2E2 | Text #B91C1C | Border #FECACA`
  - `IN PROGRESS`: `Background #F3E8FF | Text #6B21A8 | Border #E9D5FF`
  - `CONVERTED`: `Background #ECFDF5 | Text #047857 | Border #A7F3D0`

---

### F. Dark Mode Design (Clean & Cohesive)
When switching to dark mode, avoid pure `#000000`. Use deep navy slate layers:

- **Canvas Background:** `#070B19` (Deep Night)
- **Surface / Card Background:** `#0B132B` (Midnight Obsidian)
- **Elevated Surface (Modals/Popovers):** `#131C38`
- **Border Color:** `rgba(255, 255, 255, 0.08)`
- **Primary Text:** `#F8FAFC`
- **Secondary Text:** `#94A3B8`
- **Input Background:** `#0F172A`
- **Input Border:** `#1E293B`
- **Primary Brand Button:** `#10B981` with Text `#070B19`

---

## 4. Production-Ready CSS Variables

Add this snippet to `frontend/src/index.css` to instantly standardize tokens across the application:

```css
:root {
  /* ── Core Brand ── */
  --color-primary: #059669;
  --color-primary-hover: #047857;
  --color-primary-light: #ecfdf5;
  --color-secondary: #0f766e;
  --color-secondary-hover: #115e59;
  --color-accent: #d97706;
  --color-accent-light: #fef3c7;

  /* ── Dark Navy & Atmosphere ── */
  --color-dark-navy: #0b132b;
  --color-dark-navy-surface: #0f172a;
  --color-dark-navy-border: #1e293b;

  /* ── Backgrounds & Surfaces ── */
  --color-bg-main: #f8fafc;
  --color-bg-card: #ffffff;
  --color-bg-muted: #f1f5f9;
  --color-bg-overlay: rgba(11, 19, 43, 0.65);

  /* ── Borders & Dividers ── */
  --color-border: #e2e8f0;
  --color-border-subtle: #f1f5f9;
  --color-border-focus: #059669;

  /* ── Typography ── */
  --color-text-primary: #0f172a;
  --color-text-secondary: #64748b;
  --color-text-muted: #94a3b8;
  --color-text-inverse: #ffffff;

  /* ── Status & Feedback ── */
  --color-success: #10b981;
  --color-success-bg: #ecfdf5;
  --color-success-text: #065f46;

  --color-warning: #f59e0b;
  --color-warning-bg: #fffbeb;
  --color-warning-text: #b45309;

  --color-error: #ef4444;
  --color-error-bg: #fef2f2;
  --color-error-text: #b91c1c;

  --color-info: #0284c7;
  --color-info-bg: #f0f9ff;
  --color-info-text: #0369a1;

  /* ── Component Standards ── */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 9999px;

  --shadow-card: 0 2px 12px -2px rgba(15, 23, 42, 0.04);
  --shadow-card-hover: 0 16px 32px -4px rgba(15, 23, 42, 0.08);
  --shadow-dropdown: 0 20px 40px -10px rgba(15, 23, 42, 0.12);
}

/* ── Dark Mode Preset (Optional / System-Ready) ── */
[data-theme="dark"],
.dark {
  --color-bg-main: #070b19;
  --color-bg-card: #0b132b;
  --color-bg-muted: #0f172a;
  
  --color-border: #1e293b;
  --color-border-subtle: #131c38;

  --color-text-primary: #f8fafc;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;

  --color-primary: #10b981;
  --color-primary-hover: #059669;
  --color-primary-light: rgba(16, 185, 129, 0.12);

  --shadow-card: 0 4px 20px -2px rgba(0, 0, 0, 0.35);
  --shadow-card-hover: 0 16px 32px -4px rgba(0, 0, 0, 0.5);
}
```

---

## 5. Tailwind Configuration Extension

To make these tokens immediately usable with Tailwind utility classes (e.g., `bg-brand-primary`, `text-brand-charcoal`), update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          emerald: '#059669',     // Primary Brand
          teal: '#0F766E',        // Secondary
          amber: '#D97706',       // Accent
          navy: '#0B132B',        // Dark Navy
          canvas: '#F8FAFC',      // Light Background
          card: '#FFFFFF',        // Card Background
          border: '#E2E8F0',      // Neutral Border
          charcoal: '#0F172A',    // Primary Text
          slate: '#64748B',       // Secondary Text
          success: '#10B981',     // Success
          warning: '#F59E0B',     // Warning
          error: '#EF4444',       // Error
          info: '#0284C7'         // Info
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
```

---

*WanderLuxe Design System Documentation • Created September 2026*
