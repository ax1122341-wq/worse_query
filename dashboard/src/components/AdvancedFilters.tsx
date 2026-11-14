import type { RunFilters } from "../types";

interface AdvancedFiltersProps {
  filters: RunFilters;
  browsers: string[];
  channels: string[];
  onChange: (filters: RunFilters) => void;
  onReset: () => void;
}

export function AdvancedFilters({
  filters,
  browsers,
  channels,
  onChange,
  onReset,
}: AdvancedFiltersProps) {
  const update = (key: keyof RunFilters, value: string) => {
    onChange({ ...filters, [key]: value });
  };

  return (
    <section aria-label="高级筛选" className="filter-panel">
      <div className="filter-heading">
        <div>
          <span className="eyebrow">筛选条件</span>
          <h2>高级筛选</h2>
        </div>
        <button className="button button-quiet" onClick={onReset} type="button">
          重置筛选
        </button>
      </div>
      <div className="filter-grid">
        <label>
          记录类型
          <select
            onChange={(event) => update("recordType", event.target.value)}
            value={filters.recordType}
          >
            <option value="all">全部记录</option>
            <option value="demo">演示数据</option>
            <option value="test">实验测试</option>
          </select>
        </label>
        <label>
          测试结果
          <select
            onChange={(event) => update("status", event.target.value)}
            value={filters.status}
          >
            <option value="all">全部状态</option>
            <option value="PASS">PASS · 通过</option>
            <option value="DENIED">DENIED · 授权拒绝</option>
            <option value="ERROR">ERROR · 错误</option>
          </select>
        </label>
        <label>
          浏览器
          <select
            onChange={(event) => update("browser", event.target.value)}
            value={filters.browser}
          >
            <option value="">全部</option>
            {browsers.map((browser) => (
              <option key={browser} value={browser}>
                {browser}
              </option>
            ))}
          </select>
        </label>
        <label>
          渠道
          <select
            onChange={(event) => update("channel", event.target.value)}
            value={filters.channel}
          >
            <option value="">全部</option>
            {channels.map((channel) => (
              <option key={channel} value={channel}>
                {channel}
              </option>
            ))}
          </select>
        </label>
        <label>
          开始日期
          <input
            onChange={(event) => update("fromDate", event.target.value)}
            type="date"
            value={filters.fromDate}
          />
        </label>
        <label>
          结束日期
          <input
            onChange={(event) => update("toDate", event.target.value)}
            type="date"
            value={filters.toDate}
          />
        </label>
        <label>
          最短耗时（毫秒）
          <input
            min="0"
            onChange={(event) => update("minDuration", event.target.value)}
            type="number"
            value={filters.minDuration}
          />
        </label>
        <label>
          最长耗时（毫秒）
          <input
            min="0"
            onChange={(event) => update("maxDuration", event.target.value)}
            type="number"
            value={filters.maxDuration}
          />
        </label>
      </div>
    </section>
  );
}
