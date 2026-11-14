import Foundation

enum TestResultStatus: String, Codable, Equatable {
    case pass = "PASS"
    case denied = "DENIED"
    case error = "ERROR"
}
