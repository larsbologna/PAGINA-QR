import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, prisma } from "../support/db";
import { categoriesOf, makeBusiness } from "../support/factories";
import { submitFeedback } from "@/server/services/feedback";
import { setBusinessStatus } from "@/server/services/businesses";
import { withSystem } from "@/server/tenant";
import { AppError } from "@/server/errors";

const countFeedback = (businessId: string) => withSystem((tx) => tx.feedback.count({ where: { businessId } }));

describe("Envío de opiniones públicas", () => {
  beforeEach(resetDb);

  it("guarda opiniones de 1 a 5 estrellas con comentario y categorías", async () => {
    const b = await makeBusiness("Resto Uno");
    const cats = await categoriesOf(b.id);
    for (const rating of [1, 2, 3, 4, 5]) {
      const r = await submitFeedback(
        { slug: b.slug, rating, comment: `Comentario ${rating}`, categoryIds: [cats[0]!.id, cats[1]!.id], submissionKey: randomUUID() },
        `ip-${rating}`,
      );
      expect(r).toEqual({ ok: true, duplicate: false });
    }
    const rows = await withSystem((tx) =>
      tx.feedback.findMany({ where: { businessId: b.id }, include: { selections: true }, orderBy: { rating: "asc" } }),
    );
    expect(rows.map((r) => r.rating)).toEqual([1, 2, 3, 4, 5]);
    expect(rows[0]!.comment).toBe("Comentario 1");
    expect(rows[0]!.selections).toHaveLength(2);
    expect(rows.every((r) => r.status === "NEW")).toBe(true);
  });

  it("acepta una opinión sin comentario ni categorías (sin datos personales)", async () => {
    const b = await makeBusiness("Resto Dos");
    await submitFeedback({ slug: b.slug, rating: 4, submissionKey: randomUUID() }, "ip");
    const fb = await withSystem((tx) => tx.feedback.findFirstOrThrow({ where: { businessId: b.id } }));
    expect(fb.comment).toBeNull();
  });

  it.each([0, 6, -1, 3.5, Number.NaN])("rechaza la puntuación inválida %s en el servidor", async (rating) => {
    const b = await makeBusiness("Resto Tres");
    await expect(submitFeedback({ slug: b.slug, rating, submissionKey: randomUUID() }, "ip")).rejects.toBeInstanceOf(AppError);
    expect(await countFeedback(b.id)).toBe(0);
  });

  it("rechaza puntuaciones enviadas como texto", async () => {
    const b = await makeBusiness("Resto Texto");
    await expect(
      submitFeedback({ slug: b.slug, rating: "5" as unknown as number, submissionKey: randomUUID() }, "ip"),
    ).rejects.toThrow();
  });

  it("la base de datos también rechaza puntuaciones fuera de rango (CHECK)", async () => {
    const b = await makeBusiness("Resto Check");
    await expect(
      withSystem((tx) => tx.feedback.create({ data: { businessId: b.id, rating: 9, submissionKey: randomUUID() } })),
    ).rejects.toThrow();
  });

  it("rechaza comentarios demasiado largos", async () => {
    const b = await makeBusiness("Resto Largo");
    await expect(
      submitFeedback({ slug: b.slug, rating: 3, comment: "x".repeat(1001), submissionKey: randomUUID() }, "ip"),
    ).rejects.toThrow();
  });

  it("los envíos repetidos con la misma clave no duplican (secuencial y concurrente)", async () => {
    const b = await makeBusiness("Resto Doble");
    const key = randomUUID();
    const first = await submitFeedback({ slug: b.slug, rating: 5, submissionKey: key }, "ip");
    const second = await submitFeedback({ slug: b.slug, rating: 5, submissionKey: key }, "ip");
    expect(first.duplicate).toBe(false);
    expect(second.duplicate).toBe(true);

    const key2 = randomUUID();
    const results = await Promise.all(
      Array.from({ length: 4 }, () => submitFeedback({ slug: b.slug, rating: 2, submissionKey: key2 }, "ip-2")),
    );
    expect(results.filter((r) => !r.duplicate)).toHaveLength(1);
    expect(await countFeedback(b.id)).toBe(2);
  });

  it("rechaza categorías de otro negocio", async () => {
    const a = await makeBusiness("Negocio A");
    const b = await makeBusiness("Negocio B");
    const catsB = await categoriesOf(b.id);
    await expect(
      submitFeedback({ slug: a.slug, rating: 3, categoryIds: [catsB[0]!.id], submissionKey: randomUUID() }, "ip"),
    ).rejects.toThrow(/categorías/);
    expect(await countFeedback(a.id)).toBe(0);
  });

  it("rechaza categorías archivadas", async () => {
    const a = await makeBusiness("Negocio Arch");
    const cats = await categoriesOf(a.id);
    await withSystem((tx) => tx.feedbackCategory.update({ where: { id: cats[0]!.id }, data: { status: "ARCHIVED" } }));
    await expect(
      submitFeedback({ slug: a.slug, rating: 3, categoryIds: [cats[0]!.id], submissionKey: randomUUID() }, "ip"),
    ).rejects.toThrow(/categorías/);
  });

  it("descarta envíos de bots que completan el campo trampa", async () => {
    const b = await makeBusiness("Resto Bot");
    const r = await submitFeedback({ slug: b.slug, rating: 1, website: "http://spam", submissionKey: randomUUID() }, "ip");
    expect(r.ok).toBe(true);
    expect(await countFeedback(b.id)).toBe(0);
  });

  it("limita la frecuencia de envíos por conexión", async () => {
    const b = await makeBusiness("Resto Limite"); // límite de pruebas: 5 por hora
    for (let i = 0; i < 5; i++) await submitFeedback({ slug: b.slug, rating: 4, submissionKey: randomUUID() }, "1.2.3.4");
    await expect(submitFeedback({ slug: b.slug, rating: 4, submissionKey: randomUUID() }, "1.2.3.4")).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
    // Otra conexión no se ve afectada.
    await submitFeedback({ slug: b.slug, rating: 4, submissionKey: randomUUID() }, "5.6.7.8");
    expect(await countFeedback(b.id)).toBe(6);
    // La IP no se guarda en claro.
    const buckets = await prisma.rateLimitBucket.findMany();
    expect(buckets.some((x) => x.key.includes("1.2.3.4"))).toBe(false);
  });

  it("un negocio suspendido no recibe opiniones", async () => {
    const b = await makeBusiness("Resto Suspendido");
    await setBusinessStatus(b.id, "SUSPENDED", (await prisma.user.create({ data: { email: "x@x.com", passwordHash: "x" } })).id);
    await expect(submitFeedback({ slug: b.slug, rating: 5, submissionKey: randomUUID() }, "ip")).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
  });

  it("un negocio inexistente devuelve NOT_FOUND", async () => {
    await expect(submitFeedback({ slug: "no-existe", rating: 5, submissionKey: randomUUID() }, "ip")).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });
});
