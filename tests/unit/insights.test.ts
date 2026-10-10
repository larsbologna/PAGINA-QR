import { describe, expect, it } from "vitest";
import { buildInsights, type CategoryPeriodStats } from "@/lib/insights";

const cat = (name: string, o: Partial<CategoryPeriodStats>): CategoryPeriodStats => ({
  categoryId: name, name, mentions: 0, problemMentions: 0, ratingSum: 0, prevMentions: 0, prevProblemMentions: 0, prevRatingSum: 0, ...o,
});

describe("hallazgos deterministas", () => {
  it("no concluye nada con menos de 5 opiniones", () => {
    const r = buildInsights({ days: 30, total: 4, prevTotal: 0, average: 2, prevAverage: null, negativeCount: 3, prevNegativeCount: 0, categories: [] });
    expect(r.sufficient).toBe(false);
    expect(r.insights).toEqual([]);
  });

  it("reporta problemas frecuentes, categoría más mencionada y mejoras con respaldo numérico", () => {
    const r = buildInsights({
      days: 30, total: 20, prevTotal: 18, average: 3.9, prevAverage: 3.2, negativeCount: 3, prevNegativeCount: 7,
      categories: [
        cat("Tiempo de espera", { mentions: 12, problemMentions: 12, ratingSum: 24, prevMentions: 6, prevProblemMentions: 6, prevRatingSum: 12 }),
        cat("Atención", { mentions: 14, problemMentions: 1, ratingSum: 63, prevMentions: 10, prevRatingSum: 40 }),
        cat("Limpieza", { mentions: 4, problemMentions: 0, ratingSum: 18, prevMentions: 4, prevProblemMentions: 3, prevRatingSum: 8 }),
      ],
    });
    const texts = r.insights.map((i) => i.text);
    expect(texts[0]).toBe("«Tiempo de espera» aparece en 12 opiniones neutrales o negativas en los últimos 30 días (período anterior: 6).");
    expect(texts).toContain("«Atención» es la categoría más mencionada en los últimos 30 días (14 opiniones).");
    expect(texts.some((t) => t.startsWith("Las puntuaciones de opiniones que mencionan «Limpieza» mejoraron") && t.includes("2,0 → 4,5"))).toBe(true);
    expect(texts.some((t) => t.includes("«Atención» mejoraron"))).toBe(true);
    expect(texts).toContain("El promedio interno subió de 3,2 a 3,9 respecto del período anterior.");
    expect(texts.some((t) => t.startsWith("Las opiniones negativas pasaron del 39% al 15%"))).toBe(true);
  });

  it("no inventa tendencias cuando no hay datos del período anterior", () => {
    const r = buildInsights({
      days: 30, total: 6, prevTotal: 0, average: 4.5, prevAverage: null, negativeCount: 0, prevNegativeCount: 0,
      categories: [cat("Atención", { mentions: 1, ratingSum: 5 })],
    });
    expect(r.insights).toEqual([{ kind: "info", text: "No se detectan problemas repetidos ni cambios relevantes en los últimos 30 días." }]);
  });
});
