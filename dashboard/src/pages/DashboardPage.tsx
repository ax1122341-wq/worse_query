import { useEffect, useMemo, useRef, useState } from "react";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { RunTable } from "../components/RunTable";
import { SearchControl } from "../components/SearchControl";
import { TrendChart } from "../components/TrendChart";
import { exportRuns } from "../lib/exportRuns";
import { filterRuns } from "../lib/filterRuns";
import { parseRunEnvelope } from "../lib/importRunJson";
import type { RunRepository } from "../data-access/RunRepository";
import type { RunFilters } from "../types";

interface DashboardPageProps {
  repository: RunRepository;
  refresh: () => void;
  userEmail: string;
  onSignOut: () => void;
}

const initialFilters: RunFilters = {
  query: "",
  recordType: "all",
  status: "all",
  browser: "",
  channel: "",
  fromDate: "",
  toDate: "",
  minDuration: "",
  maxDuration: "",
};

export function DashboardPage({ repository, refresh, userEmail, onSignOut }: DashboardPageProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchOpen, setSearchOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const fileInput = useRef<HTMLInputElement>(null);
  const records = repository.list();
  const cloudRecords = records.filter(({ loadedFrom }) => loadedFrom === "json-import");
  const browsers = useMemo(
    () => [...new Set(records.map(({ record }) => record.browser).filter(
      (browser): browser is string => browser !== null,
    ))].sort(),
    [records],
  );
  const channels = useMemo(
    () => [...new Set(records.map(({ record }) => record.channel))].sort(),
    [records],
  );
  const filteredRecords = useMemo(() => filterRuns(records, filters), [records, filters]);
  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / pageSize));
  const visibleRecords = useMemo(
    () => filteredRecords.slice((page - 1) * pageSize, page * pageSize),
    [filteredRecords, page, pageSize],
  );

  useEffect(() => {
    setPage(1);
  }, [filters, pageSize]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchOpen(false);
    setMessage("");
  };

  const syncCloud = async () => {
    setBusy(true);
    try {
      await repository.refresh();
      refresh();
      const count = repository.list().filter(({ loadedFrom }) => loadedFrom === "json-import").length;
      setMessage("已从 Supabase 刷新云端历史记录，共 " + count + " 条。");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "同步云端记录失败。");
    } finally {
      setBusy(false);
    }
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const envelope = parseRunEnvelope(await file.text());
      await repository.importRecords(envelope.records);
      setMessage("已导入并保存到 Supabase 云端 " + envelope.records.length + " 条记录。");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败。");
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  const deleteOneImported = async (runId: string) => {
    if (!window.confirm("确定删除这条云端记录吗？此操作只删除当前账户的这一条记录。")) return;
    setBusy(true);
    try {
      await repository.deleteImported(runId);
      setMessage("已删除云端记录：" + runId);
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "删除云端记录失败。");
    } finally {
      setBusy(false);
    }
  };

  const clearImported = async () => {
    if (!window.confirm("确定清除当前账户保存的全部云端导入记录吗？此操作不可撤销。")) return;
    setBusy(true);
    try {
      await repository.clearImported();
      setMessage("已清除当前账户的云端导入记录。");
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "清除失败。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <a aria-label="iOS Security Lab 首页" className="brand" href="/">
          <span className="brand-mark">SL</span>
          <span className="brand-copy"><strong>SECURITY LAB</strong><small>测试控制台</small></span>
        </a>
        <div className="topbar-meta">
          <span className="environment-pill"><span /> Supabase 云端</span>
          <span className="user-email">{userEmail}</span>
          <button className="button button-quiet" onClick={onSignOut} type="button">退出登录</button>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="breadcrumb"><span>工作区</span><span aria-hidden="true">/</span><strong>测试记录</strong></div>
        <div className="page-heading">
          <div>
            <span className="eyebrow">IOS SECURITY LAB</span>
            <h1>测试记录</h1>
            <p>查看合成演示数据与当前账户的云端实验测试记录。</p>
          </div>
          <div className="heading-actions">
            <SearchControl
              onChange={(query) => setFilters((current) => ({ ...current, query }))}
              onToggle={() => setSearchOpen((open) => !open)}
              open={searchOpen}
              value={filters.query}
            />
            <button className="button button-secondary" disabled={busy} onClick={() => void syncCloud()} type="button">
              <span aria-hidden="true">↻</span> 同步云端
            </button>
            <button className="button button-secondary" disabled={busy} onClick={() => fileInput.current?.click()} type="button">
              <span aria-hidden="true">↑</span> 导入 JSON
            </button>
            <input
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(event) => void importFile(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />
            <button
              className="button button-secondary"
              disabled={records.length === 0}
              onClick={() => exportRuns(records.map(({ record }) => record))}
              type="button"
            >
              ↓ 导出全部
            </button>
            <button
              className="button button-primary"
              disabled={filteredRecords.length === 0}
              onClick={() => exportRuns(filteredRecords.map(({ record }) => record))}
              type="button"
            >
              <span aria-hidden="true">↓</span> 导出筛选结果
            </button>
            <button className="button button-quiet" onClick={resetFilters} type="button">重置</button>
          </div>
        </div>

        <div className="notice">
          <span aria-hidden="true" className="notice-icon">i</span>
          <p>
            内置记录为合成演示数据。iOS Writer / Verifier 导出的验证结果 JSON 可在此导入，
            保存至 Supabase 并按登录账户隔离；导出来源标记不等同于真实性验证。
          </p>
        </div>
        <div className="result-legend" aria-label="测试结果状态说明">
          <span><b className="legend-pass">PASS</b>授权读取成功且标记匹配</span>
          <span><b className="legend-denied">DENIED</b>App Group 授权不可用</span>
          <span><b className="legend-error">ERROR</b>其他测试或环境错误</span>
        </div>

        {message && (
          <div aria-live="polite" className="import-message">
            <span>{message}</span>
            {cloudRecords.length > 0 && (
              <button className="button button-quiet" disabled={busy} onClick={() => void clearImported()} type="button">
                清除全部云端导入记录
              </button>
            )}
          </div>
        )}
        {busy && <div className="import-message" role="status">正在与 Supabase 同步…</div>}

        <section className="stats-grid" aria-label="记录概览">
          <article className="stat-card"><span>全部记录</span><strong>{records.length}</strong><small>演示与云端记录</small></article>
          <article className="stat-card"><span>PASS</span><strong>{records.filter(({ record }) => record.status === "PASS").length}</strong><small><span className="stat-dot green" />读取成功且标记匹配</small></article>
          <article className="stat-card"><span>DENIED</span><strong>{records.filter(({ record }) => record.status === "DENIED").length}</strong><small><span className="stat-dot amber" />授权不可用</small></article>
          <article className="stat-card"><span>ERROR</span><strong>{records.filter(({ record }) => record.status === "ERROR").length}</strong><small><span className="stat-dot red" />测试或环境错误</small></article>
        </section>

        <TrendChart records={records} />

        <section className="records-panel">
          <div className="records-panel-heading">
            <div><h2>全部记录 <span className="count-badge">{filteredRecords.length}</span></h2><p>当前筛选共 {filteredRecords.length} 条记录，按筛选结果分页显示。</p></div>
            <button aria-expanded={advancedOpen} className="button button-quiet" onClick={() => setAdvancedOpen(!advancedOpen)} type="button">
              <span aria-hidden="true">☷</span>{advancedOpen ? "收起高级筛选" : "高级筛选"}
            </button>
          </div>
          <div className="record-origin-summary">
            <span><i className="origin-dot demo-dot" />演示数据：{records.filter(({ record }) => record.recordType === "demo").length}</span>
            <span><i className="origin-dot imported-dot" />云端导入：{cloudRecords.length}</span>
            <span>筛选结果：{filteredRecords.length}</span>
          </div>
          {advancedOpen && (
            <AdvancedFilters browsers={browsers} filters={filters} onChange={setFilters} onReset={resetFilters} channels={channels} />
          )}
          <RunTable records={visibleRecords} onDeleteImported={(runId) => void deleteOneImported(runId)} />
          <div className="pagination-bar">
            <span className="pagination-summary">
              {filteredRecords.length === 0
                ? "没有可显示的记录"
                : "显示第 " + ((page - 1) * pageSize + 1) + "–" + Math.min(page * pageSize, filteredRecords.length) + " 条，共 " + filteredRecords.length + " 条"}
            </span>
            <div className="pagination-controls">
              <label className="page-size-control">
                每页
                <select value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
                条
              </label>
              <button className="button button-quiet" disabled={page <= 1} onClick={() => setPage(1)} type="button">首页</button>
              <button className="button button-quiet" disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))} type="button">上一页</button>
              <span className="page-indicator">{page} / {totalPages}</span>
              <button className="button button-quiet" disabled={page >= totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} type="button">下一页</button>
              <button className="button button-quiet" disabled={page >= totalPages} onClick={() => setPage(totalPages)} type="button">末页</button>
            </div>
          </div>
        </section>
        <footer className="page-footer"><span>iOS Security Lab</span><span>合成 App Group 测试数据展示 · Supabase 云端持久化</span></footer>
      </section>
    </main>
  );
}
