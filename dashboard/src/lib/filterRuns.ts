import type { DashboardRun, RunFilters } from "../types";

export function filterRuns(
  records: DashboardRun[],
  filters: RunFilters,
): DashboardRun[] {
  const query = filters.query.trim().toLocaleLowerCase();

  return records.filter(({ record }) => {
    if (filters.recordType !== "all" && record.recordType !== filters.recordType) return false;
    if (filters.status !== "all" && record.status !== filters.status) return false;
    if (filters.browser && record.browser !== filters.browser) return false;
    if (filters.channel && record.channel !== filters.channel) return false;
    if (filters.fromDate && record.firstVisit.slice(0, 10) < filters.fromDate) return false;
    if (filters.toDate && record.firstVisit.slice(0, 10) > filters.toDate) return false;
    if (filters.minDuration && record.durationMs < Number(filters.minDuration)) return false;
    if (filters.maxDuration && record.durationMs > Number(filters.maxDuration)) return false;
    if (!query) return true;

    const searchable = [
      record.runId,
      record.browser ?? "",
      record.channel,
      record.anonymousId,
      record.fingerprint ?? "",
      ...record.events.flatMap((event) => [event.action, event.details, event.role]),
    ].join(" ").toLocaleLowerCase();

    return searchable.includes(query);
  });
}
