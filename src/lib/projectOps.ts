// Operaciones puras sobre un proyecto. El editor las usa a través del store, que se
// encarga del historial (deshacer / rehacer).
import type { ContentBrief, DesignConfig, FormatId, Project, Slide } from "./types";
import { buildSlide } from "./content/templateGenerator";
import { clampCount } from "./content/narrative";
import { uid } from "./ids";

export type Recipe = (p: Project) => Project;

export const setBrief = (patch: Partial<ContentBrief>): Recipe => (p) => ({ ...p, brief: { ...p.brief, ...patch } });

export const setDesign = (patch: Partial<DesignConfig>): Recipe => (p) => ({ ...p, design: { ...p.design, ...patch } });

export const setFormat = (format: FormatId): Recipe => (p) => ({ ...p, format });

export const rename = (name: string): Recipe => (p) => ({ ...p, name });

/** Reemplaza los slides por una propuesta nueva y pasa a la etapa de revisión. */
export const setPlan = (slides: Slide[]): Recipe => (p) => ({ ...p, slides, slideCount: slides.length, stage: "plan" });

export const setStage = (stage: Project["stage"]): Recipe => (p) => ({ ...p, stage });

/**
 * Cambia la cantidad de slides. Antes de tener propuesta solo guarda el número;
 * con slides ya creados agrega consejos antes del cierre o quita desde el final
 * conservando el CTA.
 */
export const setSlideCount = (n: number): Recipe => (p) => {
  const count = clampCount(n);
  if (p.slides.length === 0) return { ...p, slideCount: count };
  let slides = [...p.slides];
  const hasCta = slides[slides.length - 1]?.role === "cta" && slides.length > 1;
  while (slides.length < count) {
    const tipIndex = slides.filter((s) => s.role === "tip").length;
    const slide = buildSlide("tip", p.brief, p.design.imageStyle, tipIndex);
    const at = hasCta ? slides.length - 1 : slides.length;
    slides.splice(at, 0, slide);
  }
  while (slides.length > count) {
    const at = hasCta && count > 1 ? slides.length - 2 : slides.length - 1;
    slides = slides.filter((_, i) => i !== at);
  }
  return { ...p, slides, slideCount: count };
};

export const updateSlide = (id: string, patch: Partial<Slide> | ((s: Slide) => Slide)): Recipe => (p) => ({
  ...p,
  slides: p.slides.map((s) => (s.id === id ? (typeof patch === "function" ? patch(s) : { ...s, ...patch }) : s)),
});

export const duplicateSlide = (id: string, newId = uid("s_")): Recipe => (p) => {
  if (p.slides.length >= 10) return p;
  const i = p.slides.findIndex((s) => s.id === id);
  if (i < 0) return p;
  const copy: Slide = structuredClone(p.slides[i]);
  copy.id = newId;
  const slides = [...p.slides];
  slides.splice(i + 1, 0, copy);
  return { ...p, slides, slideCount: slides.length };
};

export const deleteSlide = (id: string): Recipe => (p) => {
  if (p.slides.length <= 1) return p;
  const slides = p.slides.filter((s) => s.id !== id);
  return { ...p, slides, slideCount: slides.length };
};

export const moveSlide = (id: string, delta: number): Recipe => (p) => {
  const i = p.slides.findIndex((s) => s.id === id);
  const j = i + delta;
  if (i < 0 || j < 0 || j >= p.slides.length) return p;
  const slides = [...p.slides];
  const [s] = slides.splice(i, 1);
  slides.splice(j, 0, s);
  return { ...p, slides };
};
