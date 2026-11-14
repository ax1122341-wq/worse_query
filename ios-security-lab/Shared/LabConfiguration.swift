import Foundation

enum LabConfiguration {
    static let appGroupIdentifier = "group.com.example.ios-security-lab"
    static let fixtureFileName = "synthetic-app-group-fixture.json"
    static let fixtureMarker = "IOS_SECURITY_LAB_SYNTHETIC_FIXTURE_V1"
    static let exportSchemaVersion = 1

    static func timestamp(_ date: Date = Date()) -> String {
        ISO8601DateFormatter().string(from: date)
    }
}
