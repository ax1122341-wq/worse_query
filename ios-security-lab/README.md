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

## Signing setup

The project uses the placeholder group `group.com.example.ios-security-lab` and example bundle identifiers (`com.example.ios-security-lab.writer` and `com.example.ios-security-lab.verifier`). Register the App Group for your Apple Developer team, update the group identifier and bundle identifiers consistently in both app targets and entitlements, and configure signing before running on a device.

## Test flow

1. Launch Lab Writer and select **写入合成测试文件**.
2. Launch Lab Verifier and select **读取并验证合成文件**.
3. Use either app's reset action to remove the one fixed test file.
4. Optionally export the Verifier's synthetic run JSON through the system share sheet and import it explicitly into the separate dashboard.

The dashboard does not connect to the apps or receive data automatically.
