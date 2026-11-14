import type { DashboardRun, RunRecord } from "../types";
import type { RunRepository } from "./RunRepository";
import { parseRunEnvelope } from "../lib/importRunJson";

const STORAGE_KEY = "security-lab.dashboard.imported-runs.v1";

export class LocalStorageRunRepository implements RunRepository {
  private readonly demos: DashboardRun[];
  private imported: DashboardRun[] = [];

  constructor(
    demoRecords: RunRecord[],
    private readonly storage: Storage | null,
  ) {
    this.demos = demoRecords.map((record) => ({ record, loadedFrom: "demo" }));
    this.imported = this.readImported();
  }

  get persistenceAvailable(): boolean {
    return this.storage !== null;
  }

  list(): DashboardRun[] {
    return [...this.demos, ...this.imported];
  }

  importRecords(records: RunRecord[]): void {
    const knownIds = new Set(this.list().map(({ record }) => record.runId));
    const incomingIds = new Set<string>();

    for (const record of records) {
      if (knownIds.has(record.runId) || incomingIds.has(record.runId)) {
        throw new Error(`重复的测试记录 ID：${record.runId}`);
      }
      incomingIds.add(record.runId);
    }

    const next = [
      ...this.imported,
      ...records.map((record) => ({ record, loadedFrom: "json-import" as const })),
    ];
    this.persist(next);
    this.imported = next;
  }

  clearImported(): void {
    this.persist([]);
    this.imported = [];
  }

  private readImported(): DashboardRun[] {
    if (!this.storage) return [];
    try {
      const raw = this.storage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const envelope = parseRunEnvelope(raw);
      return envelope.records.map((record) => ({ record, loadedFrom: "json-import" }));
    } catch {
      // Leave invalid stored data untouched so a transient parse problem never
      // silently overwrites the user's saved browser data.
      return [];
    }
  }

  private persist(records: DashboardRun[]): void {
    if (!this.storage) return;
    const payload = JSON.stringify({
      schemaVersion: 1,
      records: records.map(({ record }) => record),
    });
    try {
      this.storage.setItem(STORAGE_KEY, payload);
    } catch {
      throw new Error("无法保存到本地浏览器存储；可能是存储空间不足或浏览器限制。现有记录未更改。");
    }
  }
}
