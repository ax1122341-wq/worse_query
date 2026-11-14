import type { DashboardRun, RunRecord } from "../types";

export interface RunRepository {
  list(): DashboardRun[];
  refresh(): void | Promise<void>;
  importRecords(records: RunRecord[]): void | Promise<void>;
  deleteImported(runId: string): void | Promise<void>;
  clearImported(): void | Promise<void>;
}
