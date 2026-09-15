# WanderLuxe Application Screens & Route Architecture

This document tracks the canonical application routes, staff workspaces, and accessibility matrix for WanderLuxe.

---

## Staff & Administrative Workspaces

| Route | Workspace Name | Allowed Roles | Description |
| :--- | :--- | :--- | :--- |
| `/staff/sales` | **WanderLuxe Sales Desk (Canonical)** | `sales`, `admin`, `super_admin` | **Canonical Sales Workspace**. Shared Sales Queue for Travel Expert Requests (`callback_request`). Real-time shared queue KPIs, last activity attribution, direct call/WhatsApp integration, stage progression, quotation builder access. |
| `/admin/sales` | **Legacy Sales Route (Redirect)** | All | **Backwards-Compatible Redirect**. Uses `<Navigate to="/staff/sales" replace />` to seamlessly forward legacy bookmarks and links to the canonical `/staff/sales` workspace. |
| `/admin/login` | **Staff Portal Login Gateway** | Public / Staff | Unified authentication gateway for staff members (`admin`, `super_admin`, `sales`). Dynamically routes Sales specialists to `/staff/sales` and Admins to `/admin`. |
| `/admin` | **Master Admin Control Center** | `admin`, `super_admin` | Comprehensive administration dashboard (Analytics, Quotations, Expert Requests, Trip CMS, Media Library, Pages CMS, Bookings & CRM, Creator Approvals, Payouts, Discounts, Users & Roles). If a `sales` user attempts access, they are automatically bounced to `/staff/sales`. |
| `/admin/quotations` | **Quotation Builder & CRM** | `admin`, `super_admin`, `sales` | Custom quotation and itinerary builder with pricing rules, margin controls, and customer PDF proposal generation. |

---

## Public & Customer Screens

| Route | Page / Feature | Description |
| :--- | :--- | :--- |
| `/` | Homepage | Luxury experiential hero, curated departures, seasonal drops, reviews, and interactive consultation modal. |
| `/trips` | Trip Catalog & Explorer | Searchable and filterable catalog of all active luxury itineraries. |
| `/trips/india` | India Expeditions | Dedicated domestic group departures and curated circuits. |
| `/trips/international` | International Escapes | Curated global group expeditions. |
| `/trips/weekend-trips` | Weekend Getaways | Short luxury retreats and escapes from major metro hubs. |
| `/community-trips` | Community Backpacking | Youth expeditions and group travel circuits. |
| `/trip/:slug` | Trip Detail Experience | 10-step itinerary showcase, day galleries, inclusions, booking engine, and Travel Expert consultation trigger. |
| `/checkout/:slug` | Luxury Booking Checkout | Seat reservation, batch selection, coupon redemption, Razorpay payment gateway. |
| `/booking-success` | Booking Confirmation | Live confirmed booking voucher, travel insurance details, boarding pass download. |
| `/plan` | WanderLuxe AI Trip Planner | Generative custom itinerary planner powered by Google Gemini AI. |
| `/profile` | Traveler Profile & Bookings | User account dashboard, upcoming trips, payment history, and WanderCoins wallet. |
| `/login` | Customer Login & Sign Up | Traveler authentication (email/password, OTP, social login). |
| `/quote/:token` | Customer Quotation Portal | Interactive customer decision portal to review custom pricing, approve, or request revisions. |
| `/partner` | Influencer & Creator Portal | Application and tracking portal for approved travel creators and influencers. |

---

*Last Updated: September 2026 • WanderLuxe Staff Workspace Route Migration*
