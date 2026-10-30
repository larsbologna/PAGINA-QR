import type { Project, Slide } from "../types";
import { DEFAULT_BRIEF, DEFAULT_DESIGN } from "../defaults";
import { FORMATS } from "../formats";
import { VISUALS } from "../visuals";
import { uid } from "../ids";

// Completa con valores por defecto lo que falte en un proyecto guardado o importado,
// para que versiones viejas o archivos editados a mano no rompan el editor.

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);

function normalizeSlide(raw: unknown): Slide | null {
  if (!isObj(raw)) return null;
  const visual = isObj(raw.visual) ? raw.visual : {};
  const kind = str(visual.kind, "none");
  const validKind = kind in VISUALS ? (kind as Slide["visual"]["kind"]) : "none";
  const props = isObj(visual.props) ? Object.fromEntries(Object.entries(visual.props).filter(([, v]) => typeof v === "string")) : {};
  const role = str(raw.role, "tip");
  return {
    id: str(raw.id) || uid("s_"),
    role: ["hook", "problem", "example", "how", "proof", "tip", "cta"].includes(role) ? (role as Slide["role"]) : "tip",
    title: str(raw.title),
    subtitle: str(raw.subtitle),
    body: str(raw.body),
    visual: {
      kind: validKind,
      props: { ...VISUALS[validKind].defaults, ...(props as Record<string, string>) },
      ...(typeof visual.image === "string" && visual.image.startsWith("data:image/") ? { image: visual.image } : {}),
    },
    overrides: isObj(raw.overrides) ? (raw.overrides as Slide["overrides"]) : {},
  };
}

export function normalizeProject(raw: unknown): Project | null {
  if (!isObj(raw)) return null;
  const slides = (Array.isArray(raw.slides) ? raw.slides : []).map(normalizeSlide).filter((s): s is Slide => s !== null).slice(0, 10);
  const format = str(raw.format) in FORMATS ? (raw.format as Project["format"]) : "1080x1440";
  const stage = ["brief", "plan", "edit"].includes(str(raw.stage)) ? (raw.stage as Project["stage"]) : slides.length ? "edit" : "brief";
  const now = Date.now();
  return {
    id: str(raw.id) || uid("p_"),
    name: str(raw.name, "Carrusel sin título") || "Carrusel sin título",
    createdAt: typeof raw.createdAt === "number" ? raw.createdAt : now,
    updatedAt: typeof raw.updatedAt === "number" ? raw.updatedAt : now,
    stage: slides.length ? stage : "brief",
    brief: { ...DEFAULT_BRIEF, ...(isObj(raw.brief) ? raw.brief : {}) },
    design: { ...DEFAULT_DESIGN, ...(isObj(raw.design) ? raw.design : {}) },
    format,
    slideCount: slides.length || (typeof raw.slideCount === "number" ? Math.min(10, Math.max(1, raw.slideCount)) : 10),
    slides,
  };
}
