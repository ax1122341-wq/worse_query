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
        <thead>
          <tr>
            <th>浏览器</th>
            <th>渠道</th>
            <th>匿名 ID</th>
            <th>结果</th>
            <th>耗时</th>
            <th>首次访问</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {records.map(({ record, loadedFrom }) => (
            <tr key={`${loadedFrom}-${record.runId}`}>
              <td data-label="浏览器">
                <span className="browser-cell">
                  <span className="browser-mark" aria-hidden="true">
                    {record.browser?.slice(0, 1) ?? "—"}
                  </span>
                  {record.browser ?? "不适用"}
                  <span
                    className={`record-marker ${record.recordType === "demo" ? "marker-demo" : "marker-test"}`}
                  >
                    {record.recordType === "demo" ? "演示" : "实验记录"}
                    {loadedFrom === "json-import" ? " · 已导入" : ""}
                  </span>
                </span>
              </td>
              <td data-label="渠道">{record.channel}</td>
              <td data-label="匿名 ID">
                <code className="anonymous-id">{record.anonymousId}</code>
              </td>
              <td data-label="结果">
                <span className={`status-badge status-${record.status.toLowerCase()}`}>
                  <span aria-hidden="true" />
                  {record.status}
                </span>
              </td>
              <td data-label="耗时">{record.durationMs.toLocaleString("zh-CN")} ms</td>
              <td data-label="首次访问" className="date-cell">
                {dateFormatter.format(new Date(record.firstVisit))}
              </td>
              <td data-label="操作">
                <Link
                  className="timeline-link"
                  to={`/runs/${encodeURIComponent(record.runId)}`}
                  state={{ loadedFrom }}
                >
                  <span aria-hidden="true">◷</span>
                  时间线
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="table-footnote">
        浏览器值仅来自合成数据；匿名 ID 为每次测试生成的随机 ID。
      </p>
    </div>
  );
}
