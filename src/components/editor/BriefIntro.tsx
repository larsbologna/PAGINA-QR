"use client";
import type { Project } from "@/lib/types";
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

export function BriefIntro({ project, generatorDescription, onPropose, busy }: { project: Project; generatorDescription: string; onPropose: () => void; busy: boolean }) {
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
