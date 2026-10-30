import type { SlideRole } from "../types";

export const ROLE_INFO: Record<SlideRole, { label: string; purpose: string }> = {
  hook: { label: "Gancho", purpose: "Frenar el scroll con una idea fuerte." },
  problem: { label: "Problema", purpose: "Mostrar qué está fallando hoy." },
  example: { label: "Ejemplo", purpose: "Hacerlo concreto con una comparación." },
  how: { label: "Cómo funciona", purpose: "Explicar el mecanismo en pocos pasos." },
  proof: { label: "Argumento", purpose: "Demostrar por qué vale la pena." },
  tip: { label: "Consejo", purpose: "Algo que se pueda aplicar hoy." },
  cta: { label: "Llamada a la acción", purpose: "Decir qué hacer ahora." },
};

const FULL: SlideRole[] = ["hook", "problem", "example", "how", "proof", "tip", "tip", "tip", "tip", "cta"];

// Para menos slides se resignan primero los que menos aportan al hilo:
// siempre queda gancho y, desde 2 slides, el cierre con CTA.
const BY_COUNT: Record<number, SlideRole[]> = {
  1: ["hook"],
  2: ["hook", "cta"],
  3: ["hook", "problem", "cta"],
  4: ["hook", "problem", "how", "cta"],
  5: ["hook", "problem", "how", "tip", "cta"],
  6: ["hook", "problem", "example", "how", "tip", "cta"],
  7: ["hook", "problem", "example", "how", "tip", "tip", "cta"],
  8: ["hook", "problem", "example", "how", "proof", "tip", "tip", "cta"],
  9: ["hook", "problem", "example", "how", "proof", "tip", "tip", "tip", "cta"],
  10: FULL,
};

export function clampCount(n: number): number {
  return Math.min(10, Math.max(1, Math.round(n) || 1));
}

export function structureFor(count: number): SlideRole[] {
  return [...BY_COUNT[clampCount(count)]];
}
