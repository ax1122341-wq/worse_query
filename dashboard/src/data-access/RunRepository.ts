import type { DashboardRun, RunRecord } from "../types";

export interface RunRepository {
  list(): DashboardRun[];
  importRecords(records: RunRecord[]): Promise<void>;
  clearImported(): Promise<void>;
}
