# Copilot instructions for worse_query

## Project overview

This repository contains a small security-research demo and a companion dashboard:

- `worse_query/`: the main iOS app. It is a proof-of-concept that demonstrates App Group and filesystem path access behavior. Keep changes aligned with the project’s purpose and avoid turning it into a broader or more invasive exploit.
- `ios-security-lab/`: a separate safe App Group lab project. It intentionally uses a placeholder App Group identifier and explicit result statuses (`PASS`, `DENIED`, `ERROR`). Do not connect it to `worse_query` or create hidden shared behavior.
- `dashboard/`: a Vite + React + TypeScript app used to inspect imported synthetic App Group test records. The app is client-side only and has no backend or telemetry.

This repo is educational and intentionally scoped. Prefer small, precise updates that preserve the original demo behavior and documentation.

## Architecture and conventions

### iOS app (`worse_query/`)

- The app is a SwiftUI app with Objective-C bridging (`worse_query-Bridging-Header.h`, `.m` files, and `pathleak.*`).
- When editing app logic, keep the existing Objective-C/Swift interop structure intact and prefer minimal patching over structural rewrites.
- Maintain the app’s existing App Group and filesystem-path assumptions unless the task explicitly requires a change. Do not add unrelated privilege escalation or bypass logic.
- Validate changes with the project’s existing Xcode build/test flow on macOS when possible. This repo is not meant to be built in a Linux-only environment.

### Security lab (`ios-security-lab/`)

- Treat the lab as a documented, benign validation project. Do not mix its logic into `worse_query`.
- Keep placeholder identifiers and entitlements consistent when modifying signing or App Group values.
- Preserve the explicit status semantics documented in the project README: `PASS`, `DENIED`, and `ERROR` are intentionally distinct.

### Dashboard (`dashboard/`)

- Use React, TypeScript, and Vite conventions. Favor typed updates and small component-level changes.
- Do not introduce backend APIs, telemetry, browser fingerprinting, or automatic uploads.
- Keep synthetic demo data behavior consistent with the README and schema in `src/data/lab-run-v1.schema.json`.
- Run validation with the project scripts defined in `dashboard/package.json`.

## Coding guidelines

- Prefer surgical changes. Do not broaden scope or refactor unrelated code.
- Keep comments factual and minimal; avoid speculative commentary.
- Update documentation when behavior changes, especially if a README, schema, or status semantics change.
- Preserve the repo’s educational, privacy-preserving, and explicit-status model. Do not add hidden or implicit data collection.
- When touching App Group settings or entitlement data, update all related identifiers and keep the naming consistent across app targets and entitlements.

## Validation

### Dashboard

From the repo root or within `dashboard/`:

```sh
cd dashboard
npm ci
npm run build
```

### iOS app

Use Xcode or an Apple toolchain on macOS for an app build, because this project targets iOS and uses Xcode project files.

## No-go rules

- Do not add a backend, database, or remote service to the dashboard.
- Do not quietly widen filesystem access beyond the project’s documented behavior.
- Do not introduce hidden malicious behaviors or “real” exploitation paths under the guise of a fix.
- Do not drift away from the project’s safe, documented demo purpose.
