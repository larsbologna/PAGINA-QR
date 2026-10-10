import { beforeEach, describe, expect, it } from "vitest";
import { resetDb, prisma } from "../support/db";
import { makeSuperadmin } from "../support/factories";
import { invitationFlow, loginFlow, safeNext } from "@/server/auth/flows";
import { createBusiness } from "@/server/services/businesses";

describe("Flujos de autenticación", () => {
  beforeEach(resetDb);

  it("solo acepta redirecciones internas tras el login", () => {
    expect(safeNext("/panel/x")).toBe("/panel/x");
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("/\\evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext(undefined)).toBeNull();
  });

  it("inicia sesión, redirige según el rol y registra auditoría", async () => {
    await makeSuperadmin("jefe@test.com");
    const r = await loginFlow({ email: "JEFE@test.com", password: "superadmin-clave-123" }, "ip-1");
    expect(r.ok && r.redirectTo).toBe("/admin");
    const bad = await loginFlow({ email: "jefe@test.com", password: "otra" }, "ip-1");
    expect(bad).toEqual({ ok: false, error: "Email o contraseña incorrectos." });
    const unknown = await loginFlow({ email: "nadie@test.com", password: "otra" }, "ip-1");
    expect(unknown).toEqual(bad); // mismo mensaje: no revela si el email existe
    expect(await prisma.auditLog.count({ where: { action: "auth.login" } })).toBe(1);
  });

  it("bloquea la fuerza bruta por IP y email", async () => {
    await makeSuperadmin("jefe@test.com");
    for (let i = 0; i < 10; i++) await loginFlow({ email: "jefe@test.com", password: "mal" }, "ip-ataque");
    const blocked = await loginFlow({ email: "jefe@test.com", password: "superadmin-clave-123" }, "ip-ataque");
    expect(blocked).toEqual({ ok: false, error: "Demasiados intentos. Esperá unos minutos y volvé a probar." });
    const other = await loginFlow({ email: "jefe@test.com", password: "superadmin-clave-123" }, "otra-ip");
    expect(other.ok).toBe(true);
  });

  it("la invitación valida la contraseña y no se puede reutilizar", async () => {
    const { invitationToken } = await createBusiness({ name: "Flujo Inv", industry: "comercio", plan: "BASICO", ownerEmail: "o@inv.com" }, null);
    expect(await invitationFlow({ token: invitationToken, password: "corta", confirm: "corta" }, "ip")).toMatchObject({ ok: false, fields: { password: expect.any(String) } });
    expect(await invitationFlow({ token: invitationToken, password: "larga-clave-1", confirm: "distinta-123" }, "ip")).toMatchObject({ ok: false, fields: { confirm: "Las contraseñas no coinciden." } });
    const ok = await invitationFlow({ token: invitationToken, password: "larga-clave-1", confirm: "larga-clave-1" }, "ip");
    expect(ok.ok && ok.redirectTo).toBe("/panel");
    const again = await invitationFlow({ token: invitationToken, password: "larga-clave-1", confirm: "larga-clave-1" }, "ip");
    expect(again).toEqual({ ok: false, error: "La invitación no es válida o venció." });
  });
});

describe("Restablecimiento de contraseña", () => {
  beforeEach(resetDb);

  it("el enlace cambia la contraseña, cierra sesiones y sirve una sola vez", async () => {
    const { createPasswordReset, findValidReset } = await import("@/server/services/password-reset");
    const { resetFlow } = await import("@/server/auth/flows");
    const { createSession, validateSessionToken } = await import("@/server/auth/sessions");
    const admin = await makeSuperadmin("jefe@test.com");
    const user = await prisma.user.create({ data: { email: "duenio@test.com", passwordHash: "x" } });
    const old = await createSession(user.id);
    const token = await createPasswordReset(user.id, admin.id);
    expect(await findValidReset(token)).not.toBeNull();
    expect(await resetFlow({ token, password: "nueva-clave-123", confirm: "otra" }, "ip")).toMatchObject({ ok: false });
    const ok = await resetFlow({ token, password: "nueva-clave-123", confirm: "nueva-clave-123" }, "ip");
    expect(ok.ok).toBe(true);
    expect(await validateSessionToken(old.token)).toBeNull(); // sesiones anteriores cerradas
    expect((await loginFlow({ email: "duenio@test.com", password: "nueva-clave-123" }, "ip")).ok).toBe(true);
    expect(await resetFlow({ token, password: "otra-clave-456", confirm: "otra-clave-456" }, "ip")).toEqual({
      ok: false,
      error: "El enlace no es válido o venció.",
    });
  });
});
