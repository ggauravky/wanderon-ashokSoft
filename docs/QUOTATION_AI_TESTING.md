# Quotation Smart Builder testing

## Configuration

Set backend-only `GEMINI_API_KEY`, `GEMINI_MODEL`, and optionally `QUOTATION_AI_MODEL` / `QUOTATION_AI_FALLBACK_MODEL`. Do not copy secret values into the frontend. On Render, update the variables and redeploy or restart the backend. Verify with:

```text
cd backend
npm run test:gemini
```

The command performs one tiny structured request and prints a safe PASS/FAIL line. It never prints the key, prompt, customer identity, or generated copy.

For local sample controls, set `VITE_ENABLE_QUOTATION_AI_DEMOS=true` in the frontend environment. Keep it false for normal production deployments.

## Demo data

Set `DEMO_QUOTATION_STAFF_EMAIL` to an existing active Admin, Super Admin, or Sales account, then run `npm run seed:quotation-ai-demo`. The idempotent command creates explicitly marked synthetic itinerary, lead-linked, and shared-plan records and contains no real customer data. It refuses `NODE_ENV=production`.

Remove only those marked records with `npm run cleanup:quotation-ai-demo`.

## Fast manual flow

1. In AI Planner, choose **Copy for Quotation**.
2. Open a new Quotation V2 draft and choose **Paste itinerary JSON**.
3. Choose **Paste from Clipboard**, then **Preview**.
4. Review auto-fill, candidate, and manual-work summaries.
5. Choose **Quick Build safe fields**. Hotel, activity, and transport candidates remain unselected; pricing remains unchanged.
6. Use **Generate missing copy** only after checking AI status, review the generated preview, and apply it explicitly.
7. Fill safe policy defaults, save, refresh, preview all three PDF templates, and complete public-view and booking-conversion regression checks.

## Automated regression

```text
cd backend
npm run test:quotation-ai
npm run test:quotation-v2
npm run test:payment-reliability
npm run test:operations-phase1
npm run test:operations-phase2
npm run test:operations-phase3

cd ../frontend
npm run test:quotation-smart-builder
npm run test:staff-foundation
npm run lint
npm run build
```
