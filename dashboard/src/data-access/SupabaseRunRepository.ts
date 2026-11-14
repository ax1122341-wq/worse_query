import type { SupabaseClient } from "@supabase/supabase-js";
import type { DashboardRun, RunRecord } from "../types";
import type { RunRepository } from "./RunRepository";
import { parseRunEnvelope } from "../lib/importRunJson";

interface StoredRunRow {
  run_id: string;
  record: unknown;
}

export class SupabaseRunRepository implements RunRepository {
  private readonly demos: DashboardRun[];
  private imported: DashboardRun[] = [];

  constructor(
    private readonly client: SupabaseClient,
    private readonly ownerId: string,
    demoRecords: RunRecord[],
  ) {
    this.demos = demoRecords.map((record) => ({ record, loadedFrom: "demo" }));
  }

  list(): DashboardRun[] {
    return [...this.demos, ...this.imported];
  }

  async refresh(): Promise<void> {
    const { data, error } = await this.client
      .from("lab_runs")
      .select("run_id, record")
      .eq("owner_id", this.ownerId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error("读取 Supabase 记录失败：" + error.message);
    }

    const rows = (data ?? []) as unknown as StoredRunRow[];
    const envelope = parseRunEnvelope(
      JSON.stringify({
        schemaVersion: 1,
        records: rows.map((row) => row.record),
      }),
    );

    this.imported = envelope.records.map((record) => ({
      record,
      loadedFrom: "json-import",
    }));
  }

  async importRecords(records: RunRecord[]): Promise<void> {
    if (records.length === 0) return;

    const knownIds = new Set(this.list().map(({ record }) => record.runId));
    const incomingIds = new Set<string>();

    for (const record of records) {
      if (knownIds.has(record.runId) || incomingIds.has(record.runId)) {
        throw new Error("重复的测试记录 ID：" + record.runId);
      }
      incomingIds.add(record.runId);
    }

    const rows = records.map((record) => ({
      owner_id: this.ownerId,
      run_id: record.runId,
      record,
    }));

    const { error } = await this.client.from("lab_runs").insert(rows);
    if (error) {
      throw new Error("保存到 Supabase 失败：" + error.message);
    }

    await this.refresh();
  }

  async deleteImported(runId: string): Promise<void> {
    const { error } = await this.client
      .from("lab_runs")
      .delete()
      .eq("owner_id", this.ownerId)
      .eq("run_id", runId);

    if (error) {
      throw new Error("删除云端记录失败：" + error.message);
    }

    this.imported = this.imported.filter(({ record }) => record.runId !== runId);
  }

  async clearImported(): Promise<void> {
    const { error } = await this.client
      .from("lab_runs")
      .delete()
      .eq("owner_id", this.ownerId);

    if (error) {
      throw new Error("清除云端导入记录失败：" + error.message);
    }
    this.imported = [];
  }
}
