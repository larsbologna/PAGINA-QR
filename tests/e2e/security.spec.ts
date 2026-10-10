import { test, expect } from "@playwright/test";
import { SUPERADMIN, acceptInvitation, createBusinessViaUi, login, trackConsole } from "./helpers";

test("sin sesión no se accede al panel, al panel maestro ni a las exportaciones", async ({ page, request }) => {
  await page.goto("/panel");
  await expect(page).toHaveURL(/\/login\?next=%2Fpanel/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
  const csv = await request.get("/api/negocios/cualquiera/exportar", { maxRedirects: 0 });
  expect(csv.status()).toBe(404);
});

test("credenciales incorrectas muestran un error sin revelar si el usuario existe", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email").fill(SUPERADMIN.email);
  await page.getByLabel("Contraseña").fill("incorrecta-123456");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "incorrectos" })).toHaveText("Email o contraseña incorrectos.");
});

test("un negocio no puede ver datos de otro negocio", async ({ browser, page }) => {
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  const a = await createBusinessViaUi(page, { name: "Gimnasio Aislado A", ownerEmail: "a@aislado.test", industry: "gimnasio" });
  const b = await createBusinessViaUi(page, { name: "Gimnasio Aislado B", ownerEmail: "b@aislado.test", industry: "gimnasio" });

  const { ctx, page: ownerA } = await acceptInvitation(browser, a.inviteLink!, "clave-dueno-a-123");
  const errors = trackConsole(ownerA);
  for (const path of [`/panel/${b.slug}`, `/panel/${b.slug}/opiniones`, `/panel/${b.slug}/configuracion`, `/panel/${b.slug}/qr`]) {
    const res = await ownerA.goto(path);
    expect(res?.status(), path).toBe(404);
  }
  for (const api of [`/api/negocios/${b.slug}/exportar`, `/api/negocios/${b.slug}/qr`]) {
    expect((await ownerA.request.get(api)).status(), api).toBe(404);
  }
  // Un dueño tampoco entra al panel maestro.
  expect((await ownerA.goto("/admin"))?.status()).toBe(404);
  // Pero sí a su propio negocio.
  expect((await ownerA.goto(`/panel/${a.slug}`))?.status()).toBe(200);
  await ctx.close();
  expect(errors.filter((e) => !e.includes("404"))).toEqual([]);
});

test("un negocio suspendido deja de recibir opiniones y su equipo no puede entrar", async ({ browser, page }) => {
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  const biz = await createBusinessViaUi(page, { name: "Kiosco Suspendible", ownerEmail: "k@susp.test" });
  const { ctx, page: owner } = await acceptInvitation(browser, biz.inviteLink!, "clave-kiosco-123");

  await page.goto("/admin");
  await page.getByRole("link", { name: "Kiosco Suspendible" }).click();
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Suspender cuenta" }).click();
  await expect(page.getByRole("button", { name: "Reactivar cuenta" })).toBeVisible();

  expect((await owner.goto(`/panel/${biz.slug}`))?.status()).toBe(404);
  await owner.goto(biz.publicUrl);
  await expect(owner.getByText("no está disponible en este momento")).toBeVisible();

  await page.getByRole("button", { name: "Reactivar cuenta" }).click();
  await expect(page.getByRole("button", { name: "Suspender cuenta" })).toBeVisible();
  expect((await owner.goto(`/panel/${biz.slug}`))?.status()).toBe(200);
  await ctx.close();
});

test("una invitación inválida muestra un mensaje claro", async ({ page }) => {
  await page.goto("/invitacion/token-que-no-existe");
  await expect(page.getByRole("heading", { name: "Invitación no válida" })).toBeVisible();
});

test("el superadministrador genera un enlace para restablecer la contraseña de un dueño", async ({ browser, page }) => {
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  const biz = await createBusinessViaUi(page, { name: "Taller Olvido", ownerEmail: "olvido@test.test" });
  const first = await acceptInvitation(browser, biz.inviteLink!, "clave-original-123");
  await first.ctx.close();

  await page.goto("/admin");
  await page.getByRole("link", { name: "Taller Olvido" }).click();
  await page.getByRole("button", { name: "Restablecer contraseña" }).click();
  const link = await page.getByLabel(/Enlace para olvido@test.test/).inputValue();
  expect(link).toContain("/restablecer/");

  const ctx = await browser.newContext();
  const owner = await ctx.newPage();
  await owner.goto(link);
  await owner.getByLabel("Contraseña nueva").fill("clave-nueva-456");
  await owner.getByLabel("Repetí la contraseña").fill("clave-nueva-456");
  await owner.getByRole("button", { name: "Guardar y entrar" }).click();
  await expect(owner).toHaveURL(new RegExp(`/panel/${biz.slug}`));
  await owner.goto(link);
  await expect(owner.getByRole("heading", { name: "Enlace no válido" })).toBeVisible();
  await ctx.close();
});
