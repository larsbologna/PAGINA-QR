"use client";
import { useCallback, useEffect, useState } from "react";
import { useProjectStore } from "@/lib/store";
import { createGoogleMapsProject } from "@/data/templates/googleMaps";
import { rename, setPlan, setStage } from "@/lib/projectOps";
import { GENERATORS, getGenerator } from "@/lib/content/providers";
import { ConfigPanel } from "./ConfigPanel";
import { PlanView } from "./PlanView";
import { BriefIntro } from "./BriefIntro";
import { Workspace } from "./Workspace";
import { Inspector } from "./Inspector";
import { buildSlide } from "@/lib/content/templateGenerator";
import { Button } from "@/components/ui/controls";
import { IconRedo, IconSparkle, IconUndo } from "@/components/ui/icons";
import { UiAccentPicker } from "./UiAccentPicker";

type MobileTab = "config" | "canvas" | "inspect";

export function Editor() {
  const store = useProjectStore(() => createGoogleMapsProject());
  const { project, apply, undo, redo, canUndo, canRedo, load } = store;
  const [tab, setTab] = useState<MobileTab>("config");
  const [busy, setBusy] = useState(false);
  const generator = getGenerator(GENERATORS[0].id);
  const [selected, setSelected] = useState("");
  // Si el slide seleccionado ya no existe (borrado, deshacer), se toma el primero.
  const selectedSlide = project.slides.find((s) => s.id === selected) ?? project.slides[0];

  const addSlide = useCallback(() => {
    const fresh = buildSlide("tip", project.brief, project.design.imageStyle, project.slides.filter((s) => s.role === "tip").length);
    apply((p) => {
      if (p.slides.length >= 10) return p;
      const at = p.slides.findIndex((s) => s.id === selectedSlide?.id) + 1 || p.slides.length;
      const slides = [...p.slides];
      slides.splice(at, 0, fresh);
      return { ...p, slides, slideCount: slides.length };
    });
    setSelected(fresh.id);
  }, [apply, project.brief, project.design.imageStyle, project.slides, selectedSlide?.id]);

  const propose = useCallback(async () => {
    if (project.slides.length && !confirm("Esto reemplaza los slides actuales por una propuesta nueva. ¿Seguimos? (Podés deshacer)")) return;
    setBusy(true);
    try {
      const slides = await generator.generatePlan({ brief: project.brief, count: project.slideCount, imageStyle: project.design.imageStyle });
      apply(setPlan(slides));
      setTab("canvas");
    } finally {
      setBusy(false);
    }
  }, [apply, generator, project.brief, project.design.imageStyle, project.slideCount, project.slides.length]);

  // Atajos: Ctrl/Cmd+Z deshacer, Ctrl/Cmd+Shift+Z o Ctrl+Y rehacer (fuera de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === "z" && e.shiftKey) || k === "y") {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  const steps = [
    { id: "brief", label: "Brief" },
    { id: "plan", label: "Estructura" },
    { id: "edit", label: "Diseño" },
  ] as const;
  const stepIndex = steps.findIndex((s) => s.id === project.stage);

  return (
    <div className="flex h-dvh flex-col bg-bg text-white">
      {/* Barra superior */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-panel/80 px-3 backdrop-blur md:px-4">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink shadow-[0_0_24px_-6px_var(--ui-accent)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="5" width="11" height="14" rx="2" />
              <path d="M17 7v10M21 9v6" />
            </svg>
          </span>
          <span className="hidden font-display text-[15px] font-bold tracking-tight sm:block">Carrusel Studio</span>
        </div>

        <input
          aria-label="Nombre del proyecto"
          title={project.name}
          value={project.name}
          onChange={(e) => apply(rename(e.target.value), "name")}
          className="min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-white/80 outline-none hover:border-line focus:border-accent/60 md:max-w-xs"
        />

        <nav aria-label="Etapas" className="flex items-center gap-0.5 lg:gap-1">
          {steps.map((s, i) => {
            const reachable = i <= stepIndex || (s.id === "plan" && project.slides.length > 0) || (s.id === "edit" && project.slides.length > 0);
            return (
              <button
                key={s.id}
                title={s.label}
                type="button"
                disabled={!reachable}
                onClick={() => apply(setStage(s.id))}
                className={`flex items-center gap-2 rounded-full px-1.5 py-1 text-xs lg:px-3 transition disabled:opacity-30 ${
                  project.stage === s.id ? "bg-white/10 text-white" : "text-muted hover:text-white"
                }`}
              >
                <span
                  className={`grid h-5 w-5 place-items-center rounded-full text-[10px] font-bold ${
                    i < stepIndex ? "bg-accent text-accent-ink" : project.stage === s.id ? "bg-accent/20 text-accent" : "bg-white/10"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="hidden lg:inline">{s.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="flex items-center gap-1">
          <Button variant="ghost" className="px-2" aria-label="Deshacer" title="Deshacer (Ctrl+Z)" onClick={undo} disabled={!canUndo}>
            <IconUndo />
          </Button>
          <Button variant="ghost" className="px-2" aria-label="Rehacer" title="Rehacer (Ctrl+Shift+Z)" onClick={redo} disabled={!canRedo}>
            <IconRedo />
          </Button>
          <UiAccentPicker />
        </div>
      </header>

      {/* Pestañas en pantallas chicas */}
      <div className="flex shrink-0 border-b border-line bg-panel lg:hidden" role="tablist">
        {(
          [
            ["config", "Configurar"],
            ["canvas", project.stage === "plan" ? "Estructura" : "Slides"],
            ...(project.stage === "edit" ? ([["inspect", "Editar slide"]] as const) : []),
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`flex-1 py-2.5 text-sm font-medium ${tab === id ? "border-b-2 border-accent text-white" : "text-muted"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1">
        {/* A. Panel de configuración */}
        <aside className={`scroll-thin w-full shrink-0 flex-col overflow-y-auto border-r border-line bg-panel lg:flex lg:w-[340px] ${tab === "config" ? "flex" : "hidden"}`}>
          <div className="flex-1">
            <ConfigPanel project={project} apply={apply} />
          </div>
          <div className="sticky bottom-0 space-y-2 border-t border-line bg-panel/95 p-4 backdrop-blur">
            <Button variant="primary" className="w-full py-3" onClick={propose} disabled={busy}>
              <IconSparkle /> {project.slides.length ? "Proponer estructura de nuevo" : "Proponer estructura"}
            </Button>
            <p className="text-center text-[11px] leading-snug text-faint">
              Fuente: <span className="text-muted">{generator.label}</span> · sin IA configurada
            </p>
          </div>
        </aside>

        {/* B/C. Área de trabajo */}
        <main
          className={`scroll-thin min-w-0 flex-1 lg:block ${project.stage === "edit" ? "overflow-hidden" : "overflow-y-auto"} ${tab === "canvas" ? "block" : "hidden"}`}
        >
          {project.stage === "brief" && <BriefIntro
              project={project}
              generatorDescription={generator.description}
              onPropose={propose}
              busy={busy}
              onLoadTemplate={(p) => {
                if (project.slides.length && !confirm("Se reemplaza el carrusel actual por la plantilla. ¿Seguimos?")) return;
                load(p);
                setSelected("");
              }}
            />}
          {project.stage === "plan" && <PlanView project={project} apply={apply} onRepropose={propose} />}
          {project.stage === "edit" && selectedSlide && (
            <Workspace project={project} apply={apply} selectedId={selectedSlide.id} onSelect={setSelected} onAdd={addSlide} />
          )}
        </main>

        {/* B. Edición del slide seleccionado */}
        {project.stage === "edit" && selectedSlide && (
          <aside
            className={`scroll-thin w-full shrink-0 overflow-y-auto border-l border-line bg-panel lg:block lg:w-[330px] ${tab === "inspect" ? "block" : "hidden"}`}
            aria-label="Edición del slide"
          >
            <Inspector project={project} slide={selectedSlide} apply={apply} onSelect={setSelected} />
          </aside>
        )}
      </div>
    </div>
  );
}
