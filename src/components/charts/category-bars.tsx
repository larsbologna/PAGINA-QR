import { CHART } from "./tokens";
import { formatNumber } from "@/lib/format";

export function CategoryBars({ rows, valueLabel }: { rows: { name: string; value: number; hint?: string }[]; valueLabel: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3" aria-label={valueLabel}>
      {rows.map((r) => (
        <li key={r.name} title={`${r.name}: ${r.value} ${valueLabel}`}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-800">{r.name}</span>
            <span className="shrink-0 text-slate-700 tabular-nums">
              {formatNumber(r.value)}
              {r.hint && <span className="ml-1 text-xs text-muted">{r.hint}</span>}
            </span>
          </div>
          <span className="mt-1 block h-2 rounded-full bg-slate-100">
            <span className="block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, minWidth: r.value ? 4 : 0, background: CHART.series1 }} />
          </span>
        </li>
      ))}
    </ul>
  );
}
