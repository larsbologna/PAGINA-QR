"use client";
import { Portal } from "@/components/ui/Portal";
import { useEffect, useMemo, useState } from "react";
import type { VisualKind } from "@/lib/types";
import { VISUALS, VISUAL_GROUPS, makeVisual, type VisualGroup } from "@/lib/visuals";
import type { SlideTheme } from "@/components/slide/theme";
import { Visual } from "@/components/visuals/Visual";

const KINDS = Object.keys(VISUALS) as VisualKind[];

/** Galería con vista previa real de cada visual, en los colores del slide. */
function VisualPickerDialogContent({ current, theme, onPick, onClose }: { current: VisualKind; theme: SlideTheme; onPick: (k: VisualKind) => void; onClose: () => void }) {
  const [group, setGroup] = useState<VisualGroup | "Todos">("Todos");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return KINDS.filter((k) => (group === "Todos" || VISUALS[k].group === group) && (!q || VISUALS[k].label.toLowerCase().includes(q)));
  }, [group, query]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Elegir visual" className="animate-rise flex max-h-[90dvh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
        <div className="space-y-3 border-b border-line p-4">
          <div className="flex items-center gap-3">
            <h2 className="font-display text-xl font-bold">Elegí un visual</h2>
            <span className="text-xs text-muted">{KINDS.length - 1} disponibles · podés crear los tuyos con «Bloques», «Ícono grande» o «Dibujo propio»</span>
            <span className="flex-1" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar…"
              aria-label="Buscar visual"
              className="w-40 rounded-xl border border-line bg-bg px-3 py-1.5 text-sm outline-none focus:border-accent/60"
            />
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label="Cerrar">
              ✕
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5" role="tablist">
            {(["Todos", ...VISUAL_GROUPS] as const).map((g) => (
              <button
                key={g}
                type="button"
                role="tab"
                aria-selected={group === g}
                onClick={() => setGroup(g)}
                className={`rounded-full px-3 py-1 text-xs transition ${group === g ? "bg-accent text-accent-ink" : "border border-line text-muted hover:text-white"}`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {shown.map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => onPick(k)}
                aria-label={VISUALS[k].label}
                className={`group overflow-hidden rounded-2xl border text-left transition hover:border-accent ${k === current ? "border-accent ring-2 ring-accent/30" : "border-line"}`}
              >
                <div className="relative h-32 overflow-hidden" style={{ background: theme.bg }}>
                  <div className="absolute inset-3">{k === "none" ? null : <Visual visual={makeVisual(k)} t={theme} d3={false} />}</div>
                </div>
                <div className="px-3 py-2">
                  <div className="text-xs font-semibold text-white/90">{VISUALS[k].label}</div>
                  <div className="text-[10px] text-faint">{VISUALS[k].group}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function VisualPickerDialog(props: { current: VisualKind; theme: SlideTheme; onPick: (k: VisualKind) => void; onClose: () => void }) {
  return (
    <Portal>
      <VisualPickerDialogContent {...props} />
    </Portal>
  );
}
