import Foundation
import Darwin

struct LabFixture: Codable, Equatable {
    let marker: String
    let runId: String
    let createdAt: String
}

enum AppGroupStoreError: LocalizedError {
    case authorizationUnavailable
    case fixtureMissing
    case storage(Error)

    var errorDescription: String? {
        switch self {
        case .authorizationUnavailable:
            return "实验 App Group 授权不可用。请检查签名与 App Group 权限。"
        case .fixtureMissing:
            return "尚无合成测试文件。请先运行 Writer 应用。"
        case .storage(let error):
            return "访问合成测试文件时发生存储错误：\(error.localizedDescription)"
        }
    }

    var resultStatus: TestResultStatus {
        if case .authorizationUnavailable = self {
            return .denied
        }
        return .error
    }
}

struct AppGroupStore {
    private let fileManager = FileManager.default

    func writeFixture() throws -> LabFixture {
        let fixture = LabFixture(
            marker: LabConfiguration.fixtureMarker,
            runId: UUID().uuidString.lowercased(),
            createdAt: LabConfiguration.timestamp()
        )
        let data = try JSONEncoder().encode(fixture)
        let url = try fixtureURL()
        do {
            try data.write(to: url, options: .atomic)
        } catch {
            throw AppGroupStoreError.storage(error)
        }
        return fixture
    }

    func readFixture() throws -> LabFixture {
        let url = try fixtureURL()
        let data: Data
        do {
            data = try Data(contentsOf: url)
        } catch {
            if Self.isPermissionDenied(error) {
                throw AppGroupStoreError.authorizationUnavailable
            }
            if Self.isMissingFile(error) {
                throw AppGroupStoreError.fixtureMissing
            }
            throw AppGroupStoreError.storage(error)
        }
        return try JSONDecoder().decode(LabFixture.self, from: data)
    }

    func removeFixture() throws {
        let url = try fixtureURL()
        guard fileManager.fileExists(atPath: url.path) else { return }
        do {
            try fileManager.removeItem(at: url)
        } catch {
            throw AppGroupStoreError.storage(error)
        }
    }

    private func fixtureURL() throws -> URL {
        guard
            let container = fileManager.containerURL(
                forSecurityApplicationGroupIdentifier: LabConfiguration.appGroupIdentifier
            )
        else {
            throw AppGroupStoreError.authorizationUnavailable
        }
        return container.appendingPathComponent(
            LabConfiguration.fixtureFileName,
            isDirectory: false
        )
    }

    private static func isPermissionDenied(_ error: Error) -> Bool {
        let nsError = error as NSError
        if nsError.domain == NSCocoaErrorDomain {
            return nsError.code == CocoaError.Code.fileReadNoPermission.rawValue
        }
        if nsError.domain == NSPOSIXErrorDomain {
            return nsError.code == Int(EACCES) || nsError.code == Int(EPERM)
        }
        return false
    }

    private static func isMissingFile(_ error: Error) -> Bool {
        let nsError = error as NSError
        if nsError.domain == NSCocoaErrorDomain {
            return nsError.code == CocoaError.Code.fileReadNoSuchFile.rawValue
        }
        if nsError.domain == NSPOSIXErrorDomain {
            return nsError.code == Int(ENOENT)
        }
        return false
    }
}
