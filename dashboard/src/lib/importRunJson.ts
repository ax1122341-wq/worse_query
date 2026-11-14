import type {
  EventStatus,
  LabEvent,
  RecordSource,
  RecordType,
  RunEnvelope,
  RunRecord,
  TestResultStatus,
} from "../types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

function isIsoDate(value: unknown): value is string {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

function parseEvent(value: unknown, index: number): LabEvent {
  if (
    !isObject(value) ||
    !isIsoDate(value.timestamp) ||
    !["writer", "verifier", "dashboard"].includes(String(value.role)) ||
    typeof value.action !== "string" ||
    !["PASS", "DENIED", "ERROR", "INFO"].includes(String(value.status)) ||
    typeof value.details !== "string"
  ) {
    throw new Error(`第 ${index + 1} 条时间线事件格式无效。`);
  }

  return {
    timestamp: value.timestamp,
    role: value.role as LabEvent["role"],
    action: value.action,
    status: value.status as EventStatus,
    details: value.details,
  };
}

function parseRecord(value: unknown, index: number): RunRecord {
  if (
    !isObject(value) ||
    !["demo", "test"].includes(String(value.recordType)) ||
    !["demo-fixture", "ios-security-lab"].includes(String(value.source)) ||
    typeof value.runId !== "string" ||
    value.runId.length === 0 ||
    !["PASS", "DENIED", "ERROR"].includes(String(value.status)) ||
    !isIsoDate(value.timestamp) ||
    !(typeof value.browser === "string" || value.browser === null) ||
    typeof value.channel !== "string" ||
    value.channel.length === 0 ||
    typeof value.anonymousId !== "string" ||
    value.anonymousId.length === 0 ||
    !Number.isInteger(value.durationMs) ||
    Number(value.durationMs) < 0 ||
    !isIsoDate(value.firstVisit) ||
    !Array.isArray(value.events)
  ) {
    throw new Error(`第 ${index + 1} 条记录格式无效。`);
  }

  if (
    (value.recordType === "demo" && value.source !== "demo-fixture") ||
    (value.recordType === "test" && value.source !== "ios-security-lab")
  ) {
    throw new Error(`第 ${index + 1} 条记录的类型与来源不匹配。`);
  }

  const record: RunRecord = {
    recordType: value.recordType as RecordType,
    source: value.source as RecordSource,
    runId: value.runId,
    status: value.status as TestResultStatus,
    timestamp: value.timestamp,
    browser: value.browser,
    channel: value.channel,
    anonymousId: value.anonymousId,
    durationMs: Number(value.durationMs),
    firstVisit: value.firstVisit,
    events: value.events.map(parseEvent),
  };

  const verifierResults = record.events.filter(
    (event) => event.role === "verifier" && event.status !== "INFO",
  );
  const finalVerifierResult = verifierResults.at(-1);
  if (finalVerifierResult?.status !== record.status) {
    throw new Error(`第 ${index + 1} 条记录的最终状态与验证事件不匹配。`);
  }

  return record;
}

export function parseRunEnvelope(json: string): RunEnvelope {
  if (json.length > 1_000_000) {
    throw new Error("JSON 文件过大（上限 1 MB）。");
  }

  let value: unknown;
  try {
    value = JSON.parse(json);
  } catch {
    throw new Error("无法解析 JSON 文件。");
  }

  if (!isObject(value) || value.schemaVersion !== 1 || !Array.isArray(value.records)) {
    throw new Error("不支持的导入格式；需要 schemaVersion 1 的 records 数组。");
  }

  return {
    schemaVersion: 1,
    records: value.records.map(parseRecord),
  };
}
