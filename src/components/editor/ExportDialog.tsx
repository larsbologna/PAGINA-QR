"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { Project } from "@/lib/types";
import { getFormat } from "@/lib/formats";
import { getFont } from "@/lib/fonts";
import { contrastRatio } from "@/lib/color";
import { SlideCapturer, settle } from "@/lib/export/capture";
import { slideFileName, slugify } from "@/lib/export/filenames";
import { buildZip, downloadBlob, downloadEach, localSaveAvailable, saveToPublicExport, type ExportedFile } from "@/lib/export/output";
import { resolveTheme } from "@/components/slide/theme";
import { Slide } from "@/components/slide/Slide";
import { Button, Segmented, TextInput, Toggle } from "@/components/ui/controls";
import { IconDownload } from "@/components/ui/icons";

type Mode = "zip" | "png";
type Scope = "all" | "current";
type Status = { kind: "idle" } | { kind: "working"; done: number; total: number; label: string } | { kind: "done"; message: string } | { kind: "error"; message: string };

interface Issue {
  number: number;
  text: string;
}

export function ExportDialog({ project, currentId, onClose }: { project: Project; currentId?: string; onClose: () => void }) {
  const f = getFormat(project.format);
  const [mode, setMode] = useState<Mode>("zip");
  const [scope, setScope] = useState<Scope>("all");
  const [prefix, setPrefix] = useState(slugify(project.name));
  const [canSaveLocal, setCanSaveLocal] = useState(false);
  const [saveLocal, setSaveLocal] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [results, setResults] = useState<{ name: string; url: string }[]>([]);
  const [issues, setIssues] = useState<Issue[] | null>(null);
  const nodes = useRef<(HTMLDivElement | null)[]>([]);

  const selected = scope === "all" ? project.slides : project.slides.filter((s) => s.id === currentId);
  const numbers = selected.map((s) => project.slides.indexOf(s) + 1);

  useEffect(() => {
    localSaveAvailable().then((ok) => {
      setCanSaveLocal(ok);
      setSaveLocal(ok);
    });
  }, []);

  // Liberar las vistas previas al cerrar.
  useEffect(() => () => results.forEach((r) => URL.revokeObjectURL(r.url)), [results]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && status.kind !== "working" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, status.kind]);

  // Revisión previa sobre los slides renderizados a tamaño real.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      await settle([]);
      if (cancelled) return;
      const found: Issue[] = [];
      nodes.current.forEach((node, i) => {
        if (!node) return;
        const content = node.querySelector<HTMLElement>("div[data-fit]");
        const fit = Number(content?.dataset.fit ?? 1);
        const overflow = content ? content.scrollHeight > content.clientHeight + 1 : false;
        const n = project.slides.indexOf(selected[i]) + 1;
        if (overflow) found.push({ number: n, text: "el contenido no entra completo en el área segura. Acortá el texto o quitá el visual." });
        else if (fit < 0.62) found.push({ number: n, text: `el texto se achicó al ${Math.round(fit * 100)} %. Conviene acortarlo.` });
        const s = selected[i];
        const texts = [s.title, s.subtitle, s.body, ...Object.values(s.visual.props)].join(" ");
        if (/\[[^\]]+\]/.test(texts)) found.push({ number: n, text: "tiene un texto [entre corchetes] para completar." });
        if (s.visual.kind === "photo" && !s.visual.image) found.push({ number: n, text: "tiene un visual de foto sin imagen cargada." });
        const t = resolveTheme(project.design, s);
        if (contrastRatio(t.text, t.bg) < 4.5) found.push({ number: n, text: "el contraste entre texto y fondo es bajo." });
      });
      setIssues(found);
    })();
    return () => {
      cancelled = true;
    };
  }, [scope, project]);

  const run = async () => {
    results.forEach((r) => URL.revokeObjectURL(r.url));
    setResults([]);
    const total = selected.length;
    try {
      setStatus({ kind: "working", done: 0, total, label: "Preparando fuentes…" });
      await settle([getFont(project.design.titleFont).family, getFont(project.design.bodyFont).family]);
      const capturer = new SlideCapturer(f);
      const files: ExportedFile[] = [];
      for (let i = 0; i < total; i++) {
        setStatus({ kind: "working", done: i, total, label: `Generando slide ${numbers[i]}…` });
        const node = nodes.current[i];
        if (!node) throw new Error("No se encontró el slide para exportar.");
        const blob = await capturer.capture(node);
        files.push({ name: slideFileName(prefix, numbers[i]), blob });
      }
      setResults(files.map((x) => ({ name: x.name, url: URL.createObjectURL(x.blob) })));

      setStatus({ kind: "working", done: total, total, label: mode === "zip" ? "Armando el ZIP…" : "Descargando…" });
      if (mode === "zip" && total > 1) downloadBlob(await buildZip(files), `${slugify(prefix)}.zip`);
      else await downloadEach(files);

      let message = mode === "zip" && total > 1 ? `ZIP con ${total} imágenes descargado.` : `${total} ${total === 1 ? "imagen descargada" : "imágenes descargadas"}.`;
      if (saveLocal && canSaveLocal) {
        const saved = await saveToPublicExport(prefix, files);
        message += ` También se guardaron en public/export/${slugify(prefix)}/ (${saved.length} archivos).`;
      }
      setStatus({ kind: "done", message });
    } catch (e) {
      setStatus({ kind: "error", message: e instanceof Error ? e.message : "Algo falló al exportar." });
    }
  };

  const working = status.kind === "working";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && !working && onClose()}>
      <div role="dialog" aria-modal="true" aria-labelledby="export-title" className="animate-rise scroll-thin max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-panel shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-line p-6">
          <div>
            <h2 id="export-title" className="font-display text-2xl font-bold">
              Exportar a PNG
            </h2>
            <p className="mt-1 text-sm text-muted">
              {f.width} × {f.height} px exactos · numerados en orden
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={working} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white disabled:opacity-30" aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div className="space-y-5 p-6">
          <Segmented<Scope>
            label="Qué exportar"
            value={scope}
            onChange={setScope}
            options={[
              { value: "all", label: `Todo el carrusel (${project.slides.length})` },
              { value: "current", label: "Solo el slide actual" },
            ]}
          />
          <Segmented<Mode>
            label="Cómo descargar"
            value={mode}
            onChange={setMode}
            options={[
              { value: "zip", label: "Un ZIP con todo" },
              { value: "png", label: "PNG individuales" },
            ]}
          />
          <TextInput label="Nombre de los archivos" value={prefix} onChange={setPrefix} hint={`Quedan como ${slideFileName(prefix, numbers[0] ?? 1)}, ${slideFileName(prefix, (numbers[0] ?? 1) + 1)}…`} />
          {canSaveLocal ? (
            <Toggle label="Guardar también en public/export (local)" checked={saveLocal} onChange={setSaveLocal} />
          ) : (
            <p className="rounded-xl border border-line bg-bg/60 p-3 text-[11px] leading-snug text-faint">
              Las imágenes se descargan con el navegador. Guardar en <code>public/export</code> solo funciona cuando corrés el proyecto en tu computadora con{" "}
              <code>npm run dev</code>: en Vercel el disco no es persistente.
            </p>
          )}

          <div className="rounded-xl border border-line bg-bg/60 p-3 text-xs">
            <div className="mb-1 font-semibold text-white/80">Revisión antes de exportar</div>
            {issues === null && <div className="text-muted">Revisando…</div>}
            {issues?.length === 0 && <div className="text-emerald-300">✓ Todos los textos entran y el contraste es correcto.</div>}
            {issues?.map((it, i) => (
              <div key={i} className="mt-1 text-amber-300">
                Slide {it.number}: {it.text}
              </div>
            ))}
          </div>

          {status.kind === "working" && (
            <div aria-live="polite">
              <div className="mb-2 flex justify-between text-xs text-muted">
                <span>{status.label}</span>
                <span className="tabular-nums">
                  {status.done} / {status.total}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${(status.done / status.total) * 100}%` }} />
              </div>
            </div>
          )}
          {status.kind === "done" && <p className="rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">{status.message}</p>}
          {status.kind === "error" && <p className="rounded-xl bg-red-500/10 p-3 text-sm text-red-300">{status.message}</p>}

          {results.length > 0 && (
            <div>
              <div className="mb-2 text-xs text-muted">Resultado (clic para descargar de nuevo)</div>
              <div className="grid grid-cols-5 gap-2">
                {results.map((r) => (
                  <a key={r.name} href={r.url} download={r.name} title={r.name} className="overflow-hidden rounded-md ring-1 ring-line hover:ring-accent">
                    <img src={r.url} alt={r.name} className="block w-full" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-line p-4">
          <Button variant="ghost" onClick={onClose} disabled={working}>
            Cerrar
          </Button>
          <Button variant="primary" className="px-5" onClick={run} disabled={working || !selected.length || !prefix.trim()}>
            <IconDownload /> {working ? "Exportando…" : "EXPORTAR A PNG"}
          </Button>
        </div>
      </div>

      {/* Slides a tamaño real, fuera de la pantalla: son los que se capturan. */}
      {createPortal(
        <div aria-hidden style={{ position: "fixed", left: -20000, top: 0, pointerEvents: "none" }}>
          {selected.map((s, i) => (
            <div key={s.id} style={{ marginBottom: 40 }}>
              <Slide
                ref={(el) => {
                  nodes.current[i] = el;
                }}
                number={numbers[i]}
                total={project.slides.length}
                slide={s}
                design={project.design}
                format={project.format}
                businessName={project.brief.businessName}
              />
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}
