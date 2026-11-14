# iOS Security Lab dashboard

A React, TypeScript, and Vite dashboard for synthetic iOS security-lab test records, with Supabase Auth and account-isolated cloud persistence.

## Environment variables

Set these in Vercel for the `dashboard` project, for Preview and Production as appropriate:

- `VITE_SUPABASE_URL`: Supabase Project URL.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: the public `sb_publishable_...` key.

Never use a Supabase secret or service-role key in the browser. The project uses Supabase Auth and RLS to restrict every row to its authenticated owner.

## Local development

```sh
npm install
npm run dev
```

## Build

```sh
npm run build
npm run preview
```

## Authentication

The dashboard provides email/password sign-up and sign-in with Supabase Auth. If email confirmations are enabled, users must confirm the address before signing in. Configure the Supabase Auth Site URL to the deployed Dashboard origin and add the exact Vercel preview/production origins to the redirect URL allow list.

## Data and privacy

The initial rows in `src/data/demo-runs.json` are synthetic demonstration records and remain local static fixtures. Imported records are validated against the version-1 JSON envelope before they are inserted into `public.lab_runs`. Each row stores the authenticated owner's user ID and the full validated record as JSONB. Row Level Security enforces ownership at the database layer. Records survive sign-in from other devices for the same account.

The optional `fingerprint` property is displayed only when supplied in imported JSON. It is never generated, inferred, or collected from a device. An imported record's source marker describes its declared provenance; it does not verify authenticity.

Result statuses are explicit: **PASS** means the authorized test succeeded and its marker matched; **DENIED** is reserved for unavailable authorization; **ERROR** covers malformed records and unrelated test or environment errors.

## iOS result handoff

Lab Writer and Lab Verifier export a version-1 JSON file through the iOS system share sheet. In the Dashboard, select **导入 JSON** to validate that envelope and store its records in Supabase for the currently signed-in account. Use **同步云端** to reload the current account's history after another device or browser has added a record. Individual cloud-imported rows can be deleted without clearing the rest of the account's history; the bulk clear action remains explicit and confirmation-protected.

## Vercel

Set the Vercel project's Root Directory to `dashboard`, Install Command to `npm install`, Build Command to `npm run build`, and Output Directory to `dist`. The app requires the two environment variables above.
