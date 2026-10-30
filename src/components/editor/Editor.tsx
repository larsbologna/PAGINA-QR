"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { projects, StorageFullError } from "@/lib/storage";
import { useProjectStore } from "@/lib/store";
import { rename, setBrief, setPlan, setStage } from "@/lib/projectOps";
import { GENERATORS, getGenerator } from "@/lib/content/providers";
import { ConfigPanel } from "./ConfigPanel";
import { PlanView } from "./PlanView";
import { BriefIntro } from "./BriefIntro";
import { Workspace } from "./Workspace";
import { Inspector } from "./Inspector";
import { buildSlide } from "@/lib/content/templateGenerator";
import { Button } from "@/components/ui/controls";
import { IconCheck, IconDownload, IconFolder, IconRedo, IconSparkle, IconUndo } from "@/components/ui/icons";
import { UiAccentPicker } from "./UiAccentPicker";
import { ExportDialog } from "./ExportDialog";
import { ProjectsDialog } from "./ProjectsDialog";

type MobileTab = "config" | "canvas" | "inspect";

type SaveState = { kind: "saved" } | { kind: "pending" } | { kind: "error"; message: string };

export function Editor({ initial }: { initial: Project }) {
  const store = useProjectStore(() => initial);
  const { project, apply, undo, redo, canUndo, canRedo, load } = store;
  const [tab, setTab] = useState<MobileTab>("config");
  const [busy, setBusy] = useState(false);
  const generator = getGenerator(GENERATORS[0].id);
  const [selected, setSelected] = useState("");
  const [exporting, setExporting] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [save, setSave] = useState<SaveState>({ kind: "saved" });

  // ——— Guardado automático (y manual con Ctrl/Cmd+S o el botón) ———
  const latest = useRef(project);
  latest.current = project;
  const lastSaved = useRef<Project | null>(initial);

  const flush = useCallback(async () => {
    const p = latest.current;
    if (lastSaved.current === p) return;
    try {
      await projects.save(p);
      lastSaved.current = p;
      setSave({ kind: "saved" });
    } catch (e) {
      setSave({ kind: "error", message: e instanceof StorageFullError ? e.message : "No se pudo guardar el proyecto." });
      throw e;
    }
  }, []);

  useEffect(() => {
    if (lastSaved.current === project) return;
    setSave({ kind: "pending" });
    const t = setTimeout(() => flush().catch(() => undefined), 700);
    return () => clearTimeout(t);
  }, [project, flush]);

  useEffect(() => {
    projects.setLastOpened(project.id);
  }, [project.id]);

  // Si se cierra la pestaña con cambios pendientes, se guardan igual.
  useEffect(() => {
    const onHide = () => {
      if (lastSaved.current !== latest.current) projects.save(latest.current).catch(() => undefined);
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, []);

  const openProject = useCallback(
    (p: Project) => {
      lastSaved.current = p;
      load(p);
      setSelected("");
      setSave({ kind: "saved" });
    },
    [load],
  );

  const startFromTemplate = useCallback(
    async (p: Project) => {
      await flush().catch(() => undefined);
      await projects.save(p).catch(() => undefined);
      openProject(p);
    },
    [flush, openProject],
  );
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
    if (!project.brief.category) return;
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
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        flush().catch(() => undefined);
        return;
      }
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
  }, [undo, redo, flush]);

  const steps = [
    { id: "brief", label: "Brief" },
    { id: "plan", label: "Estructura" },
    { id: "edit", label: "Diseño" },
  ] as const;
  const stepIndex = steps.findIndex((s) => s.id === project.stage);

  return (
    <div className="flex h-dvh flex-col bg-bg text-white">
      {/* Barra superior */}
      <header className="relative z-20 flex h-14 shrink-0 items-center gap-1.5 border-b border-line bg-panel/80 px-3 backdrop-blur sm:gap-3 md:px-4">
        <div className="hidden items-center gap-2 sm:flex">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-accent-ink shadow-[0_0_24px_-6px_var(--ui-accent)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <rect x="3" y="5" width="11" height="14" rx="2" />
              <path d="M17 7v10M21 9v6" />
            </svg>
          </span>
          <span className="hidden font-display text-[15px] font-bold tracking-tight xl:block">Carrusel Studio</span>
        </div>

        <Button variant="outline" className="px-2.5 text-xs" onClick={() => setShowProjects(true)} title="Abrir, duplicar, renombrar o eliminar proyectos">
          <IconFolder /> <span className="hidden md:inline">Proyectos</span>
        </Button>

        <input
          aria-label="Nombre del proyecto"
          title={project.name}
          value={project.name}
          onChange={(e) => apply(rename(e.target.value), "name")}
          className="min-w-0 flex-1 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-sm text-white/80 outline-none hover:border-line focus:border-accent/60 md:max-w-xs"
        />

        <button
          type="button"
          onClick={() => flush().catch(() => undefined)}
          title={save.kind === "error" ? save.message : "Guardar ahora (Ctrl+S)"}
          aria-live="polite"
          className={`hidden shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] transition sm:flex ${
            save.kind === "error" ? "bg-red-500/15 text-red-300" : "text-muted hover:bg-white/5 hover:text-white"
          }`}
        >
          {save.kind === "saved" && (
            <>
              <IconCheck size={12} /> Guardado
            </>
          )}
          {save.kind === "pending" && (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Guardando…
            </>
          )}
          {save.kind === "error" && <>⚠ Sin guardar</>}
        </button>

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
          <Button
            variant="primary"
            className="ml-1 px-3 text-xs tracking-wide sm:ml-2 sm:px-4"
            onClick={() => setExporting(true)}
            disabled={!project.slides.length}
            title={project.slides.length ? "Exportar los slides como PNG" : "Primero generá la estructura"}
          >
            <IconDownload /> <span className="hidden sm:inline">EXPORTAR A PNG</span>
          </Button>
        </div>
      </header>
      {save.kind === "error" && (
        <div role="alert" className="border-b border-red-500/30 bg-red-500/10 px-4 py-2 text-center text-xs text-red-200">
          {save.message}
        </div>
      )}
      {showProjects && (
        <ProjectsDialog
          current={project}
          flush={flush}
          onOpen={openProject}
          onRenameCurrent={(name) => apply(rename(name))}
          onClose={() => setShowProjects(false)}
        />
      )}
      {exporting && <ExportDialog project={project} currentId={selectedSlide?.id} onClose={() => setExporting(false)} />}

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
            <Button
              variant="primary"
              className="w-full py-3"
              onClick={propose}
              disabled={busy || !project.brief.category}
              title={project.brief.category ? undefined : "Primero elegí el tipo de carrusel"}
            >
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
              onLoadTemplate={startFromTemplate}
              onCategory={(category) => apply(setBrief({ category }))}
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
