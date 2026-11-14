import type { RunRecord } from "../types";

export function exportRuns(records: RunRecord[]): void {
  const content = JSON.stringify({ schemaVersion: 1, records }, null, 2);
  const blob = new Blob([content], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = "ios-security-lab-runs.json";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
