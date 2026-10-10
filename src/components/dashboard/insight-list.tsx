import { AlertTriangle, Info, TrendingDown, TrendingUp } from "lucide-react";
import type { Insight } from "@/lib/insights";

const META = {
  problem: { icon: AlertTriangle, label: "Problema frecuente", cls: "text-amber-700 bg-amber-50" },
  decline: { icon: TrendingDown, label: "Empeoró", cls: "text-red-700 bg-red-50" },
  improvement: { icon: TrendingUp, label: "Mejoró", cls: "text-emerald-700 bg-emerald-50" },
  info: { icon: Info, label: "Dato", cls: "text-sky-700 bg-sky-50" },
} as const;

export function InsightList({ insights }: { insights: Insight[] }) {
  return (
    <ul className="space-y-3">
      {insights.map((i, idx) => {
        const m = META[i.kind];
        return (
          <li key={idx} className="flex gap-3">
            <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${m.cls}`}>
              <m.icon className="size-4" aria-hidden />
            </span>
            <div>
              <p className="text-xs font-medium text-muted">{m.label}</p>
              <p className="text-sm text-slate-800">{i.text}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
