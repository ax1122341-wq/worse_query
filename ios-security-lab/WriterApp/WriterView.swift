import SwiftUI
import UniformTypeIdentifiers

private struct SyntheticFixture: Codable {
    let schemaVersion: Int
    let marker: String
    let runId: String
    let createdAt: String
}

struct WriterView: View {
    @State private var status = "准备就绪"
    @State private var exportURL: URL?

    var body: some View {
        NavigationStack {
            Form {
                Section("合成 JSON 测试文件") {
                    Text("生成一份仅含固定合成标记的 JSON 文件。通过 iOS 分享菜单保存到“文件”，再由 Verifier 手动导入。")
                        .foregroundStyle(.secondary)
                    Button("生成并导出合成 JSON", action: createFixture)
                    if let exportURL {
                        ShareLink(item: exportURL) {
                            Label("分享 / 保存测试文件", systemImage: "square.and.arrow.up")
                        }
                    }
                }
                Section("状态") {
                    Text(status).textSelection(.enabled)
                }
                Section("安全边界") {
                    Text("只生成应用自己创建的合成 JSON 文件；不访问其他应用容器、文件或设备数据。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Lab Writer")
        }
    }

    private func createFixture() {
        let fixture = SyntheticFixture(
            schemaVersion: LabConfiguration.exportSchemaVersion,
            marker: LabConfiguration.fixtureMarker,
            runId: UUID().uuidString.lowercased(),
            createdAt: LabConfiguration.timestamp()
        )
        do {
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            let data = try encoder.encode(fixture)
            let url = FileManager.default.temporaryDirectory
                .appendingPathComponent("ios-security-lab-fixture-\(fixture.runId).json")
            try data.write(to: url, options: .atomic)
            exportURL = url
            status = "已生成合成 JSON。请点击“分享 / 保存测试文件”，保存到 iPhone 的“文件”应用。运行 ID：\(fixture.runId)"
        } catch {
            exportURL = nil
            status = "ERROR：生成文件失败：\(error.localizedDescription)"
        }
    }
}
