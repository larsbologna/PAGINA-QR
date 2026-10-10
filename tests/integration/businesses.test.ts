import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, prisma } from "../support/db";
import { categoriesOf, makeSuperadmin } from "../support/factories";
import { createBusiness, findBusinessForPublic, setBusinessPlan, setBusinessStatus, updateBusinessAdmin } from "@/server/services/businesses";
import { acceptInvitation, findValidInvitation } from "@/server/services/members";
import { authenticate } from "@/server/auth/credentials";
import { createSession, validateSessionToken, deleteSessionToken } from "@/server/auth/sessions";
import { publicFeedbackUrl } from "@/server/config";

describe("Negocios y acceso", () => {
  beforeEach(resetDb);

  it("un superadministrador crea un negocio con slug único, categorías del rubro y plan", async () => {
    const admin = await makeSuperadmin();
    const { business, invitationToken } = await createBusiness(
      { name: "Café La Esquina", industry: "restaurante", plan: "PROFESIONAL", ownerEmail: "duenio@cafe.com" },
      admin.id,
    );
    expect(business.slug).toBe("cafe-la-esquina");
    expect(publicFeedbackUrl(business.slug)).toBe("https://reputacion.test/r/cafe-la-esquina");
    const cats = await categoriesOf(business.id);
    expect(cats.map((c) => c.name)).toContain("Calidad de la comida");
    const plans = await prisma.businessPlan.findMany({ where: { businessId: business.id } });
    expect(plans).toHaveLength(1);
    expect(plans[0]!.plan).toBe("PROFESIONAL");
    expect(invitationToken).toBeTruthy();
    const audit = await prisma.auditLog.findFirst({ where: { action: "business.created" } });
    expect(audit?.userId).toBe(admin.id);
  });

  it("dos negocios con el mismo nombre reciben URLs públicas distintas", async () => {
    const a = await createBusiness({ name: "Barbería Don Juan", industry: "barberia", plan: "BASICO" }, null);
    const b = await createBusiness({ name: "Barbería Don Juan", industry: "barberia", plan: "BASICO" }, null);
    expect(a.business.slug).toBe("barberia-don-juan");
    expect(b.business.slug).toBe("barberia-don-juan-2");
  });

  it("rechaza un slug ya usado", async () => {
    await createBusiness({ name: "Uno", slug: "mi-negocio", industry: "comercio", plan: "BASICO" }, null);
    await expect(createBusiness({ name: "Dos", slug: "mi-negocio", industry: "comercio", plan: "BASICO" }, null)).rejects.toThrow(
      /en uso/,
    );
  });

  it("al cambiar el slug, la URL vieja (QR impreso) sigue resolviendo al negocio", async () => {
    const admin = await makeSuperadmin();
    const { business } = await createBusiness({ name: "Gym Fuerza", industry: "gimnasio", plan: "BASICO" }, admin.id);
    await updateBusinessAdmin(
      business.id,
      { name: "Gym Fuerza", slug: "gym-fuerza-centro", industry: "gimnasio", contactEmail: null, internalNotes: null, googleReviewUrl: null, retentionMonths: 24 },
      admin.id,
    );
    const old = await findBusinessForPublic("gym-fuerza");
    expect(old?.business.id).toBe(business.id);
    expect(old?.redirectTo).toBe("gym-fuerza-centro");
    const current = await findBusinessForPublic("gym-fuerza-centro");
    expect(current?.redirectTo).toBeNull();
    expect(await findBusinessForPublic("no-existe")).toBeNull();
  });

  it("la invitación crea la cuenta del dueño, que luego puede iniciar sesión", async () => {
    const { business, invitationToken } = await createBusiness(
      { name: "Kiosco Sol", industry: "comercio", plan: "BASICO", ownerEmail: "Ana@Kiosco.com" },
      null,
    );
    const inv = await findValidInvitation(invitationToken!);
    expect(inv?.email).toBe("ana@kiosco.com");
    expect(inv?.userExists).toBe(false);
    await acceptInvitation(invitationToken!, { password: "una-clave-segura", name: "Ana" });
    expect(await findValidInvitation(invitationToken!)).toBeNull(); // un solo uso
    const member = await prisma.businessMember.findFirst({ where: { businessId: business.id }, include: { user: true } });
    expect(member?.role).toBe("OWNER");
    expect(member?.user.passwordHash).not.toContain("una-clave-segura");

    expect(await authenticate("ana@kiosco.com", "clave-incorrecta")).toBeNull();
    const user = await authenticate("ANA@kiosco.com ", "una-clave-segura");
    expect(user?.id).toBe(member?.userId);

    const { token } = await createSession(user!.id);
    expect((await validateSessionToken(token))?.email).toBe("ana@kiosco.com");
    expect(await validateSessionToken("token-falso")).toBeNull();
    await deleteSessionToken(token);
    expect(await validateSessionToken(token)).toBeNull();
  });

  it("cambia plan y estado guardando historial", async () => {
    const admin = await makeSuperadmin();
    const { business } = await createBusiness({ name: "Plan Test", industry: "comercio", plan: "BASICO" }, admin.id);
    await setBusinessPlan(business.id, "PREMIUM", null, admin.id);
    const plans = await prisma.businessPlan.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "asc" } });
    expect(plans.map((p) => [p.plan, p.status])).toEqual([
      ["BASICO", "ENDED"],
      ["PREMIUM", "ACTIVE"],
    ]);
    const suspended = await setBusinessStatus(business.id, "SUSPENDED", admin.id);
    expect(suspended.status).toBe("SUSPENDED");
    expect(suspended.suspendedAt).not.toBeNull();
    const reactivated = await setBusinessStatus(business.id, "ACTIVE", admin.id);
    expect(reactivated.suspendedAt).toBeNull();
  });
});
