import XCTest

final class IOSSecurityLabTests: XCTestCase {
    func testExportUsesVersionOneAndContainsTimestampedStatus() throws {
        let event = LabEvent(
            timestamp: "2026-11-14T07:00:00Z",
            role: "writer",
            action: "synthetic-write",
            status: "INFO",
            details: "Synthetic fixture only."
        )
        let verifierEvent = LabEvent(
            timestamp: "2026-11-14T07:00:01Z",
            role: "verifier",
            action: "synthetic-verify",
            status: "PASS",
            details: "Synthetic marker matched."
        )
        let record = LabRunRecord(
            runId: "test-run",
            status: .pass,
            timestamp: "2026-11-14T07:00:01Z",
            channel: "Verifier",
            durationMs: 120,
            firstVisit: "2026-11-14T07:00:00Z",
            events: [event, verifierEvent]
        )

        let url = try LabRunExporter.export(record)
        addTeardownBlock {
            try FileManager.default.removeItem(at: url)
        }

        let json = try JSONSerialization.jsonObject(with: Data(contentsOf: url))
        let envelope = try XCTUnwrap(json as? [String: Any])
        XCTAssertEqual(envelope["schemaVersion"] as? Int, 1)
        let records = try XCTUnwrap(envelope["records"] as? [[String: Any]])
        let exportedRecord = try XCTUnwrap(records.first)
        XCTAssertEqual(exportedRecord["recordType"] as? String, "test")
        XCTAssertEqual(exportedRecord["source"] as? String, "ios-security-lab")
        XCTAssertEqual(exportedRecord["runId"] as? String, "test-run")
        XCTAssertEqual(exportedRecord["status"] as? String, "PASS")
        XCTAssertEqual(
            exportedRecord["timestamp"] as? String,
            "2026-11-14T07:00:00Z"
        )
    }

    func testOnlyExplicitAuthorizationFailuresAreDenied() {
        XCTAssertEqual(
            AppGroupStoreError.authorizationUnavailable.resultStatus,
            .denied
        )
        XCTAssertEqual(
            AppGroupStoreError.fixtureMissing.resultStatus,
            .error
        )
        XCTAssertEqual(
            AppGroupStoreError.storage(CocoaError(.fileReadCorruptFile)).resultStatus,
            .error
        )
        XCTAssertEqual(
            AppGroupStoreError.storage(CocoaError(.fileReadNoPermission)).resultStatus,
            .error
        )
        XCTAssertEqual(
            AppGroupStoreError.storage(CocoaError(.fileWriteNoPermission)).resultStatus,
            .error
        )
    }
}
