import { useMemo, useRef, useState } from "react";
import { AdvancedFilters } from "../components/AdvancedFilters";
import { RunTable } from "../components/RunTable";
import { SearchControl } from "../components/SearchControl";
import { exportRuns } from "../lib/exportRuns";
import { filterRuns } from "../lib/filterRuns";
import { parseRunEnvelope } from "../lib/importRunJson";
import type { RunRepository } from "../data-access/RunRepository";
import type { RunFilters } from "../types";

interface DashboardPageProps {
  repository: RunRepository;
  refresh: () => void;
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

export function DashboardPage({ repository, refresh }: DashboardPageProps) {
  const [filters, setFilters] = useState(initialFilters);
  const [searchOpen, setSearchOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(true);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const records = repository.list();
  const browsers = useMemo(
    () =>
      [...new Set(records.map(({ record }) => record.browser).filter(
        (browser): browser is string => browser !== null,
      ))].sort(),
    [records],
  );
  const channels = useMemo(
    () => [...new Set(records.map(({ record }) => record.channel))].sort(),
    [records],
  );
  const filteredRecords = useMemo(
    () => filterRuns(records, filters),
    [records, filters],
  );

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearchOpen(false);
    setMessage("");
  };

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      const envelope = parseRunEnvelope(await file.text());
      repository.importRecords(envelope.records);
      setMessage(`已导入 ${envelope.records.length} 条记录；刷新页面后导入数据将清除。`);
      refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入失败。");
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  };

  return (
    <main className="page-shell">
      <header className="topbar">
        <a aria-label="iOS Security Lab 首页" className="brand" href="/">
          <span className="brand-mark">SL</span>
          <span className="brand-copy">
            <strong>SECURITY LAB</strong>
            <small>测试控制台</small>
          </span>
        </a>
        <div className="topbar-meta">
          <span className="environment-pill"><span /> 本地演示</span>
          <span className="avatar">L</span>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="breadcrumb">
          <span>工作区</span><span aria-hidden="true">/</span><strong>测试记录</strong>
        </div>

        <div className="page-heading">
          <div>
            <span className="eyebrow">IOS SECURITY LAB</span>
            <h1>测试记录</h1>
            <p>查看合成演示数据与明确导入的实验测试记录。</p>
          </div>
          <div className="heading-actions">
            <SearchControl
              onChange={(query) => setFilters({ ...filters, query })}
              onToggle={() => setSearchOpen(!searchOpen)}
              open={searchOpen}
              value={filters.query}
            />
            <button
              className="button button-secondary"
              onClick={() => fileInput.current?.click()}
              type="button"
            >
              <span aria-hidden="true">↑</span>
              导入 JSON
            </button>
            <input
              accept="application/json,.json"
              className="visually-hidden"
              onChange={(event) => void importFile(event.target.files?.[0])}
              ref={fileInput}
              type="file"
            />
            <button
              className="button button-primary"
              disabled={filteredRecords.length === 0}
              onClick={() => exportRuns(filteredRecords.map(({ record }) => record))}
              type="button"
            >
              <span aria-hidden="true">↓</span>
              导出筛选结果
            </button>
          </div>
        </div>

        <div className="notice">
          <span aria-hidden="true" className="notice-icon">i</span>
          <p>
            所有内置记录均为合成演示数据。导入记录仅保存在当前页面内存中；
            导出来源标记不等同于真实性验证。
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
            {records.some(({ loadedFrom }) => loadedFrom === "json-import") && (
              <button
                className="button button-quiet"
                onClick={() => {
                  repository.clearImported();
                  setMessage("已清除本页面内存中的导入记录。");
                  refresh();
                }}
                type="button"
              >
                清除导入记录
              </button>
            )}
          </div>
        )}

        <section className="stats-grid" aria-label="记录概览">
          <article className="stat-card">
            <span>全部记录</span>
            <strong>{records.length}</strong>
            <small>演示与导入记录</small>
          </article>
          <article className="stat-card">
            <span>PASS</span>
            <strong>{records.filter(({ record }) => record.status === "PASS").length}</strong>
            <small><span className="stat-dot green" />读取成功且标记匹配</small>
          </article>
          <article className="stat-card">
            <span>DENIED</span>
            <strong>{records.filter(({ record }) => record.status === "DENIED").length}</strong>
            <small><span className="stat-dot amber" />授权不可用</small>
          </article>
          <article className="stat-card">
            <span>ERROR</span>
            <strong>{records.filter(({ record }) => record.status === "ERROR").length}</strong>
            <small><span className="stat-dot red" />测试或环境错误</small>
          </article>
        </section>

        <section className="records-panel">
          <div className="records-panel-heading">
            <div>
              <h2>全部记录 <span className="count-badge">{filteredRecords.length}</span></h2>
              <p>每条时间线展示结构化事件；当前筛选结果 {filteredRecords.length} 条。</p>
            </div>
            <button
              aria-expanded={advancedOpen}
              className="button button-quiet"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              type="button"
            >
              <span aria-hidden="true">☷</span>
              {advancedOpen ? "收起高级筛选" : "高级筛选"}
            </button>
          </div>

          <div className="record-origin-summary">
            <span><i className="origin-dot demo-dot" />演示数据：{records.filter(({ record }) => record.recordType === "demo").length}</span>
            <span><i className="origin-dot imported-dot" />JSON 导入：{records.filter(({ loadedFrom }) => loadedFrom === "json-import").length}</span>
            <span>筛选结果：{filteredRecords.length}</span>
          </div>

          {advancedOpen && (
            <AdvancedFilters
              browsers={browsers}
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              channels={channels}
            />
          )}

          <RunTable records={filteredRecords} />
        </section>

        <footer className="page-footer">
          <span>iOS Security Lab</span>
          <span>仅用于合成 App Group 权限测试数据展示</span>
        </footer>
      </section>
    </main>
  );
}
