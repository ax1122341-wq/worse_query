# iOS Security Lab dashboard

A client-side React, TypeScript, and Vite dashboard for synthetic App Group test records.

## Local development

```sh
npm ci
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Data and privacy

The initial rows in `src/data/demo-runs.json` are synthetic demonstration records. JSON imports are validated against `src/data/lab-run-v1.schema.json` and kept in memory only. They are lost when the page is refreshed or closed. Export downloads a JSON file locally. There is no backend, database, telemetry, browser detection, device fingerprinting, or automatic data upload.

An imported record's source marker describes its declared provenance; it does not verify authenticity.

Result statuses are explicit: **PASS** means the authorized App Group read succeeded and its marker matched; **DENIED** is reserved for unavailable App Group authorization or an explicit permission-denied read; **ERROR** covers missing fixtures, marker mismatches, malformed records, and unrelated test or environment errors.

## Vercel

Create a Vercel project connected to this repository and set its Root Directory to `dashboard`. Vercel can auto-detect Vite. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory. `vercel.json` rewrites test-detail routes to the client app. No environment variables or backend services are required.
