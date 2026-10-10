import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "../support/db";
import { categoriesOf, insertFeedback, makeBusiness, makeMember } from "../support/factories";
import { getDashboardStats } from "@/server/services/stats";
import { addFeedbackNote, getFeedbackDetail, listFeedback, markAllReviewed, setFeedbackReviewed } from "@/server/services/feedback";
import { exportFeedbackCsv } from "@/server/services/export";
import { parseFeedbackFilters } from "@/lib/feedback-filters";
import { withSystem } from "@/server/tenant";

const NOW = new Date();

describe("Estadísticas, bandeja y exportación", () => {
  beforeEach(resetDb);

  async function seed() {
    const b = await makeBusiness("Resto Datos");
    const cats = await categoriesOf(b.id);
    const atencion = cats.find((c) => c.name === "Atención")!;
    const espera = cats.find((c) => c.name === "Tiempo de espera")!;
    const limpieza = cats.find((c) => c.name === "Limpieza")!;
    // Período actual (últimos 30 días): 8 opiniones
    await insertFeedback(
      b.id,
      [
        { rating: 5, daysAgo: 1, comment: "Excelente atención", categoryIds: [atencion.id] },
        { rating: 4, daysAgo: 2, comment: "Muy rico todo" },
        { rating: 1, daysAgo: 3, comment: "Esperamos una hora", categoryIds: [espera.id] },
        { rating: 2, daysAgo: 5, comment: "Demora y mesa sucia", categoryIds: [espera.id, limpieza.id] },
        { rating: 3, daysAgo: 6, comment: "Normal", categoryIds: [espera.id], status: "REVIEWED" },
        { rating: 5, daysAgo: 10, categoryIds: [atencion.id] },
        { rating: 4, daysAgo: 15, comment: "=HYPERLINK(\"http://malo\")" },
        { rating: 2, daysAgo: 29, comment: "Precio alto", categoryIds: [atencion.id] },
      ],
      NOW,
    );
    // Período anterior (30-60 días): 5 opiniones
    await insertFeedback(
      b.id,
      [
        { rating: 1, daysAgo: 31 },
        { rating: 1, daysAgo: 35, categoryIds: [espera.id] },
        { rating: 2, daysAgo: 40 },
        { rating: 3, daysAgo: 45 },
        { rating: 5, daysAgo: 59 },
      ],
      NOW,
    );
    // Fuera de ambos períodos
    await insertFeedback(b.id, [{ rating: 5, daysAgo: 100 }], NOW);
    return { b, atencion, espera, limpieza };
  }

  it("los indicadores coinciden exactamente con los datos almacenados", async () => {
    const { b, espera } = await seed();
    const s = await getDashboardStats(b, 30, NOW);
    expect(s.totalAllTime).toBe(14);
    expect(s.last7).toBe(5);
    expect(s.last30).toBe(8);
    expect(s.current.total).toBe(8);
    expect(s.current.distribution).toEqual([1, 2, 1, 2, 2]);
    expect(s.current.average).toBeCloseTo((5 + 4 + 1 + 2 + 3 + 5 + 4 + 2) / 8, 5);
    expect([s.current.positive, s.current.neutral, s.current.negative]).toEqual([4, 1, 3]);
    expect(s.previous.total).toBe(5);
    expect(s.previous.average).toBeCloseTo(12 / 5, 5);
    expect(s.unreviewed).toBe(13);
    expect(s.series.reduce((a, p) => a + p.count, 0)).toBe(8);
    const esperaStats = s.categories.find((c) => c.categoryId === espera.id)!;
    expect(esperaStats.mentions).toBe(3);
    expect(esperaStats.problemMentions).toBe(3);
    expect(esperaStats.prevMentions).toBe(1);
    expect(s.insights.sufficient).toBe(true);
    expect(s.insights.insights[0]!.text).toContain("«Tiempo de espera» aparece en 3 opiniones neutrales o negativas");
  });

  it("cambiar los umbrales cambia la clasificación positiva/neutral/negativa", async () => {
    const { b } = await seed();
    const s = await getDashboardStats({ ...b, positiveMin: 5, negativeMax: 3 }, 30, NOW);
    expect([s.current.positive, s.current.neutral, s.current.negative]).toEqual([2, 2, 4]);
  });

  it("con pocos datos informa que la información es insuficiente", async () => {
    const b = await makeBusiness("Resto Nuevo");
    await insertFeedback(b.id, [{ rating: 4, daysAgo: 1 }], NOW);
    const s = await getDashboardStats(b, 30, NOW);
    expect(s.insights.sufficient).toBe(false);
    expect(s.insights.message).toMatch(/no hay información suficiente/);
    const empty = await getDashboardStats(await makeBusiness("Resto Vacío"), 30, NOW);
    expect(empty.current.average).toBeNull();
    expect(empty.totalAllTime).toBe(0);
  });

  it("filtros de la bandeja: puntuación, estado, categoría, período, texto, orden y paginación", async () => {
    const { b, espera } = await seed();
    const by = (p: Record<string, string>) => listFeedback(b.id, parseFeedbackFilters(p));
    expect((await by({})).total).toBe(14);
    expect((await by({ puntuacion: "1,2" })).total).toBe(6);
    expect((await by({ estado: "revisadas" })).total).toBe(1);
    expect((await by({ estado: "nuevas" })).total).toBe(13);
    expect((await by({ categoria: espera.id })).total).toBe(4);
    expect((await by({ dias: "7" })).total).toBe(5);
    expect((await by({ q: "ESPERAMOS" })).items.map((i) => i.comment)).toEqual(["Esperamos una hora"]);
    expect((await by({ q: "%" })).total).toBe(0); // los comodines se tratan como texto
    expect((await by({ q: "_" })).total).toBe(0);
    expect((await by({ orden: "menor" })).items[0]!.rating).toBe(1);
    expect((await by({ orden: "mayor" })).items[0]!.rating).toBe(5);
    const recent = await by({});
    expect(recent.items[0]!.comment).toBe("Excelente atención");
    const paged = await listFeedback(b.id, parseFeedbackFilters({ pagina: "2" }), 10);
    expect(paged.page).toBe(2);
    expect(paged.pages).toBe(2);
    expect(paged.items).toHaveLength(4);
    const beyond = await listFeedback(b.id, parseFeedbackFilters({ pagina: "99" }), 10);
    expect(beyond.page).toBe(2);
  });

  it("marcar como revisada y agregar notas no altera la puntuación original", async () => {
    const { b } = await seed();
    const user = await makeMember(b.id, "owner@resto.com");
    const { items } = await listFeedback(b.id, parseFeedbackFilters({ puntuacion: "1" }));
    const id = items[0]!.id;
    await setFeedbackReviewed(b.id, id, true, user.id);
    await addFeedbackNote(b.id, id, user.id, "Hablamos con cocina");
    const d = await getFeedbackDetail(b.id, id);
    expect(d?.status).toBe("REVIEWED");
    expect(d?.rating).toBe(1);
    expect(d?.notes.map((n) => n.body)).toEqual(["Hablamos con cocina"]);
    await setFeedbackReviewed(b.id, id, false, user.id);
    expect((await getFeedbackDetail(b.id, id))?.status).toBe("NEW");
    const n = await markAllReviewed(b.id, user.id);
    expect(n).toBe(13);
  });

  it("exporta a CSV con los filtros, sin notas internas y neutralizando fórmulas", async () => {
    const { b } = await seed();
    const user = await makeMember(b.id, "owner@resto.com");
    const all = await listFeedback(b.id, parseFeedbackFilters({}));
    await addFeedbackNote(b.id, all.items[0]!.id, user.id, "NOTA-PRIVADA-NO-EXPORTAR");
    const { csv, count } = await exportFeedbackCsv(b, parseFeedbackFilters({}), user.id);
    expect(count).toBe(14);
    const lines = csv.replace(/^﻿/, "").trim().split("\r\n");
    expect(lines[0]).toBe("Fecha;Puntuación;Valoración;Comentario;Categorías;Estado;ID");
    expect(lines).toHaveLength(15);
    expect(csv).not.toContain("NOTA-PRIVADA-NO-EXPORTAR");
    expect(csv).toContain(`"'=HYPERLINK(""http://malo"")"`);
    const filtered = await exportFeedbackCsv(b, parseFeedbackFilters({ puntuacion: "5" }), user.id);
    expect(filtered.count).toBe(4);
    const audit = await withSystem((tx) => tx.auditLog.count({ where: { action: "feedback.exported" } }));
    expect(audit).toBe(2);
  });
});
