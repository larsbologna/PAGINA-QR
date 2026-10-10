import { test, expect, devices } from "@playwright/test";
import { SUPERADMIN, acceptInvitation, createBusinessViaUi, decodeQr, login, trackConsole } from "./helpers";

const GOOGLE = "https://g.page/r/CbXyzE2eTest/review";

test("recorrido completo: crear negocio → QR → opinión → panel → estadísticas → CSV", async ({ browser, page }) => {
  const errors = trackConsole(page);

  // 1. El superadministrador inicia sesión y crea el negocio con invitación al dueño.
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  await expect(page).toHaveURL(/\/admin$/);
  const biz = await createBusinessViaUi(page, { name: "Pizzería Flujo Completo", ownerEmail: "duenio@flujo.test", googleUrl: GOOGLE, industry: "restaurante" });
  expect(biz.publicUrl).toBe("http://localhost:3100/r/pizzeria-flujo-completo");

  // 2. El QR (PNG) se descarga, se escanea y apunta a la URL pública.
  await page.goto(`/panel/${biz.slug}/qr`);
  await expect(page.getByRole("img", { name: /Código QR que abre/ })).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("link", { name: "Descargar PNG" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("qr-pizzeria-flujo-completo-1024.png");
  const fs = await import("node:fs/promises");
  const png = await fs.readFile((await download.path())!);
  expect(decodeQr(png)).toBe(biz.publicUrl);
  const svg = await page.request.get(`/api/negocios/${biz.slug}/qr?formato=svg`);
  expect(svg.headers()["content-type"]).toContain("image/svg+xml");

  // 3. Un cliente escanea desde el celular y envía una opinión (doble clic en Enviar).
  const mobile = await browser.newContext({ ...devices["iPhone 13"] });
  const phone = await mobile.newPage();
  const phoneErrors = trackConsole(phone);
  await phone.goto(biz.publicUrl);
  await expect(phone.getByText("Pizzería Flujo Completo", { exact: true }).first()).toBeVisible();
  await phone.getByRole("radio", { name: /^1 estrella:/ }).check({ force: true });
  await phone.getByLabel("¿Qué te pareció tu experiencia?").fill("La pizza llegó fría y tardó 50 minutos");
  await phone.getByText("Tiempo de espera", { exact: true }).click();
  await phone.getByRole("button", { name: "Enviar opinión" }).dblclick();
  await expect(phone.getByRole("heading", { name: "¡Recibimos tu opinión!" })).toBeVisible();
  // Una puntuación baja también recibe el acceso a Google.
  const google = phone.getByRole("link", { name: "Dejar reseña en Google" });
  await expect(google).toBeVisible();
  await expect(google).toHaveAttribute("href", GOOGLE);
  await mobile.close();

  // 4. El dueño acepta la invitación y revisa la opinión en su panel.
  const { ctx, page: owner } = await acceptInvitation(browser, biz.inviteLink!, "clave-del-duenio-123");
  const ownerErrors = trackConsole(owner);
  await expect(owner.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await expect(owner.getByText("Opiniones totales").locator("..")).toContainText("1");
  await owner.getByRole("link", { name: /Opiniones/ }).first().click();
  await expect(owner.getByText("1 opinión")).toBeVisible(); // sin duplicados por el doble clic
  await expect(owner.getByText("La pizza llegó fría y tardó 50 minutos")).toBeVisible();
  await owner.getByRole("link", { name: "Ver detalle y notas" }).click();
  await owner.getByLabel("Agregar nota interna").fill("Llamamos al repartidor");
  await owner.getByRole("button", { name: "Guardar nota" }).click();
  await expect(owner.getByText("Nota agregada.")).toBeVisible();
  await expect(owner.locator("li").filter({ hasText: "Llamamos al repartidor" })).toBeVisible();
  await owner.getByRole("button", { name: "Marcar revisada" }).click();
  await expect(owner.getByText("Revisada", { exact: true })).toBeVisible();
  await expect(owner.getByText(/La puntuación y el comentario originales no se pueden modificar/)).toBeVisible();

  // 5. Estadísticas coherentes con lo guardado.
  await owner.goto(`/panel/${biz.slug}`);
  await expect(owner.getByText("Promedio interno", { exact: true }).first().locator("..")).toContainText("1,0");
  await expect(owner.getByText("Todas revisadas")).toBeVisible();

  // 6. Exportación CSV.
  const csv = await owner.request.get(`/api/negocios/${biz.slug}/exportar`);
  expect(csv.status()).toBe(200);
  const body = await csv.text();
  expect(body).toContain("La pizza llegó fría y tardó 50 minutos");
  expect(body).toContain("Tiempo de espera");
  expect(body).not.toContain("Llamamos al repartidor"); // las notas internas no se exportan

  await ctx.close();
  expect([...errors, ...phoneErrors, ...ownerErrors]).toEqual([]);
});
