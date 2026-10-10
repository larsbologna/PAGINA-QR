import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export function StatCard({ label, value, sub, delta }: { label: string; value: ReactNode; sub?: ReactNode; delta?: ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-white px-4 py-4 sm:px-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1.5 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">{value}</p>
      {(sub || delta) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          {delta}
          {sub}
        </div>
      )}
    </div>
  );
}

/** Variación respecto del período anterior, con ícono y texto (nunca solo color). */
export function Delta({ current, previous, digits = 0, suffix = "", higherIsBetter = true }: {
  current: number | null;
  previous: number | null;
  digits?: number;
  suffix?: string;
  higherIsBetter?: boolean;
}) {
  if (current === null || previous === null) return <span className="text-muted">Sin datos del período anterior</span>;
  const diff = current - previous;
  const rounded = Number(diff.toFixed(digits));
  if (rounded === 0)
    return (
      <span className="inline-flex items-center gap-0.5 text-slate-600">
        <Minus className="size-3.5" aria-hidden /> Igual que el período anterior
      </span>
    );
  const good = higherIsBetter ? diff > 0 : diff < 0;
  const Icon = diff > 0 ? ArrowUpRight : ArrowDownRight;
  const abs = Math.abs(diff).toLocaleString("es-AR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
  return (
    <span className={cn("inline-flex items-center gap-0.5 font-medium", good ? "text-emerald-700" : "text-red-700")}>
      <Icon className="size-3.5" aria-hidden />
      {diff > 0 ? "+" : "−"}
      {abs}
      {suffix} vs. período anterior
    </span>
  );
}
