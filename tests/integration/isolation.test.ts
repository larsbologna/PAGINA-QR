import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, prisma } from "../support/db";
import { categoriesOf, insertFeedback, makeBusiness, makeMember, makeSuperadmin } from "../support/factories";
import { resolveBusinessAccess, listUserBusinesses } from "@/server/auth/access";
import { withTenant } from "@/server/tenant";
import { addFeedbackNote, getFeedbackDetail, listFeedback, setFeedbackReviewed } from "@/server/services/feedback";
import { renameCategory } from "@/server/services/categories";
import { getDashboardStats } from "@/server/services/stats";
import { setBusinessStatus } from "@/server/services/businesses";
import { parseFeedbackFilters } from "@/lib/feedback-filters";

describe("Aislamiento entre negocios", () => {
  beforeEach(resetDb);

  async function setup() {
    const a = await makeBusiness("Negocio Alfa");
    const b = await makeBusiness("Negocio Beta");
    const userA = await makeMember(a.id, "alfa@test.com");
    const userB = await makeMember(b.id, "beta@test.com", "MEMBER");
    const [fa] = await insertFeedback(a.id, [{ rating: 5, daysAgo: 1, comment: "secreto de Alfa" }]);
    const [fb] = await insertFeedback(b.id, [{ rating: 1, daysAgo: 1, comment: "secreto de Beta" }]);
    return { a, b, userA, userB, fa: fa!, fb: fb! };
  }

  it("un miembro solo accede a su propio negocio; el superadministrador a todos", async () => {
    const { a, b, userA, userB } = await setup();
    expect((await resolveBusinessAccess(userA, a.slug))?.role).toBe("OWNER");
    expect(await resolveBusinessAccess(userA, b.slug)).toBeNull();
    const accB = await resolveBusinessAccess(userB, b.slug);
    expect(accB?.role).toBe("MEMBER");
    expect(accB?.canManage).toBe(false);
    expect(await resolveBusinessAccess(userB, a.slug)).toBeNull();
    const admin = await makeSuperadmin();
    expect((await resolveBusinessAccess(admin, b.slug))?.role).toBe("SUPERADMIN");
    expect((await listUserBusinesses(userA)).map((x) => x.id)).toEqual([a.id]);
  });

  it("un negocio suspendido no es accesible para su equipo", async () => {
    const { a, userA } = await setup();
    const admin = await makeSuperadmin();
    await setBusinessStatus(a.id, "SUSPENDED", admin.id);
    expect(await resolveBusinessAccess(userA, a.slug)).toBeNull();
    expect(await resolveBusinessAccess(admin, a.slug)).not.toBeNull();
  });

  it("los servicios no devuelven ni modifican opiniones de otro negocio", async () => {
    const { a, fb, userA } = await setup();
    expect(await getFeedbackDetail(a.id, fb)).toBeNull();
    await expect(setFeedbackReviewed(a.id, fb, true, userA.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(addFeedbackNote(a.id, fb, userA.id, "nota intrusa")).rejects.toMatchObject({ code: "NOT_FOUND" });
    const list = await listFeedback(a.id, parseFeedbackFilters({}));
    expect(list.items.map((i) => i.comment)).toEqual(["secreto de Alfa"]);
    const stats = await getDashboardStats(a, 30);
    expect(stats.totalAllTime).toBe(1);
  });

  it("no se pueden renombrar categorías de otro negocio", async () => {
    const { a, b, userA } = await setup();
    const catsB = await categoriesOf(b.id);
    await expect(renameCategory(a.id, catsB[0]!.id, "hackeada", userA.id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("RLS: aun sin filtro en la consulta, la base solo devuelve filas del negocio activo", async () => {
    const { a, b } = await setup();
    const rows = await withTenant(a.id, (tx) => tx.feedback.findMany()); // sin where a propósito
    expect(rows.map((r) => r.businessId)).toEqual([a.id]);
    const cats = await withTenant(a.id, (tx) => tx.feedbackCategory.findMany());
    expect(cats.every((c) => c.businessId === a.id)).toBe(true);
    const updated = await withTenant(a.id, (tx) => tx.feedback.updateMany({ data: { status: "REVIEWED" } }));
    expect(updated.count).toBe(1);
    const bRows = await withTenant(b.id, (tx) => tx.feedback.findMany());
    expect(bRows[0]!.status).toBe("NEW");
  });

  it("RLS: no se puede insertar una opinión de otro negocio dentro del contexto de A", async () => {
    const { a, b, fb } = await setup();
    await expect(
      withTenant(a.id, (tx) => tx.feedback.create({ data: { businessId: b.id, rating: 5, submissionKey: randomUUID() } })),
    ).rejects.toThrow();
    await expect(
      withTenant(a.id, (tx) => tx.feedbackNote.create({ data: { feedbackId: fb, businessId: b.id, body: "x" } })),
    ).rejects.toThrow();
  });

  it("RLS: una consulta sin contexto de negocio no ve ninguna opinión", async () => {
    await setup();
    expect(await prisma.feedback.count()).toBe(0);
    expect(await prisma.feedbackNote.count()).toBe(0);
  });

  it("la clave foránea compuesta impide asociar una nota de B a una opinión de A", async () => {
    const { a, b, fa } = await setup();
    await expect(
      withTenant(b.id, (tx) => tx.feedbackNote.create({ data: { feedbackId: fa, businessId: b.id, body: "x" } })),
    ).rejects.toThrow();
    expect(a.id).not.toBe(b.id);
  });

  it("la conexión de la app no es superusuario ni ignora RLS", async () => {
    const [r] = await prisma.$queryRaw<{ rolsuper: boolean; rolbypassrls: boolean }[]>`
      SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = current_user`;
    expect(r).toEqual({ rolsuper: false, rolbypassrls: false });
  });
});
