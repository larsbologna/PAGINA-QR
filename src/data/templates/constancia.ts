import type { Project, Slide, SlideRole, VisualKind } from "@/lib/types";
import { createProject } from "@/lib/defaults";
import { makeVisual } from "@/lib/visuals";
import { uid } from "@/lib/ids";
import { designFor } from "@/lib/content/categoryDesigns";

// Ejemplo de crecimiento personal: reflexión + práctica, sin datos inventados.

function s(role: SlideRole, title: string, subtitle: string, body: string, kind: VisualKind, props: Record<string, string> = {}): Slide {
  return { id: uid("s_"), role, title, subtitle, body, visual: makeVisual(kind, props), overrides: {} };
}

export const CONSTANCIA_TEMPLATE_NAME = "Lo que nadie te dice sobre la constancia";

export function createConstanciaProject(): Project {
  const base = createProject(CONSTANCIA_TEMPLATE_NAME);
  const slides: Slide[] = [
    s("hook", "Lo que nadie te dice sobre la *constancia*", "No se trata de tener ganas todos los días.", "Deslizá →", "none"),
    s("problem", "Esperás tener ganas", "Y como las ganas van y vienen, vos también.", "", "none"),
    s("example", "Cambiá la pregunta", "No es «¿tengo ganas?». Es «¿cuál es la versión mínima de hoy?».", "", "comparison", {
      leftTitle: "Depender de las ganas",
      left: "Todo o nada\nArranco el lunes\nMe castigo si fallo",
      rightTitle: "Sostener un sistema",
      right: "Versión mínima\nArranco hoy\nRetomo sin drama",
    }),
    s("how", "Cómo se *sostiene*", "Tres decisiones que no dependen del humor.", "", "steps", {
      s1: "Definí un horario fijo",
      s2: "Bajá la vara para los días malos",
      s3: "Registrá cada día cumplido",
      s4: "",
    }),
    s("tip", "1. Nunca dos veces seguidas", "", "", "quote", { text: "Fallar un día es normal. Que no se vuelva costumbre.", author: "" }),
    s("tip", "2. Celebrá la *repetición*", "El resultado tarda. La repetición es lo que podés controlar hoy.", "", "checklist", {
      items: "Hoy lo hice\nAyer también\nMañana, aunque sea poco",
    }),
    s("cta", "Si te sirvió, *guardalo*", "Y compartilo con alguien que esté por abandonar.", "", "cta-button", { label: "Guardalo", handle: "@tucuenta" }),
  ];
  return {
    ...base,
    stage: "edit",
    brief: {
      ...base.brief,
      category: "crecimiento",
      topic: CONSTANCIA_TEMPLATE_NAME,
      businessName: "@tucuenta",
      goal: "Que lo guarden y lo compartan",
      audience: "Gente que empieza cosas y le cuesta sostenerlas",
      problem: "Depende de las ganas y abandona cuando bajan",
      benefit: "Sostener lo que empieza sin depender de la motivación",
      cta: "Guardalo para cuando lo necesites",
      tone: "cercano",
    },
    design: designFor("crecimiento"),
    slideCount: slides.length,
    slides,
  };
}
