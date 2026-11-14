import SwiftUI
import UniformTypeIdentifiers

private struct SyntheticFixture: Decodable {
    let schemaVersion: Int
    let marker: String
    let runId: String
    let createdAt: String
}

struct VerifierView: View {
    @State private var status = "等待导入 Writer 导出的合成 JSON"
    @State private var showingImporter = false
    @State private var exportURL: URL?
    @State private var latestRecord: LabRunRecord?

    @State private var cloudEmail = ""
    @State private var cloudPassword = ""
    @State private var cloudStatus = "尚未连接 Supabase。"
    @State private var cloudConnected = false
    @State private var cloudBusy = false

    private let cloudSync = SupabaseCloudSync()

    var body: some View {
        NavigationStack {
            Form {
                Section("手动导入并验证") {
                    Text("先在 Writer 中生成 JSON 并保存到“文件”，再从这里选择该文件。")
                        .foregroundStyle(.secondary)
                    Button("选择合成 JSON 文件") {
                        showingImporter = true
                    }
                }

                Section("验证结果") {
                    Text(status).textSelection(.enabled)
                    if let exportURL {
                        ShareLink(item: exportURL) {
                            Label("导出验证结果 JSON", systemImage: "square.and.arrow.up")
                        }
                    }
                }

                Section("Supabase 云端同步") {
                    if cloudConnected {
                        Label("已连接云端账户", systemImage: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                        Text(cloudEmail).font(.footnote).foregroundStyle(.secondary)
                        Text("连接后，后续验证结果会自动上传。登录会话保存在本机 Keychain。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)

                        if let latestRecord {
                            Button("立即同步最近一条结果") {
                                Task { await uploadRecord(latestRecord) }
                            }
                            .disabled(cloudBusy)
                        }

                        Button("退出云端账户", role: .destructive) {
                            disconnectCloud()
                        }
                        .disabled(cloudBusy)
                    } else {
                        Text("使用与 SECURITY LAB Dashboard 相同的 Supabase 邮箱账户连接。连接成功后，后续验证结果会自动同步。")
                            .font(.footnote)
                            .foregroundStyle(.secondary)
                        TextField("Supabase 登录邮箱", text: $cloudEmail)
                            .textInputAutocapitalization(.never)
                            .keyboardType(.emailAddress)
                            .autocorrectionDisabled()
                        SecureField("Supabase 登录密码", text: $cloudPassword)
                        Button(cloudBusy ? "正在连接…" : "连接并启用自动同步") {
                            Task { await connectCloud() }
                        }
                        .disabled(cloudBusy || cloudEmail.isEmpty || cloudPassword.isEmpty)
                    }

                    Text(cloudStatus)
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                        .textSelection(.enabled)
                }

                Section("安全边界") {
                    Text("仅处理用户通过系统文件选择器主动选择的 JSON 文件，不扫描目录或访问其他应用数据。云端上传只使用公开客户端密钥和当前登录用户的授权令牌，并受数据库 RLS 用户隔离策略限制。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Lab Verifier")
            .fileImporter(
                isPresented: $showingImporter,
                allowedContentTypes: [.json],
                allowsMultipleSelection: false,
                onCompletion: handleImport
            )
            .task {
                await restoreCloudSession()
            }
        }
    }

    private func restoreCloudSession() async {
        do {
            guard let session = try cloudSync.savedSession() else { return }
            cloudEmail = session.email
            cloudConnected = true
            cloudStatus = "已恢复本机 Keychain 中的云端登录会话。"
        } catch {
            cloudStatus = "无法读取已保存的登录会话：\(error.localizedDescription)"
        }
    }

    private func connectCloud() async {
        cloudBusy = true
        cloudStatus = "正在安全连接 Supabase…"
        do {
            let session = try await cloudSync.signIn(email: cloudEmail, password: cloudPassword)
            cloudPassword = ""
            cloudEmail = session.email
            cloudConnected = true
            cloudBusy = false
            cloudStatus = "云端账户已连接。之后完成验证时会自动同步。"
            if let latestRecord {
                await uploadRecord(latestRecord)
            }
        } catch {
            cloudBusy = false
            cloudStatus = "连接失败：\(error.localizedDescription)"
        }
    }

    private func uploadRecord(_ record: LabRunRecord) async {
        cloudBusy = true
        cloudStatus = "正在上传验证结果到 Supabase…"
        do {
            let session = try await cloudSync.upload(record)
            cloudEmail = session.email
            cloudConnected = true
            cloudStatus = "已同步到 Supabase。运行 ID：\(record.runId)"
        } catch {
            cloudStatus = "云端同步失败：\(error.localizedDescription)"
        }
        cloudBusy = false
    }

    private func disconnectCloud() {
        do {
            try cloudSync.signOut()
            cloudConnected = false
            cloudPassword = ""
            cloudStatus = "已退出云端账户；本地验证记录和导出文件不会被删除。"
        } catch {
            cloudStatus = "退出云端账户失败：\(error.localizedDescription)"
        }
    }

    private func handleImport(_ result: Result<[URL], Error>) {
        let start = Date()
        do {
            let urls = try result.get()
            guard let url = urls.first else {
                status = "ERROR：没有选择文件。"
                return
            }
            let hasAccess = url.startAccessingSecurityScopedResource()
            defer {
                if hasAccess { url.stopAccessingSecurityScopedResource() }
            }
            let data = try Data(contentsOf: url)
            let fixture = try JSONDecoder().decode(SyntheticFixture.self, from: data)
            let matches = fixture.schemaVersion == LabConfiguration.exportSchemaVersion
                && fixture.marker == LabConfiguration.fixtureMarker
                && !fixture.runId.isEmpty
            let resultStatus: TestResultStatus = matches ? .pass : .error
            let timestamp = LabConfiguration.timestamp()
            let details = matches
                ? "用户选择的合成 JSON 文件格式正确，标记匹配。"
                : "文件已读取，但版本、标记或运行 ID 不符合预期。"
            let event = LabEvent(
                timestamp: timestamp,
                role: "verifier",
                action: "验证用户导入的合成 JSON",
                status: resultStatus.rawValue,
                details: details
            )
            let record = LabRunRecord(
                runId: fixture.runId,
                status: resultStatus,
                timestamp: timestamp,
                channel: "Verifier-File-Import",
                durationMs: Int(Date().timeIntervalSince(start) * 1_000),
                firstVisit: fixture.createdAt,
                events: [event]
            )
            latestRecord = record
            exportURL = try LabRunExporter.export(record)
            status = "\(resultStatus.rawValue)：\(details) 运行 ID：\(fixture.runId)"

            if cloudConnected {
                Task { await uploadRecord(record) }
            } else {
                cloudStatus = "验证结果已生成。连接 Supabase 账户后，后续结果将自动同步。"
            }
        } catch {
            status = "ERROR：导入或验证失败：\(error.localizedDescription)"
            exportURL = nil
        }
    }
}
