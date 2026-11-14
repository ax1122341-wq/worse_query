import Foundation

struct LabEvent: Codable, Equatable {
    let timestamp: String
    let role: String
    let action: String
    let status: String
    let details: String

    init(
        timestamp: String,
        role: String,
        action: String,
        status: String,
        details: String
    ) {
        self.timestamp = timestamp
        self.role = role
        self.action = action
        self.status = status
        self.details = details
    }
}
