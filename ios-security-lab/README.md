# iOS Security Lab

Two small iOS apps demonstrate a safe, user-directed JSON handoff. They do not import, link, or execute code from the separate `worse_query` project.

## Current app flow

- **Lab Writer** creates a new synthetic JSON fixture with a random run ID in the app's temporary directory. The user exports it using the iOS share sheet and saves it to Files.
- **Lab Verifier** lets the user explicitly select a JSON file with the iOS document picker, validates the schema version and fixed synthetic marker, then creates a version-1 verification record.
- The Verifier can export that record as JSON for manual import into the Dashboard. The same record can also be uploaded directly to Supabase after the user signs in to the existing Dashboard account.

The current user interface uses the system share sheet and document picker. It does not scan folders or access another app's private container. The older `AppGroupStore` helper remains in the project as a separate, unused sample and is not required for the current file-based flow.

## Result statuses

- **PASS** means the user-selected synthetic JSON has the expected version and marker.
- **DENIED** is reserved for an explicitly unavailable authorization/container.
- **ERROR** covers missing, malformed, mismatched, or unreadable test data and other test/environment errors.

The exported JSON envelope has `schemaVersion: 1`; timestamps use ISO 8601. Dashboard imports validate this schema before saving records.

## Optional authenticated cloud sync

Open **Lab Verifier → Supabase 云端同步** and sign in using the same Supabase email/password account used by SECURITY LAB Dashboard. The password is sent directly to Supabase Auth over HTTPS; it is not stored by the app. After a successful sign-in:

- The session is saved in the iOS Keychain, using device-only accessibility.
- The Verifier automatically uploads each subsequent verification result.
- A refresh token is used to renew an expired access token.
- A manual retry is available for the most recent result if an upload fails.
- Sign-out attempts to revoke the remote session and clears the local Keychain session.

The native app contains only the public Supabase publishable key. Each upload also carries the signed-in user's JWT and owner ID; PostgreSQL Row Level Security restricts rows to that authenticated user. Inserts are idempotent for the same `(owner_id, run_id)` pair. Do not put a Supabase secret or service-role key in an iOS app.

The sync only sends the synthetic result derived from the JSON file the user explicitly selected. It does not collect device identifiers, inspect other apps' data, or access protected iOS containers. Never share the account password, access token, refresh token, or verification code in chat.

## Build and signing

GitHub Actions builds unsigned device IPA files and runs the iOS Simulator unit tests. The generated IPA files are not signed and must be signed on the user's own computer using their own Apple account. The app targets use example bundle IDs; replace these with bundle identifiers registered to the signing team before creating a long-lived personal build.

The current file-based workflow does not require the App Groups entitlement. The project retains an unused example App Group helper, but the two visible app flows do not call it. Do not attempt to bypass Apple's entitlement or provisioning checks.

## Test flow

1. Launch Lab Writer and generate a synthetic JSON file.
2. Save it to the iOS Files app through the share sheet.
3. Launch Lab Verifier and select that file through the document picker.
4. Optionally connect the existing Dashboard account in the Verifier's Supabase section to enable automatic upload of future verification results.
5. Alternatively, export the verification result JSON and import it manually through Dashboard's **导入 JSON** button.
