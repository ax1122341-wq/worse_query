import type {
  DashboardRun,
  RunRecord,
} from "../types";
import type { RunRepository } from "./RunRepository";

export class MemoryRunRepository implements RunRepository {
  private readonly demos: DashboardRun[];
  private imported: DashboardRun[] = [];

  constructor(demoRecords: RunRecord[]) {
    this.demos = demoRecords.map((record) => ({
      record,
      loadedFrom: "demo",
    }));
  }

  list(): DashboardRun[] {
    return [...this.demos, ...this.imported];
  }

  async importRecords(records: RunRecord[]): Promise<void> {
    const knownIds = new Set(this.list().map(({ record }) => record.runId));
    const incomingIds = new Set<string>();

    for (const record of records) {
      if (knownIds.has(record.runId) || incomingIds.has(record.runId)) {
        throw new Error(`重复的测试记录 ID：${record.runId}`);
      }
      incomingIds.add(record.runId);
    }

    this.imported = [
      ...this.imported,
      ...records.map((record) => ({ record, loadedFrom: "json-import" as const })),
    ];
  }

  async clearImported(): Promise<void> {
    this.imported = [];
  }
}
