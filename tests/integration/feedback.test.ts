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

describe("Contacto opcional y seguimiento", () => {
  beforeEach(resetDb);
  const key = () => randomUUID();

  it("guarda el contacto solo con consentimiento y al menos teléfono o email", async () => {
    const b = await makeBusiness("Resto Contacto");
    await submitFeedback(
      { slug: b.slug, rating: 2, comment: "Demora", submissionKey: key(), contact: { consent: true, name: "Ana", phone: "+54 11 5555-0101", email: "" } },
      "ip",
    );
    const fb = await withSystem((tx) => tx.feedback.findFirstOrThrow({ where: { businessId: b.id } }));
    expect(fb).toMatchObject({ contactName: "Ana", contactPhone: "+54 11 5555-0101", contactEmail: null });
    expect(fb.contactConsentAt).not.toBeNull();

    // Sin contacto: ningún dato personal.
    await submitFeedback({ slug: b.slug, rating: 3, submissionKey: key() }, "ip");
    const sinContacto = await withSystem((tx) => tx.feedback.findFirstOrThrow({ where: { businessId: b.id, rating: 3 } }));
    expect([sinContacto.contactName, sinContacto.contactPhone, sinContacto.contactEmail, sinContacto.contactConsentAt]).toEqual([null, null, null, null]);
  });

  it.each([
    [{ consent: false, name: "", phone: "1155550101", email: "" }, /aceptar/],
    [{ consent: true, name: "Ana", phone: "", email: "" }, /teléfono o un email/],
    [{ consent: true, name: "", phone: "", email: "no-es-email" }, /Email inválido/],
    [{ consent: true, name: "", phone: "abc", email: "" }, /Teléfono inválido/],
  ])("rechaza contacto inválido %j", async (contact, error) => {
    const b = await makeBusiness("Resto Inválido");
    await expect(submitFeedback({ slug: b.slug, rating: 2, submissionKey: key(), contact }, "ip")).rejects.toThrow(error);
    expect(await countFeedback(b.id)).toBe(0);
  });

  it("la base rechaza datos de contacto sin consentimiento (CHECK)", async () => {
    const b = await makeBusiness("Resto Check Contacto");
    await expect(
      withSystem((tx) => tx.feedback.create({ data: { businessId: b.id, rating: 2, submissionKey: key(), contactPhone: "1155550101" } })),
    ).rejects.toThrow();
  });

  it("cambia el estado de seguimiento: nueva → en seguimiento → resuelta, con auditoría y aislamiento", async () => {
    const { setFeedbackStatus, listFeedback, countPendingToImprove } = await import("@/server/services/feedback");
    const { parseFeedbackFilters } = await import("@/lib/feedback-filters");
    const a = await makeBusiness("Resto Seguimiento A");
    const otro = await makeBusiness("Resto Seguimiento B");
    const user = await prisma.user.create({ data: { email: "dueno@seg.com", passwordHash: "x" } });
    await submitFeedback({ slug: a.slug, rating: 1, submissionKey: key() }, "ip");
    const { items } = await listFeedback(a.id, parseFeedbackFilters({}));
    const id = items[0]!.id;
    expect(await countPendingToImprove(a.id)).toBe(1);

    await setFeedbackStatus(a.id, id, "IN_PROGRESS", user.id);
    expect((await listFeedback(a.id, parseFeedbackFilters({ estado: "seguimiento" }))).total).toBe(1);
    expect(await countPendingToImprove(a.id)).toBe(1); // en seguimiento sigue pendiente

    await setFeedbackStatus(a.id, id, "REVIEWED", user.id);
    const resuelta = await withSystem((tx) => tx.feedback.findUniqueOrThrow({ where: { id } }));
    expect(resuelta.status).toBe("REVIEWED");
    expect(resuelta.reviewedAt).not.toBeNull();
    expect(resuelta.rating).toBe(1); // la puntuación no cambia
    expect(await countPendingToImprove(a.id)).toBe(0);
    expect(await prisma.auditLog.count({ where: { action: "feedback.status_changed" } })).toBe(2);

    await expect(setFeedbackStatus(otro.id, id, "NEW", user.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
