import { useMemo } from "react";
import type { DashboardRun } from "../types";

interface TrendChartProps {
  records: DashboardRun[];
}

interface TrendPoint {
  key: string;
  label: string;
  pass: number;
  denied: number;
  error: number;
  total: number;
}

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function TrendChart({ records }: TrendChartProps) {
  const points = useMemo<TrendPoint[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = new Map<string, TrendPoint>();

    for (let offset = 13; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const key = dateKey(day);
      buckets.set(key, {
        key,
        label: String(day.getMonth() + 1) + "/" + String(day.getDate()),
        pass: 0,
        denied: 0,
        error: 0,
        total: 0,
      });
    }

    for (const { record } of records) {
      const date = new Date(record.timestamp);
      if (!Number.isFinite(date.getTime())) continue;
      const point = buckets.get(dateKey(date));
      if (!point) continue;
      point.total += 1;
      if (record.status === "PASS") point.pass += 1;
      else if (record.status === "DENIED") point.denied += 1;
      else point.error += 1;
    }

    return [...buckets.values()];
  }, [records]);

  const total = points.reduce((sum, point) => sum + point.total, 0);
  const passed = points.reduce((sum, point) => sum + point.pass, 0);
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0;
  const maxValue = Math.max(1, ...points.map((point) => point.total));
  const chartHeight = 112;
  const barWidth = 20;
  const step = 38;
  const chartWidth = points.length * step;

  return (
    <section className="trend-panel" aria-labelledby="trend-title">
      <div className="trend-heading">
        <div>
          <span className="eyebrow">记录趋势</span>
          <h2 id="trend-title">最近 14 天</h2>
          <p>按记录时间统计当前账户的云端导入结果与演示数据。</p>
        </div>
        <div className="trend-summary">
          <strong>{total}</strong>
          <span>条记录</span>
          <i aria-hidden="true" />
          <strong>{passRate}%</strong>
          <span>PASS 占比</span>
        </div>
      </div>
      {total === 0 ? (
        <div className="trend-empty">最近 14 天没有记录。</div>
      ) : (
        <>
          <div className="trend-chart-scroll">
            <svg
              aria-label="最近 14 天 PASS、DENIED 和 ERROR 记录数量堆叠柱状图"
              className="trend-chart"
              role="img"
              viewBox={"0 0 " + chartWidth + " 148"}
              width={chartWidth}
            >
              <line x1="0" x2={chartWidth} y1={chartHeight + 1} y2={chartHeight + 1} className="trend-axis" />
              {points.map((point, index) => {
                const x = index * step + (step - barWidth) / 2;
                const passHeight = (point.pass / maxValue) * chartHeight;
                const deniedHeight = (point.denied / maxValue) * chartHeight;
                const errorHeight = (point.error / maxValue) * chartHeight;
                let y = chartHeight - passHeight;
                const passRect = { x, y, width: barWidth, height: passHeight };
                y -= deniedHeight;
                const deniedRect = { x, y, width: barWidth, height: deniedHeight };
                y -= errorHeight;
                const errorRect = { x, y, width: barWidth, height: errorHeight };
                return (
                  <g key={point.key}>
                    <rect {...passRect} className="trend-pass">
                      <title>{point.label} PASS: {point.pass}</title>
                    </rect>
                    <rect {...deniedRect} className="trend-denied">
                      <title>{point.label} DENIED: {point.denied}</title>
                    </rect>
                    <rect {...errorRect} className="trend-error">
                      <title>{point.label} ERROR: {point.error}</title>
                    </rect>
                    <text className="trend-x-label" x={x + barWidth / 2} y="133" textAnchor="middle">
                      {index % 2 === 0 || index === points.length - 1 ? point.label : ""}
                    </text>
                    {point.total > 0 && (
                      <text className="trend-value" x={x + barWidth / 2} y={Math.max(10, y - 5)} textAnchor="middle">
                        {point.total}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="trend-legend" aria-label="图例">
            <span><i className="trend-pass" />PASS</span>
            <span><i className="trend-denied" />DENIED</span>
            <span><i className="trend-error" />ERROR</span>
          </div>
        </>
      )}
    </section>
  );
}
