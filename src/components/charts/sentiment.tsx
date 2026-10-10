import { CHART } from "./tokens";
import { formatNumber } from "@/lib/format";

/** Barra apilada 100 % positivas / neutrales / negativas, con leyenda y valores visibles. */
export function SentimentBar({
  positive,
  neutral,
  negative,
  thresholds,
}: {
  positive: number;
  neutral: number;
  negative: number;
  thresholds: { positiveMin: number; negativeMax: number };
}) {
  const total = positive + neutral + negative;
  const parts = [
    { key: "pos", label: "Positivas", n: positive, color: CHART.positive, rule: `${thresholds.positiveMin}${thresholds.positiveMin < 5 ? "–5" : ""} ★` },
    {
      key: "neu",
      label: "Neutrales",
      n: neutral,
      color: CHART.neutral,
      rule: thresholds.positiveMin - thresholds.negativeMax > 1
        ? `${thresholds.negativeMax + 1}${thresholds.positiveMin - 1 > thresholds.negativeMax + 1 ? `–${thresholds.positiveMin - 1}` : ""} ★`
        : "—",
    },
    { key: "neg", label: "Negativas", n: negative, color: CHART.negative, rule: `1${thresholds.negativeMax > 1 ? `–${thresholds.negativeMax}` : ""} ★` },
  ];
  return (
    <div>
      <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={parts.map((p) => `${p.label}: ${p.n}`).join(", ")}>
        {total > 0 &&
          parts.map((p) =>
            p.n > 0 ? <span key={p.key} title={`${p.label}: ${p.n}`} style={{ width: `${(p.n / total) * 100}%`, background: p.color }} className="h-full first:rounded-l-full last:rounded-r-full" /> : null,
          )}
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {parts.map((p) => (
          <div key={p.key}>
            <dt className="flex items-center gap-1.5 text-xs text-muted">
              <span className="inline-block h-0.5 w-3 rounded" style={{ background: p.color }} aria-hidden />
              {p.label} <span className="hidden sm:inline">({p.rule})</span>
            </dt>
            <dd className="mt-0.5 text-lg font-semibold text-ink">
              {total ? `${formatNumber((p.n / total) * 100)}%` : "—"}
              <span className="ml-1 text-xs font-normal text-muted">{formatNumber(p.n)}</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
