import { contrastLevel, contrastRatio } from "@/lib/color";

/** Muestra el contraste WCAG entre dos colores. `large` = texto de título (≥ 24 px). */
export function ContrastBadge({ fg, bg, label, large = false }: { fg: string; bg: string; label: string; large?: boolean }) {
  const ratio = contrastRatio(fg, bg);
  const level = contrastLevel(ratio);
  const ok = level === "AAA" || level === "AA" || (large && level === "AA grande");
  return (
    <div className="flex items-center justify-between gap-2 text-xs">
      <span className="flex items-center gap-2 text-muted">
        <span className="grid h-5 w-5 place-items-center rounded-md text-[10px] font-bold" style={{ background: bg, color: fg, boxShadow: "inset 0 0 0 1px #ffffff1a" }}>
          Aa
        </span>
        {label}
      </span>
      <span className={`rounded-md px-1.5 py-0.5 font-medium tabular-nums ${ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>
        {ratio.toFixed(1)}:1 · {ok ? level : "Bajo contraste"}
      </span>
    </div>
  );
}
