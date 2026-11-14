import { Link, useParams } from "react-router-dom";
import type { RunRepository } from "../data-access/RunRepository";

interface RunDetailsPageProps {
  repository: RunRepository;
}

const dateFormatter = new Intl.DateTimeFormat("zh-CN", {
  dateStyle: "full",
  timeStyle: "medium",
});

const statusCopy = {
  PASS: "授权读取成功且标记匹配",
  DENIED: "App Group 授权不可用",
  ERROR: "测试或环境错误",
} as const;

export function RunDetailsPage({ repository }: RunDetailsPageProps) {
  const { runId } = useParams();
  const run = repository.list().find(({ record }) => record.runId === runId);

  if (!run) {
    return (
      <main className="details-shell">
        <Link className="back-link" to="/">← 返回测试记录</Link>
        <div className="empty-state">
          <h1>找不到这条记录</h1>
          <p>记录可能已被清除，或本地浏览器存储不可用。</p>
        </div>
      </main>
    );
  }

  const { record } = run;
  return (
    <main className="details-shell">
      <header className="details-topbar">
        <Link className="back-link" to="/">← 返回测试记录</Link>
        <span className="environment-pill"><span /> 本地演示</span>
      </header>
      <div className="details-heading">
        <div><span className="eyebrow">测试详情</span><h1>运行时间线</h1><p>记录 ID <code>{record.runId}</code></p></div>
        <div className="details-badges">
          <span className={`status-badge status-${record.status.toLowerCase()}`}><span aria-hidden="true" />{record.status}</span>
          <span className={`record-marker ${record.recordType === "demo" ? "marker-demo" : "marker-test"}`}>
            {record.recordType === "demo" ? "演示数据" : "实验测试记录"}{run.loadedFrom === "json-import" ? " · 已导入" : ""}
          </span>
        </div>
      </div>
      <section className="detail-summary">
        <div><span>测试结果</span><strong>{record.status} · {statusCopy[record.status]}</strong></div>
        <div><span>结果时间</span><strong>{dateFormatter.format(new Date(record.timestamp))}</strong></div>
        <div><span>渠道</span><strong>{record.channel}</strong></div>
        <div><span>指纹（JSON）</span><code>{record.fingerprint ?? "未提供"}</code></div>
        <div><span>匿名 ID</span><code>{record.anonymousId}</code></div>
        <div><span>停留时间</span><strong>{record.durationMs.toLocaleString("zh-CN")} ms</strong></div>
        <div><span>首次访问</span><strong>{dateFormatter.format(new Date(record.firstVisit))}</strong></div>
        <div><span>浏览器</span><strong>{record.browser ?? "不适用（原生应用）"}</strong></div>
      </section>
      <section className="timeline-panel">
        <div className="records-panel-heading"><div><h2>事件时间线</h2><p>{record.events.length} 条结构化事件</p></div></div>
        {record.events.length === 0 ? (
          <div className="empty-state"><p>此记录没有时间线事件。</p></div>
        ) : (
          <ol className="timeline-list">
            {record.events.slice().sort((a, b) => a.timestamp.localeCompare(b.timestamp)).map((event, index) => (
              <li className="timeline-item" key={`${event.timestamp}-${index}`}>
                <span className={`timeline-marker status-${event.status.toLowerCase()}`} />
                <article className="timeline-event">
                  <div className="timeline-event-top">
                    <div><span className="event-role">{event.role}</span><h3>{event.action}</h3></div>
                    <time dateTime={event.timestamp}>{dateFormatter.format(new Date(event.timestamp))}</time>
                  </div>
                  <p>{event.details}</p>
                  <span className={`status-badge status-${event.status.toLowerCase()}`}><span aria-hidden="true" />{event.status}</span>
                </article>
              </li>
            ))}
          </ol>
        )}
      </section>
      <p className="provenance-note">来源标记仅描述记录如何载入，不构成对导入数据来源的真实性证明。</p>
    </main>
  );
}
