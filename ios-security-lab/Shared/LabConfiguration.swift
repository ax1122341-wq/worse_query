import Foundation

enum LabConfiguration {
    static let appGroupIdentifier = "group.com.example.ios-security-lab"
    static let fixtureFileName = "synthetic-app-group-fixture.json"
    static let fixtureMarker = "IOS_SECURITY_LAB_SYNTHETIC_FIXTURE_V1"
    static let exportSchemaVersion = 1

    // Publishable keys are intended for public client applications.
    // Access to lab_runs is still restricted by the signed-in user's JWT and RLS.
    static let supabaseURL = "https://puyairjblnogzmbrtpmw.supabase.co"
    static let supabasePublishableKey = "sb_publishable_GYVTHR9oEVagA85N4Iah1Q_G8cQ4kMN"

    static func timestamp(_ date: Date = Date()) -> String {
        ISO8601DateFormatter().string(from: date)
    }
}
