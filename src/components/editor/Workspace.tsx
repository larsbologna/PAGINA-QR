"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import type { Recipe } from "@/lib/projectOps";
import { moveSlide } from "@/lib/projectOps";
import { getFormat } from "@/lib/formats";
import { categoryOf } from "@/lib/content/categories";
import { FluidSlide, ScaledSlide, type Guides } from "@/components/slide/ScaledSlide";
import { IconLeft, IconPlus, IconRight } from "@/components/ui/icons";

export type ViewMode = "single" | "all";
type Zoom = "fit" | number;

const ZOOMS = [0.25, 0.33, 0.5, 0.75, 1];

export function Workspace({
  project,
  apply,
  selectedId,
  onSelect,
  onAdd,
}: {
  project: Project;
  apply: (r: Recipe, key?: string) => void;
  selectedId: string;
  onSelect: (id: string) => void;
  onAdd: () => void;
}) {
  const [view, setView] = useState<ViewMode>("single");
  const [zoom, setZoom] = useState<Zoom>("fit");
  const [guides, setGuides] = useState<Guides>({ safe: false, margins: false });
  const stage = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 800, h: 600 });
  const [dragId, setDragId] = useState<string | null>(null);

  const f = getFormat(project.format);
  const roleInfo = categoryOf(project.brief).roles;
  const slides = project.slides;
  const index = Math.max(0, slides.findIndex((s) => s.id === selectedId));
  const current = slides[index];
  const common = { total: slides.length, design: project.design, format: project.format, businessName: project.brief.businessName };

  useLayoutEffect(() => {
    const el = stage.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setBox({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const go = (delta: number) => {
    const next = slides[Math.min(slides.length - 1, Math.max(0, index + delta))];
    if (next) onSelect(next.id);
  };

  // Flechas del teclado para recorrer los slides (fuera de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const fitScale = Math.max(0.1, Math.min((box.w - 48) / f.width, (box.h - 48) / f.height));
  const scale = zoom === "fit" ? fitScale : zoom;
  const zoomStep = (dir: 1 | -1) => {
    const cur = scale;
    const next = dir > 0 ? ZOOMS.find((z) => z > cur + 0.001) : [...ZOOMS].reverse().find((z) => z < cur - 0.001);
    if (next) setZoom(next);
  };

  const toolBtn = (active: boolean) =>
    `rounded-lg px-2 py-1.5 text-xs font-medium transition ${active ? "bg-white/10 text-white" : "text-muted hover:bg-white/5 hover:text-white"}`;

  return (
    <div className="flex h-full min-h-[560px] flex-col">
      {/* Barra de vista */}
      <div className="flex shrink-0 flex-wrap items-center gap-0.5 border-b border-line bg-panel/60 px-2 py-2">
        <div className="flex rounded-xl border border-line bg-bg p-0.5" role="radiogroup" aria-label="Vista">
          <button role="radio" aria-checked={view === "single"} className={toolBtn(view === "single")} onClick={() => setView("single")}>
            Individual
          </button>
          <button role="radio" aria-checked={view === "all"} className={toolBtn(view === "all")} onClick={() => setView("all")}>
            Todos
          </button>
        </div>

        <div className="mx-0.5 h-5 w-px bg-line" />

        <button className={toolBtn(false)} onClick={() => zoomStep(-1)} aria-label="Alejar">
          −
        </button>
        <button className={`${toolBtn(zoom === "fit")} min-w-16 tabular-nums`} onClick={() => setZoom("fit")} title="Ajustar a la pantalla">
          {zoom === "fit" ? "Ajustar" : `${Math.round(scale * 100)} %`}
        </button>
        <button className={toolBtn(false)} onClick={() => zoomStep(1)} aria-label="Acercar">
          +
        </button>
        <button className={toolBtn(zoom === 1)} onClick={() => setZoom(1)} title="Tamaño real de exportación">
          100 %
        </button>

        <div className="mx-0.5 h-5 w-px bg-line" />

        <button aria-pressed={guides.safe} className={toolBtn(guides.safe)} onClick={() => setGuides((g) => ({ ...g, safe: !g.safe }))}>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-sm border border-dashed border-cyan-300 align-middle" />
          Área segura
        </button>
        <button aria-pressed={guides.margins} className={toolBtn(guides.margins)} onClick={() => setGuides((g) => ({ ...g, margins: !g.margins }))}>
          <span className="mr-1.5 inline-block h-2 w-2 rounded-sm bg-rose-400/70 align-middle" />
          Márgenes
        </button>

        <span className="flex-1" />

        <span className="hidden text-xs text-faint 2xl:inline">
          {f.width} × {f.height} px
        </span>
        <div className="flex items-center gap-0.5">
          <button className={toolBtn(false)} onClick={() => go(-1)} disabled={index === 0} aria-label="Slide anterior">
            <IconLeft />
          </button>
          <span className="min-w-12 text-center text-xs tabular-nums text-white/80">
            {index + 1} / {slides.length}
          </span>
          <button className={toolBtn(false)} onClick={() => go(1)} disabled={index === slides.length - 1} aria-label="Slide siguiente">
            <IconRight />
          </button>
        </div>
      </div>

      {/* Lienzo */}
      <div ref={stage} className="scroll-thin relative min-h-0 flex-1 overflow-auto bg-[radial-gradient(circle_at_center,#151515_0,#0a0a0a_70%)]">
        {view === "single" && current && (
          <div className="flex min-h-full min-w-full items-center justify-center p-6" style={{ width: f.width * scale + 48 > box.w ? f.width * scale + 48 : undefined }}>
            <div className="animate-rise overflow-hidden rounded-md shadow-[0_40px_120px_-30px_rgba(0,0,0,0.9)] ring-1 ring-white/10" key={current.id}>
              <ScaledSlide width={Math.round(f.width * scale)} number={index + 1} slide={current} guides={guides} {...common} />
            </div>
          </div>
        )}
        {view === "all" && (
          <div
            className="grid gap-5 p-6"
            style={{ gridTemplateColumns: zoom === "fit" ? "repeat(auto-fill, minmax(200px, 1fr))" : `repeat(auto-fill, ${Math.round(f.width * scale)}px)` }}
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onSelect(s.id)}
                onDoubleClick={() => {
                  onSelect(s.id);
                  setView("single");
                }}
                className={`group text-left transition ${s.id === selectedId ? "" : "opacity-90 hover:opacity-100"}`}
                title="Doble clic para abrirlo en vista individual"
              >
                <div className={`overflow-hidden rounded-md ring-2 transition ${s.id === selectedId ? "ring-accent" : "ring-transparent group-hover:ring-white/20"}`}>
                  <FluidSlide number={i + 1} slide={s} guides={guides} {...common} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                  <span className="font-semibold text-white/80 tabular-nums">{i + 1}</span>
                  {roleInfo[s.role].label}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tira de miniaturas (arrastrá para reordenar) */}
      <div className="scroll-thin flex shrink-0 items-center gap-2.5 overflow-x-auto border-t border-line bg-panel px-3 py-3" aria-label="Miniaturas">
        {slides.map((s, i) => (
          <button
            key={s.id}
            type="button"
            draggable
            onDragStart={() => setDragId(s.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId && dragId !== s.id) {
                const from = slides.findIndex((x) => x.id === dragId);
                apply(moveSlide(dragId, i - from));
              }
              setDragId(null);
            }}
            onDragEnd={() => setDragId(null)}
            onClick={() => onSelect(s.id)}
            aria-label={`Slide ${i + 1}: ${roleInfo[s.role].label}`}
            aria-current={s.id === selectedId}
            className={`relative shrink-0 cursor-grab overflow-hidden rounded-md ring-2 transition active:cursor-grabbing ${
              s.id === selectedId ? "ring-accent" : "ring-line hover:ring-line-strong"
            } ${dragId === s.id ? "opacity-40" : ""}`}
          >
            <ScaledSlide width={68} number={i + 1} slide={s} {...common} />
            <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1 text-[10px] font-bold tabular-nums text-white">{i + 1}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={onAdd}
          disabled={slides.length >= 10}
          className="grid h-[90px] w-[68px] shrink-0 place-items-center rounded-md border border-dashed border-line-strong text-muted transition hover:border-accent hover:text-accent disabled:opacity-30"
          aria-label="Agregar slide"
          title="Agregar slide después del seleccionado"
          style={{ height: Math.round((68 * f.height) / f.width) }}
        >
          <IconPlus />
        </button>
      </div>
    </div>
  );
}
