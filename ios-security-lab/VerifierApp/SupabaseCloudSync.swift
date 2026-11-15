import Foundation
import Security

struct LabCloudSession: Codable {
    let accessToken: String
    let refreshToken: String
    let userID: String
    let email: String
    let expiresAt: Date
}

private struct SupabaseAuthUser: Decodable {
    let id: String
    let email: String?
}

private struct SupabaseAuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: TimeInterval
    let user: SupabaseAuthUser

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }
}

private struct LabRunInsert: Encodable {
    let owner_id: String
    let run_id: String
    let record: LabRunRecord
}

enum LabCloudSyncError: LocalizedError {
    case notSignedIn
    case invalidURL
    case invalidResponse
    case httpError(Int, String)
    case keychain(OSStatus)

    var errorDescription: String? {
        switch self {
        case .notSignedIn:
            return "请先连接 Supabase 账户。"
        case .invalidURL:
            return "Supabase 服务地址配置无效。"
        case .invalidResponse:
            return "Supabase 返回了无法识别的响应。"
        case .httpError(let status, let message):
            return "Supabase 请求失败（HTTP \(status)）：\(message)"
        case .keychain(let status):
            return "无法安全保存登录会话（Keychain 错误 \(status)）。"
        }
    }
}

/// Uses the project's public publishable key plus a signed-in user's JWT.
/// No service-role or secret key is stored in the iOS application.
final class SupabaseCloudSync {
    private let sessionAccount = "lab-verifier-supabase-session"

    func savedSession() throws -> LabCloudSession? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: sessionAccount,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var item: CFTypeRef?
        let status = SecItemCopyMatching(query as CFDictionary, &item)
        if status == errSecItemNotFound { return nil }
        guard status == errSecSuccess, let data = item as? Data else {
            throw LabCloudSyncError.keychain(status)
        }
        return try JSONDecoder().decode(LabCloudSession.self, from: data)
    }

    func signIn(email: String, password: String) async throws -> LabCloudSession {
        guard !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty,
              !password.isEmpty else {
            throw LabCloudSyncError.httpError(400, "请输入邮箱和密码。")
        }

        let body: [String: String] = [
            "email": email.trimmingCharacters(in: .whitespacesAndNewlines),
            "password": password
        ]
        let session = try await requestAuth(
            path: "/auth/v1/token?grant_type=password",
            body: body
        )
        try store(session)
        return session
    }

    /// Revokes the server-side refresh session when reachable, then always clears
    /// the local Keychain copy so the user is signed out on this device.
    func signOut() async throws {
        var revokeError: Error?

        if let saved = try? savedSession() {
            do {
                var session = saved
                if session.expiresAt <= Date().addingTimeInterval(60) {
                    session = try await requestAuth(
                        path: "/auth/v1/token?grant_type=refresh_token",
                        body: ["refresh_token": session.refreshToken]
                    )
                    try store(session)
                }
                try await revoke(session)
            } catch {
                revokeError = error
            }
        }

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: sessionAccount
        ]
        let status = SecItemDelete(query as CFDictionary)
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw LabCloudSyncError.keychain(status)
        }

        if let revokeError {
            throw revokeError
        }
    }

    private func revoke(_ session: LabCloudSession) async throws {
        guard let url = URL(string: LabConfiguration.supabaseURL + "/auth/v1/logout") else {
            throw LabCloudSyncError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(LabConfiguration.supabasePublishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \\(session.accessToken)", forHTTPHeaderField: "Authorization")

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw LabCloudSyncError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = String(data: data, encoding: .utf8) ?? "请稍后重试。"
            throw LabCloudSyncError.httpError(http.statusCode, detail)
        }
    }

    @discardableResult
    func upload(_ record: LabRunRecord) async throws -> LabCloudSession {
        guard let saved = try savedSession() else {
            throw LabCloudSyncError.notSignedIn
        }

        var session = saved
        if session.expiresAt <= Date().addingTimeInterval(60) {
            session = try await requestAuth(
                path: "/auth/v1/token?grant_type=refresh_token",
                body: ["refresh_token": session.refreshToken]
            )
            try store(session)
        }

        let payload = LabRunInsert(
            owner_id: session.userID,
            run_id: record.runId,
            record: record
        )
        guard let restURL = URL(string: LabConfiguration.supabaseURL + "/rest/v1/lab_runs") else {
            throw LabCloudSyncError.invalidURL
        }
        var components = URLComponents(
            url: restURL,
            resolvingAgainstBaseURL: false
        )
        components?.queryItems = [
            URLQueryItem(name: "on_conflict", value: "owner_id,run_id")
        ]
        guard let url = components?.url else {
            throw LabCloudSyncError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(LabConfiguration.supabasePublishableKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(session.accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("resolution=ignore-duplicates,return=minimal", forHTTPHeaderField: "Prefer")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw LabCloudSyncError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = String(data: data, encoding: .utf8) ?? "请稍后重试。"
            throw LabCloudSyncError.httpError(http.statusCode, detail)
        }

        return session
    }

    private var keychainService: String {
        Bundle.main.bundleIdentifier ?? "ios-security-lab.verifier"
    }

    private func store(_ session: LabCloudSession) throws {
        let data = try JSONEncoder().encode(session)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: sessionAccount
        ]
        let updateAttributes: [String: Any] = [
            kSecValueData as String: data
        ]

        let updateStatus = SecItemUpdate(query as CFDictionary, updateAttributes as CFDictionary)
        if updateStatus == errSecSuccess { return }
        guard updateStatus == errSecItemNotFound else {
            throw LabCloudSyncError.keychain(updateStatus)
        }

        var addQuery = query
        addQuery[kSecValueData as String] = data
        addQuery[kSecAttrAccessible as String] = kSecAttrAccessibleAfterFirstUnlockThisDeviceOnly
        let addStatus = SecItemAdd(addQuery as CFDictionary, nil)
        guard addStatus == errSecSuccess else {
            throw LabCloudSyncError.keychain(addStatus)
        }
    }

    private func requestAuth(
        path: String,
        body: [String: String]
    ) async throws -> LabCloudSession {
        guard let url = URL(string: LabConfiguration.supabaseURL + path) else {
            throw LabCloudSyncError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(LabConfiguration.supabasePublishableKey, forHTTPHeaderField: "apikey")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw LabCloudSyncError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let detail = String(data: data, encoding: .utf8) ?? "请检查账户信息后重试。"
            throw LabCloudSyncError.httpError(http.statusCode, detail)
        }

        let decoded = try JSONDecoder().decode(SupabaseAuthResponse.self, from: data)
        return LabCloudSession(
            accessToken: decoded.accessToken,
            refreshToken: decoded.refreshToken,
            userID: decoded.user.id,
            email: decoded.user.email ?? "",
            expiresAt: Date().addingTimeInterval(decoded.expiresIn)
        )
    }
}
