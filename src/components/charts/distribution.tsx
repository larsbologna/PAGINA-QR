import { CHART } from "./tokens";
import { RATING_LABELS } from "@/lib/rating";
import { formatNumber } from "@/lib/format";

/** Distribución 1–5 estrellas: barras horizontales con etiqueta directa (sirve también como tabla). */
export function DistributionBars({ distribution }: { distribution: number[] }) {
  const total = distribution.reduce((a, n) => a + n, 0);
  const max = Math.max(1, ...distribution);
  return (
    <ul className="space-y-2.5" aria-label="Distribución de puntuaciones">
      {[5, 4, 3, 2, 1].map((stars) => {
        const n = distribution[stars - 1] ?? 0;
        const pct = total ? (n / total) * 100 : 0;
        return (
          <li key={stars} className="grid grid-cols-[4.5rem_1fr_4.5rem] items-center gap-3 text-sm" title={`${stars} estrellas (${RATING_LABELS[stars]}): ${n} opiniones`}>
            <span className="text-slate-700 tabular-nums">
              {stars} <span aria-hidden>★</span>
              <span className="sr-only">estrellas</span>
            </span>
            <span className="h-2.5 rounded-full bg-slate-100">
              <span
                className="block h-full rounded-full"
                style={{ width: `${(n / max) * 100}%`, minWidth: n ? 4 : 0, background: CHART.series1 }}
              />
            </span>
            <span className="text-right text-slate-700 tabular-nums">
              {formatNumber(n)} <span className="text-xs text-muted">({formatNumber(pct)}%)</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}
