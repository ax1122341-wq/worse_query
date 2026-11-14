import { Link } from "react-router-dom";
import type { DashboardRun } from "../types";

interface RunTableProps {
  records: DashboardRun[];
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "medium",
  timeStyle: "short",
});

export function RunTable({ records }: RunTableProps) {
  if (records.length === 0) {
    return (
      <div className="empty-state">
        <span aria-hidden="true" className="empty-icon">⌕</span>
        <h3>没有匹配的测试记录</h3>
        <p>请调整搜索内容或筛选条件。</p>
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="run-table">
        <thead><tr><th>浏览器</th><th>渠道</th><th>指纹</th><th>结果</th><th>停留</th><th>首次访问</th><th>操作</th></tr></thead>
        <tbody>
          {records.map(({ record, loadedFrom }) => (
            <tr key={`${loadedFrom}-${record.runId}`}>
              <td data-label="浏览器">
                <span className="browser-cell">
                  <span className="browser-mark" aria-hidden="true">{record.browser?.slice(0, 1) ?? "—"}</span>
                  {record.browser ?? "不适用"}
                  <span className={`record-marker ${record.recordType === "demo" ? "marker-demo" : "marker-test"}`}>
                    {record.recordType === "demo" ? "演示" : "实验记录"}{loadedFrom === "json-import" ? " · 已导入" : ""}
                  </span>
                </span>
              </td>
              <td data-label="渠道">{record.channel}</td>
              <td data-label="指纹"><code className="anonymous-id">{record.fingerprint ?? "未提供"}</code></td>
              <td data-label="结果"><span className={`status-badge status-${record.status.toLowerCase()}`}><span aria-hidden="true" />{record.status}</span></td>
              <td data-label="停留">{record.durationMs >= 60_000
                ? `${Math.floor(record.durationMs / 60_000)}m${Math.floor((record.durationMs % 60_000) / 1_000)}s`
                : `${Math.floor(record.durationMs / 1_000)}s`}</td>
              <td data-label="首次访问" className="date-cell">{dateFormatter.format(new Date(record.firstVisit))}</td>
              <td data-label="操作">
                <Link className="timeline-link" to={`/runs/${encodeURIComponent(record.runId)}`} state={{ loadedFrom }}>
                  <span aria-hidden="true">⌁</span> 时间线
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-footnote">指纹字段仅展示 JSON 导入时提供的内容；不会采集或推断真实设备指纹。</p>
    </div>
  );
}
