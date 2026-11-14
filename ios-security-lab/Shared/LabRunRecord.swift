import Foundation

struct LabRunRecord: Codable, Equatable {
    let recordType: String
    let source: String
    let runId: String
    let status: TestResultStatus
    let timestamp: String
    let browser: String?
    let channel: String
    let anonymousId: String
    let durationMs: Int
    let firstVisit: String
    let events: [LabEvent]

    init(
        runId: String,
        status: TestResultStatus,
        timestamp: String,
        channel: String,
        durationMs: Int,
        firstVisit: String,
        events: [LabEvent]
    ) {
        self.recordType = "test"
        self.source = "ios-security-lab"
        self.runId = runId
        self.status = status
        self.timestamp = timestamp
        self.browser = "不适用（原生 iOS）"
        self.channel = channel
        self.anonymousId = UUID().uuidString.lowercased()
        self.durationMs = max(0, durationMs)
        self.firstVisit = firstVisit
        self.events = events
    }
}
