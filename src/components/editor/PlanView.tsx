"use client";
import type { Project, Slide, SlideRole, VisualKind } from "@/lib/types";
import type { Recipe } from "@/lib/projectOps";
import { deleteSlide, moveSlide, setStage, updateSlide } from "@/lib/projectOps";
import { ROLE_INFO } from "@/lib/content/narrative";
import { categoryOf } from "@/lib/content/categories";
import { buildSlide } from "@/lib/content/templateGenerator";
import { VISUALS, VISUAL_GROUPS, makeVisual } from "@/lib/visuals";
import { uid } from "@/lib/ids";
import { ScaledSlide } from "@/components/slide/ScaledSlide";
import { Button } from "@/components/ui/controls";
import { IconCheck, IconLeft, IconPlus, IconRefresh, IconRight, IconTrash } from "@/components/ui/icons";

const ROLES = Object.keys(ROLE_INFO) as SlideRole[];
const VISUAL_KINDS = Object.keys(VISUALS) as VisualKind[];

const field =
  "w-full rounded-lg border border-transparent bg-transparent px-2 py-1 outline-none transition hover:border-line focus:border-accent/60 focus:bg-bg";

export function PlanView({
  project,
  apply,
  onRepropose,
}: {
  project: Project;
  apply: (r: Recipe, key?: string) => void;
  onRepropose: () => void;
}) {
  const { slides } = project;
  const roleInfo = categoryOf(project.brief).roles;

  const tipIndexOf = (i: number) => slides.slice(0, i).filter((s) => s.role === "tip").length;

  const regenerate = (s: Slide, i: number) => {
    const fresh = buildSlide(s.role, project.brief, project.design.imageStyle, tipIndexOf(i));
    apply(updateSlide(s.id, { title: fresh.title, subtitle: fresh.subtitle, body: fresh.body, visual: fresh.visual }));
  };

  const addSlide = () =>
    apply((p) => {
      if (p.slides.length >= 10) return p;
      const atEnd = p.slides[p.slides.length - 1]?.role === "cta" ? p.slides.length - 1 : p.slides.length;
      const s = buildSlide("tip", p.brief, p.design.imageStyle, p.slides.filter((x) => x.role === "tip").length);
      const next = [...p.slides];
      next.splice(atEnd, 0, { ...s, id: uid("s_") });
      return { ...p, slides: next, slideCount: next.length };
    });

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold tracking-[0.2em] text-accent uppercase">Paso 2 · Revisá la propuesta</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Estructura del carrusel</h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Editá cada texto haciendo clic. Usá <code className="rounded bg-white/10 px-1">*asteriscos*</code> para resaltar palabras con el color de acento.
            Nada se genera hasta que apruebes.
          </p>
        </div>
        <Button variant="outline" onClick={onRepropose}>
          <IconRefresh /> Proponer otra versión
        </Button>
      </div>

      <ol className="space-y-3">
        {slides.map((s, i) => (
          <li key={s.id} className="animate-rise group flex gap-4 rounded-2xl border border-line bg-panel p-3 transition hover:border-line-strong md:p-4">
            <div className="flex flex-col items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent/15 font-display text-sm font-bold text-accent tabular-nums">{i + 1}</span>
              <button type="button" aria-label="Subir" disabled={i === 0} onClick={() => apply(moveSlide(s.id, -1))} className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-white disabled:opacity-20">
                <IconLeft className="rotate-90" />
              </button>
              <button
                type="button"
                aria-label="Bajar"
                disabled={i === slides.length - 1}
                onClick={() => apply(moveSlide(s.id, 1))}
                className="rounded-lg p-1 text-muted hover:bg-white/5 hover:text-white disabled:opacity-20"
              >
                <IconRight className="rotate-90" />
              </button>
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2 px-2 pb-1">
                <select
                  aria-label="Papel del slide"
                  value={s.role}
                  onChange={(e) => apply(updateSlide(s.id, { role: e.target.value as SlideRole }))}
                  className="cursor-pointer rounded-md border border-line bg-bg px-2 py-0.5 text-[11px] font-semibold tracking-wide text-white/80 uppercase outline-none"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleInfo[r].label}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-faint">{roleInfo[s.role].purpose}</span>
              </div>
              <input
                aria-label={`Título del slide ${i + 1}`}
                className={`${field} font-display text-lg font-bold`}
                value={s.title}
                placeholder="Título"
                onChange={(e) => apply(updateSlide(s.id, { title: e.target.value }), `${s.id}.title`)}
              />
              <textarea
                aria-label={`Subtítulo del slide ${i + 1}`}
                rows={2}
                className={`${field} resize-none text-sm text-white/85`}
                value={s.subtitle}
                placeholder="Subtítulo"
                onChange={(e) => apply(updateSlide(s.id, { subtitle: e.target.value }), `${s.id}.subtitle`)}
              />
              <input
                aria-label={`Texto de apoyo del slide ${i + 1}`}
                className={`${field} text-xs text-muted`}
                value={s.body}
                placeholder="Texto de apoyo (opcional)"
                onChange={(e) => apply(updateSlide(s.id, { body: e.target.value }), `${s.id}.body`)}
              />
              <div className="flex flex-wrap items-center gap-2 px-2 pt-1">
                <span className="text-[11px] text-faint">Visual:</span>
                <select
                  aria-label={`Visual del slide ${i + 1}`}
                  value={s.visual.kind}
                  onChange={(e) => apply(updateSlide(s.id, { visual: makeVisual(e.target.value as VisualKind) }))}
                  className="cursor-pointer rounded-md border border-line bg-bg px-2 py-0.5 text-xs text-white/80 outline-none"
                >
                  {VISUAL_GROUPS.map((g) => (
                    <optgroup key={g} label={g}>
                      {VISUAL_KINDS.filter((k) => VISUALS[k].group === g).map((k) => (
                        <option key={k} value={k}>
                          {VISUALS[k].label}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <span className="flex-1" />
                <button type="button" onClick={() => regenerate(s, i)} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-white/5 hover:text-white">
                  <IconRefresh size={13} /> Reescribir
                </button>
                <button
                  type="button"
                  disabled={slides.length <= 1}
                  onClick={() => apply(deleteSlide(s.id))}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted hover:bg-red-500/10 hover:text-red-300 disabled:opacity-20"
                >
                  <IconTrash size={13} /> Quitar
                </button>
              </div>
            </div>

            <div className="hidden shrink-0 overflow-hidden rounded-lg border border-line sm:block">
              <ScaledSlide width={132} number={i + 1} total={slides.length} slide={s} design={project.design} format={project.format} businessName={project.brief.businessName} />
            </div>
          </li>
        ))}
      </ol>

      <div className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-3 border-t border-line bg-bg/90 py-4 backdrop-blur">
        <Button variant="outline" onClick={addSlide} disabled={slides.length >= 10}>
          <IconPlus /> Agregar slide
        </Button>
        <span className="text-xs text-muted">{slides.length} de 10 slides</span>
        <span className="flex-1" />
        <Button variant="primary" className="px-5 py-2.5" onClick={() => apply(setStage("edit"))}>
          <IconCheck /> Aprobar y generar slides
        </Button>
      </div>
    </div>
  );
}
