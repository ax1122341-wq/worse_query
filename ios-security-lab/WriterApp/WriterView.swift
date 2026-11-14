import SwiftUI

struct WriterView: View {
    @State private var status = "准备就绪"
    private let store = AppGroupStore()

    var body: some View {
        NavigationStack {
            Form {
                Section("合成 App Group 测试") {
                    Text("仅在已授权的实验 App Group 中创建一个固定名称的合成 JSON 文件。")
                        .foregroundStyle(.secondary)
                    Button("写入合成测试文件", action: writeFixture)
                    Button("重置测试文件", role: .destructive, action: resetFixture)
                }

                Section("状态") {
                    Text(status)
                        .textSelection(.enabled)
                }

                Section("安全边界") {
                    Text("此应用只访问实验 App Group 中的固定测试文件，不访问其他容器或路径。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Lab Writer")
        }
    }

    private func writeFixture() {
        let start = Date()
        do {
            let fixture = try store.writeFixture()
            let duration = Int(Date().timeIntervalSince(start) * 1_000)
            status = "READY：合成文件已写入（\(duration) ms）。请在 Verifier 应用中运行验证。测试运行 ID：\(fixture.runId)"
        } catch let error as AppGroupStoreError {
            status = "\(error.resultStatus.rawValue)：\(error.localizedDescription)"
        } catch {
            status = "ERROR：\(error.localizedDescription)"
        }
    }

    private func resetFixture() {
        do {
            try store.removeFixture()
            status = "已重置固定测试文件。"
        } catch {
            status = "重置失败：\(error.localizedDescription)"
        }
    }
}
