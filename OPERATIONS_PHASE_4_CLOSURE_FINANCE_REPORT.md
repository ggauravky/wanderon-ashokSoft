# Operations Phase 4 — Closure, Costs, Settlements & Reports

Phase 4 completes the operational lifecycle without changing Booking, Trip, quotation, customer-payment, or creator-finance authority.

## Financial architecture

`OperationalCost` records what a journey factually owes. `OperationalSettlement` is an append-only record of an external payment against one finalized cost. Settlements never increase operational cost. Reports use finalized costs only, show Draft values separately, and derive paid, outstanding, and overdue balances from recorded settlements.

All authoritative values are INR. The backend calculates `totalAmount = subtotal + taxAmount + adjustmentAmount`, rejects invalid or negative totals, locks financial fields after finalization, and preserves correction history through reasoned voids. A hidden atomic settlement claim on the cost prevents concurrent final-balance entries from overpaying the record; the claim is released when a settlement is voided.

Gross Operational Contribution is defined as Booked Revenue minus Finalized Operational Cost. It is an operational contribution metric, not accounting net profit, and excludes salaries, office overhead, marketing, taxes, platform fees, and other general costs. Booking revenue comes only from `Booking.pricing.finalAmount` and collected revenue from `Booking.pricing.amountPaid`.

## Feedback and closure

`OperationalFeedback` stores one current factual record per Operational Trip and Booking. Ratings are optional and limited to 1–5; missing ratings do not count as zero. Customer snapshots contain only name and Booking ID.

`OperationalTripClosure` owns a separate OPEN/CLOSED lifecycle. Closure readiness is derived centrally: the journey must have ended, required services must be CONFIRMED or CANCELLED, tasks must be terminal, Incidents resolved or closed, and no Draft costs may remain. Feedback is optional. Outstanding Vendor balances require explicit acknowledgement and a meaningful settlement plan but do not otherwise block closure.

Closing stores a privacy-limited final snapshot and locks normal Phase 2–4 mutations through the shared `assertOperationalTripOpen` server guard. Reads remain available. Only Admin and Super Admin may reopen, with a reason; prior closure snapshots remain in history.

## Reports and UI

Trip Execution adds `Costs & Settlements` and `Feedback & Closure` tabs. Global staff routes add `/staff/operations/settlements` and `/staff/operations/reports`. The dashboard adds closure-ready, outstanding Vendor, overdue Vendor, and Draft-cost secondary metrics.

Report date meanings are explicit: trip volume uses the travel window/departure date, closure uses `closedAt`, costs use `incurredAt`, and settlements use `paidAt`. Vendor, task, Incident, financial, and feedback summaries use only factual stored data; no sentiment, quality score, or payment execution is inferred.

## Security and regression boundary

All Phase 4 endpoints require authentication plus explicit Operations permissions. Sales, Marketing, customers, and creators cannot access Operations finance. Documents remain internal. No Razorpay Vendor payout, bank API, public feedback form, creator payout, commission, or wallet behavior was added.

`backend/test_operations_phase4.js` covers cost math and immutability, settlement derivation and overpayment, void behavior, financial no-double-count rules, feedback validity and coverage, closure blockers and acknowledgement, closed snapshots, reopen RBAC, Vendor reporting, and report definitions.
