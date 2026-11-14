# iOS Security Lab

This is a separate, safe App Group permission test project. It does not import, link, or execute any source from `worse_query`.

## Apps

- **Lab Writer** writes a single synthetic JSON fixture with a fixed filename into the lab App Group container.
- **Lab Verifier** reads that known fixture through its own matching App Group entitlement and checks the expected marker.
- Both apps expose an explicit reset action. Lab Verifier displays and can export its completed result as JSON. Exported run records use schema version 1, compatible with `dashboard/src/data/lab-run-v1.schema.json`.

The test uses the public `FileManager.containerURL(forSecurityApplicationGroupIdentifier:)` API. It does not enumerate other containers or access paths outside the authorized App Group.

## Result statuses

- **PASS** means Verifier read the authorized App Group fixture and its marker matched.
- **DENIED** is reserved for an unavailable App Group authorization/container or an explicit permission-denied read.
- **ERROR** covers a missing fixture, malformed data, marker mismatch, and other test or environment errors. These are not reported as authorization denials.

The exported JSON envelope has `schemaVersion: 1`; run completion and event timestamps use ISO 8601.

## Signing and Apple account prerequisites

The repository intentionally uses placeholders:
- App Group: `group.com.example.ios-security-lab`
- Writer bundle ID: `com.example.ios-security-lab.writer`
- Verifier bundle ID: `com.example.ios-security-lab.verifier`

These are examples, not registered identifiers. Before a physical-device installation:

1. Use an Apple Developer team that is eligible to register and provision the App Groups capability.
2. Register one App Group identifier for that team in Certificates, Identifiers & Profiles.
3. Register both app identifiers under the same team and enable the same App Groups capability for each.
4. Replace the placeholder App Group identifier consistently in `Shared/LabConfiguration.swift` and both `.entitlements` files. Replace the example bundle identifiers in the two app targets with identifiers registered to that team.
5. Sign both targets with that same team and valid provisioning profiles, then install both apps on the same supported iPhone.

A free Personal Team is useful for basic Xcode device testing, but it does not guarantee access to every advanced capability. If the App Groups capability cannot be enabled for the team, this two-app test cannot be completed on a physical iPhone with that team. Do not try to work around Apple's entitlement checks.

## Build artifact limitations

- The GitHub Actions simulator `.app` output is for an iOS simulator, not a physical iPhone.
- The generic iOS device build is unsigned validation output; it is not an installable IPA.
- A successful compile or simulator test does not prove that the Apple team has granted the App Groups entitlement.
- This repository does not contain Apple account credentials, signing certificates, private keys, or provisioning profiles. Never paste Apple passwords, verification codes, or private signing keys into chat or commit them to the repository.

## Test flow

1. Launch Lab Writer and select **写入合成测试文件**.
2. Launch Lab Verifier and select **读取并验证合成文件**.
3. Use either app's reset action to remove the one fixed test file.
4. Optionally export the Verifier's synthetic run JSON through the system share sheet and import it explicitly into the separate dashboard.

The dashboard does not connect to the apps or receive data automatically.
