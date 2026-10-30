import type { ContentBrief, ImageStyle, Slide, SlideRole, Tone } from "../types";
import type { ContentGenerator, PlanRequest } from "./generator";
import { structureFor } from "./narrative";
import { makeVisual, suggestVisual } from "../visuals";
import { uid } from "../ids";
import { personalSlide } from "./personalCopy";

// Generación sin IA: arma la estructura con frases de plantilla a partir de lo que
// cargaste en el brief. Es un punto de partida para editar, no texto final.

interface Copy {
  title: string;
  subtitle: string;
  body: string;
}

function clean(s: string): string {
  return s.trim().replace(/\s+/g, " ").replace(/[.;,]+$/, "");
}

/** Pasa a minúscula la primera letra para insertar un texto en medio de una frase. */
function lc(s: string): string {
  if (s.length > 1 && s[1] === s[1].toUpperCase() && /[A-ZÁÉÍÓÚÑ]/.test(s[1])) return s; // sigla o nombre en mayúsculas
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Consejos escritos por el usuario en "instrucciones adicionales" (uno por línea, con guion o número). */
export function extractTips(extra: string): Copy[] {
  return extra
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => /^([-•*]|\d+[.)])\s+/.test(l))
    .map((l) => l.replace(/^([-•*]|\d+[.)])\s+/, ""))
    .map((l) => {
      const [t, ...rest] = l.split(/\s*[:—–]\s+/);
      return { title: clean(t), subtitle: clean(rest.join(": ")), body: "" };
    });
}

const GENERIC_TIPS: Copy[] = [
  { title: "Empezá por una sola cosa", subtitle: "Elegí la acción más simple de esta lista y sostenela dos semanas antes de sumar otra.", body: "" },
  { title: "Anotá cómo estás hoy", subtitle: "Sin un punto de partida no vas a saber si lo que cambiaste funcionó.", body: "" },
  { title: "Hacelo parte de la rutina", subtitle: "Una vez no alcanza. Lo que da resultado es lo que se repite todas las semanas.", body: "" },
  { title: "Delegá lo técnico", subtitle: "Tu tiempo vale más atendiendo bien que peleándote con herramientas.", body: "" },
];

const HOOK_SUB: Record<Tone, (b: Fields) => string> = {
  profesional: (b) => (b.audience ? `Guía práctica para ${lc(b.audience)}` : "Una guía práctica, paso a paso"),
  directo: (b) => (b.benefit ? `Si querés ${lc(b.benefit)}, esto es para vos` : "Sin vueltas: lo que funciona y lo que no"),
  educativo: (b) => (b.audience ? `Lo que todo ${lc(singular(b.audience))} debería saber` : "Te lo explico en pocos slides"),
  persuasivo: (b) => (b.benefit ? `El camino más corto a ${lc(b.benefit)}` : "Lo que hacen los negocios que siempre están llenos"),
  cercano: () => "Te cuento lo que vemos todos los días con nuestros clientes",
};

interface Fields {
  topic: string;
  business: string;
  goal: string;
  audience: string;
  problem: string;
  benefit: string;
  offer: string;
  cta: string;
}

function singular(audience: string): string {
  // "dueños de locales" → "dueño de locales"; si no reconoce el plural lo deja igual.
  const [first, ...rest] = audience.split(" ");
  const s = first.replace(/es$/i, "").replace(/s$/i, "");
  return [s.length > 2 ? s : first, ...rest].join(" ");
}

function copyFor(role: SlideRole, f: Fields, tone: Tone, tipIndex: number, tips: Copy[], variant: number): Copy {
  switch (role) {
    case "hook": {
      const title = f.topic || (f.problem ? `${cap(f.problem)}: tiene arreglo` : "Esto te está costando clientes");
      return { title, subtitle: HOOK_SUB[tone](f), body: "Deslizá →" };
    }
    case "problem": {
      const titles = ["El problema no es tu producto", "Lo que nadie te dice", "Acá se te escapan clientes"];
      return {
        title: titles[variant % titles.length],
        subtitle: f.problem ? `${cap(f.problem)}.` : "Tenés algo bueno, pero no llega a la gente que lo está buscando.",
        body: f.audience ? `Le pasa a la mayoría de ${lc(f.audience)}.` : "",
      };
    }
    case "example":
      return {
        title: "Mirá la diferencia",
        subtitle: f.benefit ? `Mismo rubro, mismo barrio. Uno logra ${lc(f.benefit)} y el otro no.` : "Mismo rubro, mismo barrio, resultados muy distintos.",
        body: "",
      };
    case "how":
      return {
        title: "Así funciona",
        subtitle: f.offer ? `Lo que hacemos con ${lc(f.offer)}, en tres pasos.` : "Tres pasos, sin complicarte.",
        body: "",
      };
    case "proof":
      return {
        title: "No es suerte. Es método.",
        subtitle: f.benefit ? `Cuando el sistema está armado, ${lc(f.benefit)} deja de depender del azar.` : "Lo que se hace con constancia se nota en los resultados.",
        body: "",
      };
    case "tip": {
      const t = tips[tipIndex] ?? GENERIC_TIPS[tipIndex % GENERIC_TIPS.length];
      return { title: `${tipIndex + 1}. ${t.title}`, subtitle: t.subtitle, body: t.body };
    }
    case "cta": {
      const ctas: Record<Tone, string> = {
        profesional: "¿Lo implementamos en tu negocio?",
        directo: "¿Lo armamos juntos?",
        educativo: "¿Querés aplicarlo?",
        persuasivo: "¿Empezamos esta semana?",
        cercano: "¿Te damos una mano?",
      };
      return {
        title: ctas[tone],
        subtitle: f.cta ? `${cap(f.cta)}.` : "Escribinos por mensaje directo y te contamos cómo.",
        body: [f.business, f.offer ? cap(f.offer) : ""].filter(Boolean).join(" · "),
      };
    }
  }
}

function fieldsFrom(brief: ContentBrief): Fields {
  return {
    topic: clean(brief.topic),
    business: clean(brief.businessName),
    goal: clean(brief.goal),
    audience: clean(brief.audience),
    problem: clean(brief.problem),
    benefit: clean(brief.benefit),
    offer: clean(brief.offer),
    cta: clean(brief.cta),
  };
}

export function buildSlide(role: SlideRole, brief: ContentBrief, imageStyle: ImageStyle, tipIndex = 0): Slide {
  const f = fieldsFrom(brief);
  if (brief.category && brief.category !== "negocio") {
    const p = personalSlide(
      brief.category,
      role,
      { topic: f.topic, name: f.business, audience: f.audience, problem: f.problem, benefit: f.benefit, offer: f.offer, cta: f.cta },
      brief.tone,
      imageStyle,
      tipIndex,
      extractTips(brief.extra),
    );
    return { id: uid("s_"), role, title: p.title, subtitle: p.subtitle, body: p.body, visual: makeVisual(p.visual, p.props), overrides: {} };
  }
  const copy = copyFor(role, f, brief.tone, tipIndex, extractTips(brief.extra), hash(f.topic));
  const kind = suggestVisual(role, imageStyle, tipIndex);
  const props: Record<string, string> = {};
  if (kind === "cta-button") props.label = f.cta ? cap(f.cta.split(/[.,]/)[0]).slice(0, 28) : "Escribinos";
  if (kind === "cta-button" && f.business) props.handle = f.business;
  if (kind === "phone" && f.business) props.app = f.business;
  return { id: uid("s_"), role, ...copy, visual: makeVisual(kind, props), overrides: {} };
}

export function planFromTemplates({ brief, count, imageStyle }: PlanRequest): Slide[] {
  let tip = 0;
  return structureFor(count).map((role) => buildSlide(role, brief, imageStyle, role === "tip" ? tip++ : 0));
}

export const templateGenerator: ContentGenerator = {
  id: "templates",
  label: "Plantillas",
  description: "Arma la estructura con frases base a partir de tu brief. No usa IA: revisá y ajustá cada texto.",
  async generatePlan(req) {
    return planFromTemplates(req);
  },
};
