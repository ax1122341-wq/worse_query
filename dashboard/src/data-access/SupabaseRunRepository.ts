import type { DashboardRun, RunRecord } from "../types";
import type { RunRepository } from "./RunRepository";
import type { SupabaseSession } from "../lib/supabase";
import { deleteStoredRuns, insertStoredRuns } from "../lib/supabase";

export class SupabaseRunRepository implements RunRepository {
  private readonly demos: DashboardRun[];
  private imported: DashboardRun[];

  constructor(demoRecords: RunRecord[], importedRecords: RunRecord[], private readonly session: SupabaseSession) {
    this.demos = demoRecords.map((record) => ({ record, loadedFrom: "demo" }));
    this.imported = importedRecords.map((record) => ({ record, loadedFrom: "json-import" }));
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
    await insertStoredRuns(this.session, records);
    this.imported = [...this.imported, ...records.map((record) => ({ record, loadedFrom: "json-import" as const }))];
  }

  async clearImported(): Promise<void> {
    await deleteStoredRuns(this.session);
    this.imported = [];
  }
}
