"use client";
import { z } from "zod/v4";
import type { PlanRequest } from "../content/generator";
import type { Slide, SlideRole, VisualKind } from "../types";
import { structureFor } from "../content/narrative";
import { categoryOf } from "../content/categories";
import { VISUALS, makeVisual } from "../visuals";
import { DEFAULT_ICONS } from "../defaultIcons";
import { uid } from "../ids";
import { askJson, AiError } from "./claude";

// Visuales que la IA puede elegir (los que se completan bien solo con texto).
const AI_VISUALS = [
  "none",
  "steps",
  "comparison",
  "checklist",
  "quote",
  "blocks",
  "icon-hero",
  "big-number",
  "progress",
  "donut",
  "timeline",
  "pyramid",
  "funnel",
  "cycle",
  "venn",
  "do-dont",
  "myth-fact",
  "sticky-notes",
  "post",
  "notifications",
  "chat",
  "review",
  "cta-button",
] as const satisfies readonly VisualKind[];

const ROLES = ["hook", "problem", "example", "how", "proof", "tip", "cta"] as const;

const PlanSchema = z.object({
  slides: z.array(
    z.object({
      role: z.enum(ROLES),
      title: z.string(),
      subtitle: z.string(),
      body: z.string(),
      visual: z.enum(AI_VISUALS),
      visual_lines: z.array(z.string()).describe("Textos para el visual, en el orden que pide su descripción"),
    }),
  ),
});

const VISUAL_GUIDE: Record<(typeof AI_VISUALS)[number], string> = {
  none: "sin visual (frases fuertes, mucho aire). visual_lines vacío",
  steps: "pasos numerados. visual_lines: 3 o 4 pasos cortos",
  comparison: "dos columnas antes/después. visual_lines: título izquierda, 3 puntos, título derecha, 3 puntos",
  checklist: "lista con checks. visual_lines: 3 a 5 ítems",
  quote: "cita destacada. visual_lines: [la frase]",
  blocks: "tarjetas con ícono. visual_lines: 2 a 6 elementos con formato 'Título — texto breve'",
  "icon-hero": "un ícono grande con una palabra. visual_lines: [texto corto debajo]",
  "big-number": "un dato grande. visual_lines: [dato, qué significa, nota]. Solo datos que el usuario dio o que sean de sentido común; nunca estadísticas inventadas",
  progress: "barras de progreso ilustrativas. visual_lines: 'Nombre: porcentaje' (2 a 4)",
  donut: "torta ilustrativa. visual_lines: 'Parte: valor' (2 a 4) y al final el texto del centro",
  timeline: "línea de tiempo. visual_lines: 'Momento: descripción' (3 a 5)",
  pyramid: "pirámide de arriba hacia abajo. visual_lines: 3 a 4 niveles",
  funnel: "embudo de arriba hacia abajo. visual_lines: 3 a 5 etapas",
  cycle: "ciclo. visual_lines: 3 a 5 etapas",
  venn: "dos círculos. visual_lines: [izquierda, derecha, intersección]",
  "do-dont": "sí/no. visual_lines: 3 cosas para hacer y 3 para evitar (primero las 3 de hacer)",
  "myth-fact": "mito vs realidad. visual_lines: [mito, realidad]",
  "sticky-notes": "notas adhesivas. visual_lines: 3 a 6 notas muy cortas",
  post: "publicación de red social ilustrativa. visual_lines: [texto del posteo]",
  notifications: "notificaciones ilustrativas. visual_lines: 2 a 4 notificaciones",
  chat: "conversación ilustrativa. visual_lines: [mensaje de la cuenta, respuesta, mensaje final opcional]",
  review: "reseña ilustrativa. visual_lines: [autor, texto de la reseña]",
  "cta-button": "botón de llamada a la acción. visual_lines: [texto del botón, usuario o contacto]",
};

const blockIcons = [DEFAULT_ICONS.target, DEFAULT_ICONS.flame, DEFAULT_ICONS["trending-up"], DEFAULT_ICONS.trophy, DEFAULT_ICONS.lightbulb, DEFAULT_ICONS.heart];

/** Pasa los textos que propuso la IA a los campos del visual elegido. */
export function applyVisualLines(kind: VisualKind, linesIn: string[]): Record<string, string> {
  const l = linesIn.map((x) => x.trim()).filter(Boolean);
  const half = (arr: string[]) => [arr.slice(0, Math.ceil(arr.length / 2)), arr.slice(Math.ceil(arr.length / 2))];
  switch (kind) {
    case "steps":
      return { s1: l[0] ?? "", s2: l[1] ?? "", s3: l[2] ?? "", s4: l[3] ?? "" };
    case "comparison":
      return { leftTitle: l[0] ?? "Antes", left: l.slice(1, 4).join("\n"), rightTitle: l[4] ?? "Después", right: l.slice(5, 8).join("\n") };
    case "do-dont": {
      const [a, b] = half(l);
      return { do: a.join("\n"), dont: b.join("\n") };
    }
    case "quote":
      return { text: l[0] ?? "", author: "" };
    case "blocks":
      return {
        items: JSON.stringify(
          l.slice(0, 6).map((x, i) => {
            const [title, ...rest] = x.split(/\s+[—–-]\s+/);
            return { icon: blockIcons[i % blockIcons.length], title: title.trim(), text: rest.join(" — ").trim() };
          }),
        ),
      };
    case "icon-hero":
      return { caption: l[0] ?? "" };
    case "big-number":
      return { value: l[0] ?? "", label: l[1] ?? "", note: l[2] ?? "" };
    case "donut":
      return { items: l.filter((x) => x.includes(":")).join("\n"), center: l.find((x) => !x.includes(":")) ?? "" };
    case "venn":
      return { a: l[0] ?? "", b: l[1] ?? "", center: l[2] ?? "" };
    case "myth-fact":
      return { myth: l[0] ?? "", fact: l[1] ?? "" };
    case "post":
      return { text: l[0] ?? "" };
    case "chat":
      return { m1: l[0] ?? "", m2: l[1] ?? "", m3: l[2] ?? "" };
    case "review":
      return { author: l[0] ?? "", text: l[1] ?? "" };
    case "cta-button":
      return { label: l[0] ?? "", handle: l[1] ?? "" };
    case "none":
      return {};
    default:
      return VISUALS[kind].fields.some((f) => f.key === "items") ? { items: l.join("\n") } : {};
  }
}

function system(): string {
  return `Escribís carruseles de Instagram en español rioplatense natural (voseo: "vos tenés", "hacé", "mirá").

Estilo:
- Frases cortas, concretas y con ritmo. Nada de frases robóticas, genéricas o de "inteligencia artificial" (evitá "en el mundo actual", "descubrí el poder de", "sin lugar a dudas", emojis en exceso).
- Títulos de 2 a 8 palabras. Subtítulo de 1 o 2 frases. Texto de apoyo opcional y breve.
- Podés resaltar 1 a 3 palabras clave del título con *asteriscos* (se pintan con el color de acento).
- No repitas ideas ni títulos entre slides. Cada slide avanza la historia.
- No inventes estadísticas, porcentajes, estudios ni datos presentados como reales. Si un visual muestra números, que sean ilustrativos y que se note.
- No prometas resultados garantizados.

Visuales disponibles (elegí el que mejor acompañe cada slide y variá; usá "none" cuando la frase sola sea más fuerte):
${Object.entries(VISUAL_GUIDE)
  .map(([k, v]) => `- ${k}: ${v}`)
  .join("\n")}`;
}

export async function planWithAi(req: PlanRequest): Promise<Slide[]> {
  const cat = categoryOf(req.brief);
  const roles = structureFor(req.count);
  const b = req.brief;
  const fieldLines = (Object.keys(cat.fields) as (keyof typeof cat.fields)[])
    .map((k) => (b[k] ? `- ${cat.fields[k].label}: ${b[k]}` : ""))
    .filter(Boolean)
    .join("\n");
  const prompt = `Tipo de carrusel: ${cat.label} (${cat.description})
Tono: ${b.tone}

Brief:
${fieldLines || "- (sin datos: proponé algo coherente con el tipo de carrusel)"}
${b.extra ? `\nInstrucciones adicionales del usuario:\n${b.extra}` : ""}

Escribí exactamente ${roles.length} slides, en este orden de papeles:
${roles.map((r: SlideRole, i) => `${i + 1}. ${r} — ${cat.roles[r].label}: ${cat.roles[r].purpose}`).join("\n")}`;

  const out = await askJson({ system: system(), prompt, schema: PlanSchema });
  if (!out.slides.length) throw new AiError("La IA no devolvió slides. Probá de nuevo.");
  return out.slides.slice(0, 10).map((s, i) => {
    const kind = s.visual as VisualKind;
    return {
      id: uid("s_"),
      role: roles[i] ?? s.role,
      title: s.title,
      subtitle: s.subtitle,
      body: s.body,
      visual: makeVisual(kind, applyVisualLines(kind, s.visual_lines)),
      overrides: {},
    };
  });
}
