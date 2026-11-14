export type RecordType = "demo" | "test";
export type RecordSource = "demo-fixture" | "ios-security-lab";
export type TestResultStatus = "PASS" | "DENIED" | "ERROR";
export type EventStatus = TestResultStatus | "INFO";

export interface LabEvent {
  timestamp: string;
  role: "writer" | "verifier" | "dashboard";
  action: string;
  status: EventStatus;
  details: string;
}

export interface RunRecord {
  recordType: RecordType;
  source: RecordSource;
  runId: string;
  status: TestResultStatus;
  timestamp: string;
  browser: string | null;
  channel: string;
  anonymousId: string;
  durationMs: number;
  firstVisit: string;
  events: LabEvent[];
}

export interface RunEnvelope {
  schemaVersion: 1;
  records: RunRecord[];
}

export interface DashboardRun {
  record: RunRecord;
  loadedFrom: "demo" | "json-import";
}

export interface RunFilters {
  query: string;
  recordType: "all" | RecordType;
  status: "all" | TestResultStatus;
  browser: string;
  channel: string;
  fromDate: string;
  toDate: string;
  minDuration: string;
  maxDuration: string;
}
