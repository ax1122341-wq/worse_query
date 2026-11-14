import type { DashboardRun, RunRecord } from "../types";

export interface RunRepository {
  list(): DashboardRun[];
  importRecords(records: RunRecord[]): void | Promise<void>;
  clearImported(): void | Promise<void>;
}
