"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/types";
import { projects, normalizeProject, StorageFullError } from "@/lib/storage";
import { createProject } from "@/lib/defaults";
import { uid } from "@/lib/ids";
import { slugify } from "@/lib/export/filenames";
import { downloadBlob } from "@/lib/export/output";
import { TEMPLATES } from "@/data/templates/googleMaps";
import { ScaledSlide } from "@/components/slide/ScaledSlide";
import { Button } from "@/components/ui/controls";
import { IconCopy, IconDownload, IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";

/** Copia con ids nuevos (proyecto y slides) para que no pise al original. */
export function cloneProject(p: Project, name: string): Project {
  const now = Date.now();
  return {
    ...structuredClone(p),
    id: uid("p_"),
    name,
    createdAt: now,
    updatedAt: now,
    slides: p.slides.map((s) => ({ ...structuredClone(s), id: uid("s_") })),
  };
}

function when(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "recién";
  if (diff < 3_600_000) return `hace ${Math.round(diff / 60_000)} min`;
  if (diff < 86_400_000) return `hace ${Math.round(diff / 3_600_000)} h`;
  return new Date(ts).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" });
}

export function ProjectsDialog({
  current,
  onOpen,
  onRenameCurrent,
  onClose,
  flush,
}: {
  current: Project;
  onOpen: (p: Project) => void;
  onRenameCurrent: (name: string) => void;
  onClose: () => void;
  /** Guarda el proyecto actual antes de listar o cambiar de proyecto. */
  flush: () => Promise<void>;
}) {
  const [list, setList] = useState<Project[] | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const importInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(async () => {
    await flush().catch(() => undefined);
    setList(await projects.list());
  }, [flush]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !renaming && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, renaming]);

  const guard = async (fn: () => Promise<void>) => {
    setError("");
    try {
      await fn();
    } catch (e) {
      setError(e instanceof StorageFullError ? e.message : e instanceof Error ? e.message : "No se pudo completar la acción.");
    }
  };

  const open = (p: Project) =>
    guard(async () => {
      await flush();
      onOpen(p);
      onClose();
    });

  const create = (p: Project) =>
    guard(async () => {
      await flush();
      await projects.save(p);
      onOpen(p);
      onClose();
    });

  const duplicate = (p: Project) =>
    guard(async () => {
      const copy = cloneProject(p.id === current.id ? current : p, `${p.name} (copia)`);
      await projects.save(copy);
      await refresh();
    });

  const commitRename = (p: Project) =>
    guard(async () => {
      const name = draft.trim() || p.name;
      if (p.id === current.id) onRenameCurrent(name);
      else await projects.save({ ...p, name, updatedAt: Date.now() });
      setRenaming(null);
      await refresh();
    });

  const remove = (p: Project) =>
    guard(async () => {
      if (!confirm(`¿Eliminar "${p.name}"? No se puede deshacer.`)) return;
      await projects.remove(p.id);
      if (p.id === current.id) {
        // Se abre el siguiente proyecto o uno nuevo, para no quedar editando uno borrado.
        const rest = (await projects.list()).filter((x) => x.id !== p.id);
        const next = rest[0] ?? createProject();
        if (!rest[0]) await projects.save(next);
        onOpen(next);
      }
      setList(await projects.list());
    });

  const exportJson = (p: Project) => {
    const data = p.id === current.id ? current : p;
    downloadBlob(new Blob([JSON.stringify({ app: "carrusel-studio", version: 1, project: data }, null, 2)], { type: "application/json" }), `${slugify(p.name)}.json`);
  };

  const importJson = (file?: File) =>
    guard(async () => {
      if (!file) return;
      const parsed = JSON.parse(await file.text()) as { project?: unknown };
      const p = normalizeProject(parsed.project ?? parsed);
      if (!p) throw new Error("El archivo no es un proyecto válido.");
      await create(cloneProject(p, p.name));
    });

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="projects-title" className="animate-rise flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
        <div className="flex flex-wrap items-center gap-3 border-b border-line p-5">
          <div className="flex-1">
            <h2 id="projects-title" className="font-display text-2xl font-bold">
              Proyectos
            </h2>
            <p className="text-xs text-muted">Se guardan solos en este navegador.</p>
          </div>
          <Button variant="primary" onClick={() => create(createProject())}>
            <IconPlus /> Nuevo
          </Button>
          {TEMPLATES.map((tpl) => (
            <Button key={tpl.id} variant="outline" onClick={() => create(tpl.create())} title={tpl.name}>
              Plantilla Google Maps
            </Button>
          ))}
          <Button variant="ghost" onClick={() => importInput.current?.click()} title="Abrir un proyecto descargado como .json">
            Importar
          </Button>
          <input ref={importInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => importJson(e.target.files?.[0])} />
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label="Cerrar">
            ✕
          </button>
        </div>

        {error && <p className="mx-5 mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

        <div className="scroll-thin flex-1 overflow-y-auto p-5">
          {list === null && <p className="text-sm text-muted">Cargando…</p>}
          {list?.length === 0 && <p className="text-sm text-muted">Todavía no hay proyectos guardados.</p>}
          <ul className="grid gap-3 sm:grid-cols-2">
            {list?.map((p) => {
              const isCurrent = p.id === current.id;
              const shown = isCurrent ? current : p;
              return (
                <li key={p.id} className={`flex gap-3 rounded-2xl border p-3 transition ${isCurrent ? "border-accent/70 bg-accent/5" : "border-line hover:border-line-strong"}`}>
                  <button type="button" onClick={() => open(p)} className="shrink-0 overflow-hidden rounded-md ring-1 ring-line" aria-label={`Abrir ${p.name}`}>
                    {shown.slides[0] ? (
                      <ScaledSlide width={76} number={1} total={shown.slides.length} slide={shown.slides[0]} design={shown.design} format={shown.format} businessName={shown.brief.businessName} />
                    ) : (
                      <div className="grid h-[101px] w-[76px] place-items-center text-[10px] text-faint" style={{ background: shown.design.background }}>
                        Sin slides
                      </div>
                    )}
                  </button>
                  <div className="flex min-w-0 flex-1 flex-col">
                    {renaming === p.id ? (
                      <input
                        autoFocus
                        aria-label="Nuevo nombre"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename(p);
                          if (e.key === "Escape") setRenaming(null);
                        }}
                        onBlur={() => commitRename(p)}
                        className="rounded-lg border border-accent/60 bg-bg px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <button type="button" onClick={() => open(p)} className="truncate text-left text-sm font-semibold hover:text-accent" title={shown.name}>
                        {shown.name}
                      </button>
                    )}
                    <span className="mt-0.5 text-[11px] text-muted">
                      {shown.slides.length} slides · {shown.format.replace("x", "×")} · {when(shown.updatedAt)}
                      {isCurrent && <span className="ml-1 text-accent">· abierto</span>}
                    </span>
                    <span className="flex-1" />
                    <div className="mt-2 flex gap-1">
                      <IconBtn
                        label="Renombrar"
                        onClick={() => {
                          setDraft(shown.name);
                          setRenaming(p.id);
                        }}
                      >
                        <IconEdit size={14} />
                      </IconBtn>
                      <IconBtn label="Duplicar" onClick={() => duplicate(p)}>
                        <IconCopy size={14} />
                      </IconBtn>
                      <IconBtn label="Descargar copia (.json)" onClick={() => exportJson(p)}>
                        <IconDownload size={14} />
                      </IconBtn>
                      <IconBtn label="Eliminar" danger onClick={() => remove(p)}>
                        <IconTrash size={14} />
                      </IconBtn>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

function IconBtn({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`rounded-lg border border-line p-1.5 text-muted transition hover:text-white ${danger ? "hover:border-red-500/40 hover:text-red-300" : "hover:border-line-strong"}`}
    >
      {children}
    </button>
  );
}
