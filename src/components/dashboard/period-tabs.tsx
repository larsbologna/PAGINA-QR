import Link from "next/link";
import { PERIOD_OPTIONS } from "@/lib/periods";
import { cn } from "@/lib/cn";

export function PeriodTabs({ basePath, current, extra = {} }: { basePath: string; current: string; extra?: Record<string, string> }) {
  return (
    <nav aria-label="Período" className="inline-flex rounded-lg border border-line bg-white p-0.5 shadow-sm no-print">
      {PERIOD_OPTIONS.map((p) => {
        const qs = new URLSearchParams({ ...extra, periodo: p.value }).toString();
        const active = p.value === current;
        return (
          <Link
            key={p.value}
            href={`${basePath}?${qs}`}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm",
              active ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
            )}
          >
            {p.value === "365" ? "12 meses" : `${p.days} días`}
          </Link>
        );
      })}
    </nav>
  );
}
