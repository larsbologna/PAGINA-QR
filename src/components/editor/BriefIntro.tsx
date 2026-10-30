"use client";
import type { Project } from "@/lib/types";
import { TEMPLATES } from "@/data/templates/googleMaps";
import { structureFor, ROLE_INFO } from "@/lib/content/narrative";
import { Button } from "@/components/ui/controls";
import { IconSparkle } from "@/components/ui/icons";

const FLOW = [
  ["Brief", "Cargá la temática, el objetivo y el diseño en el panel."],
  ["Propuesta", "Se arma la estructura narrativa slide por slide."],
  ["Revisión", "Editás cada título y texto. Nada se crea sin tu aprobación."],
  ["Diseño", "Ajustás cada slide: textos, colores, visuales y orden."],
  ["Exportación", "Descargás los PNG numerados o el ZIP completo."],
];

export function BriefIntro({
  project,
  generatorDescription,
  onPropose,
  busy,
  onLoadTemplate,
}: {
  project: Project;
  generatorDescription: string;
  onPropose: () => void;
  busy: boolean;
  onLoadTemplate: (p: Project) => void;
}) {
  const roles = structureFor(project.slideCount);
  return (
    <div className="relative mx-auto max-w-3xl px-6 py-10 md:py-16">
      <div className="pointer-events-none absolute -top-20 right-0 h-72 w-72 rounded-full bg-accent/20 blur-[100px]" />
      <div className="relative">
        <div className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Paso 1 · Brief</div>
        <h1 className="mt-2 font-display text-4xl leading-[1.05] font-extrabold tracking-tight md:text-5xl">
          Contame de qué va
          <br />
          el <span className="text-accent">carrusel</span>.
        </h1>
        <p className="mt-4 max-w-lg text-muted">
          Completá el panel de la izquierda (con la temática alcanza para arrancar) y pedí la propuesta. {generatorDescription}
        </p>

        <div className="mt-8 rounded-2xl border border-line bg-panel p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Estructura para {project.slideCount} slides</span>
            <span className="text-xs text-faint">Se ajusta con la cantidad</span>
          </div>
          <ol className="flex flex-wrap gap-2">
            {roles.map((r, i) => (
              <li key={i} className="flex items-center gap-2 rounded-full border border-line bg-bg py-1 pr-3 pl-1 text-xs">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">{i + 1}</span>
                {ROLE_INFO[r].label}
              </li>
            ))}
          </ol>
        </div>

        <Button variant="primary" className="mt-6 px-6 py-3 text-base" onClick={onPropose} disabled={busy}>
          <IconSparkle /> Proponer estructura
        </Button>

        <div className="mt-10">
          <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-muted uppercase">O empezá desde una plantilla</div>
          {TEMPLATES.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onLoadTemplate(tpl.create())}
              className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-panel p-4 text-left transition hover:border-accent/60"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#ffc94d]/15 text-[#ffc94d]">
                <svg width="22" height="28" viewBox="0 0 24 31">
                  <path d="M12 0C5.4 0 0 5.2 0 11.7 0 20.3 12 31 12 31s12-10.7 12-19.3C24 5.2 18.6 0 12 0z" fill="currentColor" />
                  <circle cx="12" cy="11.5" r="4.4" fill="#111" />
                </svg>
              </span>
              <span className="flex-1">
                <span className="block font-semibold">{tpl.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{tpl.description}</span>
              </span>
              <span className="text-sm text-accent opacity-0 transition group-hover:opacity-100">Usar →</span>
            </button>
          ))}
        </div>

        <ol className="mt-12 grid gap-3 sm:grid-cols-5">
          {FLOW.map(([t, d], i) => (
            <li key={t} className="rounded-xl border border-line/70 p-3">
              <div className="font-display text-2xl font-bold text-white/20">{String(i + 1).padStart(2, "0")}</div>
              <div className="mt-1 text-sm font-semibold">{t}</div>
              <div className="mt-1 text-[11px] leading-snug text-muted">{d}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
