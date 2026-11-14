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

The initial rows in `src/data/demo-runs.json` are synthetic demonstration records. JSON imports are validated against `src/data/lab-run-v1.schema.json` and saved in the current browser's localStorage under a versioned application key. Imported records survive page refreshes in the same browser and origin. Clearing site data, changing browsers/origins, or disabling browser storage can remove or prevent persistence. Export downloads a JSON file locally. There is no backend, database, telemetry, browser detection, device fingerprinting, or automatic data upload.

The optional `fingerprint` property is displayed only when supplied in imported JSON. It is never generated, inferred, or collected from a device. Older schema-version-1 exports without this optional property remain importable. An imported record's source marker describes its declared provenance; it does not verify authenticity.

Result statuses are explicit: **PASS** means the authorized App Group read succeeded and its marker matched; **DENIED** is reserved for unavailable App Group authorization or an explicit permission-denied read; **ERROR** covers missing fixtures, marker mismatches, malformed records, and unrelated test or environment errors.

## Vercel

Create a Vercel project connected to this repository and set its Root Directory to `dashboard`. Vercel can auto-detect Vite. Use `npm ci` as the install command, `npm run build` as the build command, and `dist` as the output directory. `vercel.json` rewrites test-detail routes to the client app. No environment variables or backend services are required.
