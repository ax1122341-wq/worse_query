import Foundation

private struct LabRunEnvelope: Encodable {
    let schemaVersion: Int
    let records: [LabRunRecord]
}

enum LabRunExporter {
    static func export(_ record: LabRunRecord) throws -> URL {
        let envelope = LabRunEnvelope(
            schemaVersion: LabConfiguration.exportSchemaVersion,
            records: [record]
        )
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let data = try encoder.encode(envelope)
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("ios-security-lab-\(record.runId).json")
        try data.write(to: url, options: .atomic)
        return url
    }
}
