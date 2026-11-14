import SwiftUI

struct VerifierView: View {
    @State private var status = "等待 Writer 创建合成测试文件"
    @State private var exportURL: URL?
    private let store = AppGroupStore()

    var body: some View {
        NavigationStack {
            Form {
                Section("验证 App Group 权限") {
                    Text("只读取 Writer 在实验 App Group 中创建的固定合成 JSON 文件。")
                        .foregroundStyle(.secondary)
                    Button("读取并验证合成文件", action: verifyFixture)
                    Button("重置测试文件", role: .destructive, action: resetFixture)
                }

                Section("状态") {
                    Text(status)
                        .textSelection(.enabled)
                    if let exportURL {
                        ShareLink(item: exportURL) {
                            Label("导出合成测试记录 JSON", systemImage: "square.and.arrow.up")
                        }
                    }
                }

                Section("安全边界") {
                    Text("此应用不枚举目录，不请求其他应用的容器，也不访问 App Group 之外的路径。")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
            }
            .navigationTitle("Lab Verifier")
        }
    }

    private func verifyFixture() {
        let start = Date()
        let firstVisit = LabConfiguration.timestamp(start)
        do {
            let fixture = try store.readFixture()
            let matches = fixture.marker == LabConfiguration.fixtureMarker
            let resultStatus: TestResultStatus = matches ? .pass : .error
            let resultTimestamp = LabConfiguration.timestamp()
            let writerEvent = LabEvent(
                timestamp: fixture.createdAt,
                role: "writer",
                action: "创建合成测试文件",
                status: "INFO",
                details: "Writer 在授权的实验 App Group 中创建固定测试文件。"
            )
            let verifierEvent = LabEvent(
                timestamp: resultTimestamp,
                role: "verifier",
                action: "验证合成测试文件",
                status: resultStatus.rawValue,
                details: matches
                    ? "App Group 读取成功且合成标记匹配。"
                    : "读取成功，但合成标记与预期不匹配。"
            )
            let record = LabRunRecord(
                runId: fixture.runId,
                status: resultStatus,
                timestamp: resultTimestamp,
                channel: "Verifier",
                durationMs: Int(Date().timeIntervalSince(start) * 1_000),
                firstVisit: fixture.createdAt,
                events: [writerEvent, verifierEvent]
            )
            exportURL = try LabRunExporter.export(record)
            status = "\(resultStatus.rawValue)：\(verifierEvent.details) 测试运行 ID：\(fixture.runId)"
        } catch let error as AppGroupStoreError {
            exportFailureRecord(
                error,
                resultStatus: error.resultStatus,
                start: start,
                firstVisit: firstVisit
            )
        } catch {
            exportFailureRecord(
                error,
                resultStatus: .error,
                start: start,
                firstVisit: firstVisit
            )
        }
    }

    private func exportFailureRecord(
        _ error: Error,
        resultStatus: TestResultStatus,
        start: Date,
        firstVisit: String
    ) {
        let resultTimestamp = LabConfiguration.timestamp()
        let event = LabEvent(
            timestamp: resultTimestamp,
            role: "verifier",
            action: "验证合成测试文件",
            status: resultStatus.rawValue,
            details: error.localizedDescription
        )
        let record = LabRunRecord(
            runId: UUID().uuidString.lowercased(),
            status: resultStatus,
            timestamp: resultTimestamp,
            channel: "Verifier",
            durationMs: Int(Date().timeIntervalSince(start) * 1_000),
            firstVisit: firstVisit,
            events: [event]
        )
        do {
            exportURL = try LabRunExporter.export(record)
            status = "\(resultStatus.rawValue)：\(error.localizedDescription)"
        } catch {
            exportURL = nil
            status = "ERROR：无法导出测试结果：\(error.localizedDescription)"
        }
    }

    private func resetFixture() {
        do {
            try store.removeFixture()
            exportURL = nil
            status = "已重置固定测试文件。"
        } catch {
            status = "重置失败：\(error.localizedDescription)"
        }
    }
}
