"use client";
import { z } from "zod/v4";
import { askJson, AiError } from "./claude";
import { sanitizeSvg } from "../sanitize";

const SvgSchema = z.object({
  svg: z.string().describe("Un único elemento <svg> completo, autocontenido"),
  description: z.string().describe("Descripción breve en español de lo que muestra el dibujo"),
});

export interface SvgColors {
  background: string;
  surface: string;
  text: string;
  accent: string;
}

const SYSTEM = `Sos ilustrador/a de carruseles profesionales para Instagram. Dibujás ilustraciones vectoriales planas, modernas y limpias en SVG.

Reglas del SVG:
- Un solo elemento <svg> con xmlns="http://www.w3.org/2000/svg" y viewBox="0 0 1000 700". Sin width ni height.
- Fondo transparente: no pintes un rectángulo de fondo que cubra todo; la ilustración se apoya sobre el fondo del slide.
- Usá la paleta indicada (podés usar tonos intermedios entre esos colores). Contraste alto y formas simples.
- Prohibido: <script>, <foreignObject>, <style>, atributos style, eventos (onload, onclick...), imágenes externas, <a>, <use> y enlaces.
- Podés usar <defs>, <linearGradient>, <radialGradient>, <filter> con sombras suaves, <g>, <path>, <rect>, <circle>, <ellipse>, <polygon>, <line>, <text>.
- Texto solo si el pedido lo necesita: pocas palabras, en español, font-family="Inter, sans-serif", tamaño de 28 o más.
- Si mostrás una interfaz real (app, red social, buscador), que sea una ilustración genérica: sin logos ni marcas.
- No inventes datos numéricos presentados como reales.`;

export async function generateSvg(request: string, colors: SvgColors): Promise<{ svg: string; description: string }> {
  const prompt = `Pedido: ${request.trim()}

Paleta del slide:
- Fondo del slide (no lo pintes): ${colors.background}
- Superficies y tarjetas: ${colors.surface}
- Texto y trazos principales: ${colors.text}
- Acento (destacados): ${colors.accent}`;
  const out = await askJson({ system: SYSTEM, prompt, schema: SvgSchema });
  const svg = sanitizeSvg(out.svg);
  if (!svg) throw new AiError("La IA no devolvió un dibujo válido. Probá describirlo de otra forma.");
  return { svg, description: out.description };
}
