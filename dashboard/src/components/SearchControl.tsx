interface SearchControlProps {
  open: boolean;
  value: string;
  onToggle: () => void;
  onChange: (value: string) => void;
}

export function SearchControl({
  open,
  value,
  onToggle,
  onChange,
}: SearchControlProps) {
  return (
    <div className="search-control">
      {open && (
        <input
          aria-label="搜索测试记录"
          autoFocus
          onChange={(event) => onChange(event.target.value)}
          placeholder="搜索记录、匿名 ID 或事件"
          type="search"
          value={value}
        />
      )}
      <button className="button button-secondary" onClick={onToggle} type="button">
        <span aria-hidden="true">⌕</span>
        搜索
      </button>
    </div>
  );
}
