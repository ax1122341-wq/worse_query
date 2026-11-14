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
                Section("安全边界") {
                    Text("仅处理用户通过系统文件选择器主动选择的 JSON 文件，不扫描目录或访问其他应用数据。")
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
        }
    }

    private func handleImport(_ result: Result<[URL], Error>) {
        let start = Date()
        let firstVisit = LabConfiguration.timestamp(start)
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
            exportURL = try LabRunExporter.export(record)
            status = "\(resultStatus.rawValue)：\(details) 运行 ID：\(fixture.runId)"
        } catch {
            status = "ERROR：导入或验证失败：\(error.localizedDescription)"
            exportURL = nil
        }
    }
}
