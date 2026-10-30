"use client";
import { useMemo } from "react";
import type { ContentCategory, Project } from "@/lib/types";
import { ScaledSlide } from "@/components/slide/ScaledSlide";
import { CategoryCards } from "./CategoryPicker";
import { TEMPLATES } from "@/data/templates";
import { CATEGORIES } from "@/lib/content/categories";
import { structureFor } from "@/lib/content/narrative";
import { categoryOf } from "@/lib/content/categories";
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
  onCategory,
}: {
  project: Project;
  generatorDescription: string;
  onPropose: () => void;
  busy: boolean;
  onLoadTemplate: (p: Project) => void;
  onCategory: (c: ContentCategory) => void;
}) {
  const roles = structureFor(project.slideCount);
  const roleInfo = categoryOf(project.brief).roles;
  // Vista previa de cada plantilla (se crea una copia nueva recién al elegirla).
  const previews = useMemo(() => TEMPLATES.map((tpl) => ({ tpl, sample: tpl.create() })), []);
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
        <div className="mt-8">
          <div className="mb-3 text-sm font-semibold">
            <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-accent-ink">1</span>
            ¿Qué tipo de carrusel es?
          </div>
          <CategoryCards value={project.brief.category} onChange={onCategory} />
        </div>

        <div className={`mt-8 transition ${project.brief.category ? "" : "pointer-events-none opacity-40"}`}>
          <div className="mb-1 text-sm font-semibold">
            <span className="mr-2 inline-grid h-6 w-6 place-items-center rounded-full bg-accent text-xs text-accent-ink">2</span>
            Completá el brief y pedí la propuesta
          </div>
          <p className="max-w-lg text-sm text-muted">
            Usá el panel de la izquierda: con la temática alcanza para arrancar. {generatorDescription}
          </p>
        </div>

        <div className={`mt-5 rounded-2xl border border-line bg-panel p-5 ${project.brief.category ? "" : "opacity-40"}`}>
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold">Estructura para {project.slideCount} slides</span>
            <span className="text-xs text-faint">Se ajusta con la cantidad</span>
          </div>
          <ol className="flex flex-wrap gap-2">
            {roles.map((r, i) => (
              <li key={i} className="flex items-center gap-2 rounded-full border border-line bg-bg py-1 pr-3 pl-1 text-xs">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-accent/15 text-[10px] font-bold text-accent">{i + 1}</span>
                {roleInfo[r].label}
              </li>
            ))}
          </ol>
        </div>

        <Button variant="primary" className="mt-6 px-6 py-3 text-base" onClick={onPropose} disabled={busy || !project.brief.category}>
          <IconSparkle /> Proponer estructura
        </Button>

        <div className="mt-10">
          <div className="mb-3 text-xs font-semibold tracking-[0.2em] text-muted uppercase">O empezá desde una plantilla</div>
          <div className="space-y-2">
          {previews.map(({ tpl, sample }) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => onLoadTemplate(tpl.create())}
              className="group flex w-full items-center gap-4 rounded-2xl border border-line bg-panel p-3 text-left transition hover:border-accent/60"
            >
              <span className="shrink-0 overflow-hidden rounded-md ring-1 ring-line">
                <ScaledSlide width={60} number={1} total={sample.slides.length} slide={sample.slides[0]} design={sample.design} format={sample.format} businessName={sample.brief.businessName} />
              </span>
              <span className="flex-1">
                <span className="mb-1 inline-block rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-accent uppercase">
                  {CATEGORIES[tpl.category].label}
                </span>
                <span className="block font-semibold">{tpl.name}</span>
                <span className="mt-0.5 block text-xs text-muted">{tpl.description}</span>
              </span>
              <span className="text-sm text-accent opacity-0 transition group-hover:opacity-100">Usar →</span>
            </button>
          ))}
          </div>
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
