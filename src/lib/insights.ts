/**
 * Generación determinista de hallazgos a partir de estadísticas agregadas.
 * No inventa tendencias: cada frase se respalda en conteos reales y solo se
 * emite cuando hay una cantidad mínima de datos.
 */
import { formatNumber, plural } from "./format";

export const MIN_FEEDBACK_FOR_INSIGHTS = 5;
export const MIN_MENTIONS_FOR_TREND = 3;
export const MIN_AVG_DELTA = 0.3;

export interface CategoryPeriodStats {
  categoryId: string;
  name: string;
  mentions: number;
  problemMentions: number;
  ratingSum: number;
  prevMentions: number;
  prevProblemMentions: number;
  prevRatingSum: number;
}

export interface InsightInput {
  days: number;
  total: number;
  prevTotal: number;
  average: number | null;
  prevAverage: number | null;
  negativeCount: number;
  prevNegativeCount: number;
  categories: CategoryPeriodStats[];
}

export type InsightKind = "problem" | "improvement" | "decline" | "info";

export interface Insight {
  kind: InsightKind;
  text: string;
}

export interface InsightResult {
  sufficient: boolean;
  message?: string;
  insights: Insight[];
}

const fmtAvg = (n: number) => formatNumber(n, 1);

export function buildInsights(input: InsightInput): InsightResult {
  const { days } = input;
  if (input.total < MIN_FEEDBACK_FOR_INSIGHTS) {
    return {
      sufficient: false,
      message: `Todavía no hay información suficiente: se necesitan al menos ${MIN_FEEDBACK_FOR_INSIGHTS} opiniones en el período para mostrar conclusiones (hay ${formatNumber(input.total)}).`,
      insights: [],
    };
  }

  const insights: Insight[] = [];
  const window = `en los últimos ${days} días`;

  const problems = input.categories
    .filter((c) => c.problemMentions >= 2)
    .sort((a, b) => b.problemMentions - a.problemMentions || a.name.localeCompare(b.name))
    .slice(0, 3);
  for (const c of problems) {
    let text = `«${c.name}» aparece en ${plural(c.problemMentions, "opinión neutral o negativa", "opiniones neutrales o negativas")} ${window}`;
    if (input.prevTotal > 0) text += ` (período anterior: ${formatNumber(c.prevProblemMentions)})`;
    insights.push({ kind: "problem", text: `${text}.` });
  }

  const mostMentioned = [...input.categories]
    .filter((c) => c.mentions >= 2)
    .sort((a, b) => b.mentions - a.mentions || a.name.localeCompare(b.name))[0];
  if (mostMentioned) {
    insights.push({
      kind: "info",
      text: `«${mostMentioned.name}» es la categoría más mencionada ${window} (${plural(mostMentioned.mentions, "opinión", "opiniones")}).`,
    });
  }

  for (const c of input.categories) {
    if (c.mentions < MIN_MENTIONS_FOR_TREND || c.prevMentions < MIN_MENTIONS_FOR_TREND) continue;
    const now = c.ratingSum / c.mentions;
    const before = c.prevRatingSum / c.prevMentions;
    const delta = now - before;
    if (Math.abs(delta) < MIN_AVG_DELTA) continue;
    insights.push({
      kind: delta > 0 ? "improvement" : "decline",
      text: `Las puntuaciones de opiniones que mencionan «${c.name}» ${delta > 0 ? "mejoraron" : "empeoraron"} respecto del período anterior: promedio ${fmtAvg(before)} → ${fmtAvg(now)}.`,
    });
  }

  if (
    input.average !== null &&
    input.prevAverage !== null &&
    input.prevTotal >= MIN_FEEDBACK_FOR_INSIGHTS &&
    Math.abs(input.average - input.prevAverage) >= MIN_AVG_DELTA
  ) {
    const up = input.average > input.prevAverage;
    insights.push({
      kind: up ? "improvement" : "decline",
      text: `El promedio interno ${up ? "subió" : "bajó"} de ${fmtAvg(input.prevAverage)} a ${fmtAvg(input.average)} respecto del período anterior.`,
    });
  }

  if (input.prevTotal >= MIN_FEEDBACK_FOR_INSIGHTS) {
    const share = (input.negativeCount / input.total) * 100;
    const prevShare = (input.prevNegativeCount / input.prevTotal) * 100;
    if (Math.abs(share - prevShare) >= 10) {
      insights.push({
        kind: share < prevShare ? "improvement" : "decline",
        text: `Las opiniones negativas pasaron del ${formatNumber(prevShare)}% al ${formatNumber(share)}% del total.`,
      });
    }
  }

  if (insights.length === 0) {
    insights.push({
      kind: "info",
      text: `No se detectan problemas repetidos ni cambios relevantes ${window}.`,
    });
  }

  return { sufficient: true, insights };
}
