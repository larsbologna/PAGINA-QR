import { describe, expect, it } from "vitest";
import { resetDb, prisma } from "../support/db";
import { seedDemo, DEMO_SLUG } from "@/server/demo";
import { createBusiness } from "@/server/services/businesses";
import { withSystem } from "@/server/tenant";
import { getDashboardStats } from "@/server/services/stats";

describe("Modo demostración", () => {
  it("crea un negocio DEMO aislado, idempotente, sin tocar negocios reales", async () => {
    await resetDb();
    const { business: real } = await createBusiness({ name: "Negocio Real", industry: "comercio", plan: "BASICO" }, null);
    const first = await seedDemo({ password: "clave-demo-123", now: new Date("2026-10-10T12:00:00Z") });
    const second = await seedDemo({ password: "clave-demo-123", now: new Date("2026-10-10T12:00:00Z") });
    expect(second.feedbackCount).toBe(first.feedbackCount); // determinista
    const demo = await prisma.business.findUniqueOrThrow({ where: { slug: DEMO_SLUG } });
    expect(demo.isDemo).toBe(true);
    expect(await prisma.business.count({ where: { slug: DEMO_SLUG } })).toBe(1);
    const realCount = await withSystem((tx) => tx.feedback.count({ where: { businessId: real.id } }));
    expect(realCount).toBe(0); // los negocios reales empiezan vacíos
    const stats = await getDashboardStats(demo, 30, new Date("2026-10-10T12:00:00Z"));
    expect(stats.totalAllTime).toBe(second.feedbackCount);
    expect(stats.insights.sufficient).toBe(true);
  });

  it("se niega a pisar un negocio real que use el slug de demo", async () => {
    await resetDb();
    await createBusiness({ name: "Real", slug: DEMO_SLUG, industry: "comercio", plan: "BASICO" }, null);
    await expect(seedDemo({ password: "clave-demo-123" })).rejects.toThrow(/REAL/);
  });
});
