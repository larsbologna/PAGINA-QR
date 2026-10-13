import { test, expect } from "@playwright/test";
import { SUPERADMIN, createBusinessViaUi, login, submitPublicFeedback, trackConsole } from "./helpers";

test("panel: estados vacíos, filtros, búsqueda, configuración y panel maestro", async ({ browser, page }) => {
  const errors = trackConsole(page);
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  const biz = await createBusinessViaUi(page, { name: "Café Filtros", industry: "restaurante" });
  const base = `/panel/${biz.slug}`;

  // Estado vacío del resumen y del análisis.
  await page.goto(base);
  await expect(page.getByText("Todavía no recibiste opiniones")).toBeVisible();

  // Opiniones variadas desde la página pública.
  const client = await browser.newContext();
  const p = await client.newPage();
  const data = [
    { rating: 5, comment: "Excelente café", categories: ["Atención"] },
    { rating: 1, comment: "Demora terrible", categories: ["Tiempo de espera"] },
    { rating: 2, comment: "Mesa sucia", categories: ["Limpieza", "Tiempo de espera"] },
    { rating: 4, comment: "Muy rico" },
    { rating: 3, comment: "Normal" },
    { rating: 1, comment: "Otra demora", categories: ["Tiempo de espera"] },
  ];
  for (const d of data) {
    await p.goto(biz.publicUrl);
    await submitPublicFeedback(p, d);
  }
  await client.close();

  // Progreso = datos guardados.
  await page.goto(base);
  await expect(page.getByRole("heading", { name: "Tu progreso" })).toBeVisible();
  await expect(page.getByText("Opiniones recibidas", { exact: true }).locator("..")).toContainText("6");
  await expect(page.getByText("Calificación promedio", { exact: true }).locator("..")).toContainText("2,7"); // 16/6
  await expect(page.getByText("Para revisar", { exact: true }).locator("..")).toContainText("5"); // todas menos la de 5 ★
  await expect(page.getByText("«Tiempo de espera» aparece en 3 opiniones neutrales o negativas en los últimos 30 días")).toBeVisible();

  // "Para mejorar": solo 1 a 4 estrellas, con sus motivos.
  await page.goto(`${base}/mejorar`);
  await expect(page.getByText("Motivos más frecuentes · últimos 30 días")).toBeVisible();
  await expect(page.getByText("Demora terrible")).toBeVisible();
  await expect(page.getByText("Excelente café")).toHaveCount(0);
  await expect(page.getByRole("group", { name: "Estado de seguimiento" })).toHaveCount(5);

  // Filtros de la bandeja.
  await page.goto(`${base}/opiniones`);
  await expect(page.getByText("6 opiniones")).toBeVisible();
  await page.getByLabel("Puntuación").selectOption("1,2");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText("3 opiniones con los filtros aplicados")).toBeVisible();
  await page.getByLabel("Categoría").selectOption({ label: "Limpieza" });
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.getByText("1 opinión con los filtros aplicados")).toBeVisible();
  await expect(page.getByText("Mesa sucia")).toBeVisible();
  await page.goto(`${base}/opiniones?q=demora`);
  await expect(page.getByText("2 opiniones con los filtros aplicados")).toBeVisible();
  await page.goto(`${base}/opiniones?q=xyz-sin-resultados`);
  await expect(page.getByText("No hay opiniones con estos filtros")).toBeVisible();
  await page.goto(`${base}/opiniones?orden=menor`);
  await expect(page.getByRole("img", { name: /de 5 estrellas/ }).first()).toHaveAttribute("aria-label", /^1 de 5 estrellas/);
  const csv = await page.request.get(`/api/negocios/${biz.slug}/exportar?puntuacion=5`);
  expect((await csv.text()).trim().split("\r\n")).toHaveLength(2);

  // Configuración: validación de enlace de Google y vista previa.
  await page.goto(`${base}/configuracion`);
  await page.getByLabel("Enlace de Google (Perfil de Empresa / Maps)").fill("https://sitio-falso.com/review");
  await expect(page.getByText("El enlace debe ser de Google Maps o del Perfil de Empresa de Google.")).toBeVisible();
  await page.getByLabel("Enlace de Google (Perfil de Empresa / Maps)").fill("https://g.page/r/NuevoEnlace/review");
  await page.getByLabel("Mensaje de bienvenida").fill("¿Qué tal el café?");
  await expect(page.getByText("¿Qué tal el café?").last()).toBeVisible(); // vista previa en vivo
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados.")).toBeVisible();
  await page.goto(biz.publicUrl);
  await expect(page.getByText("¿Qué tal el café?")).toBeVisible();

  // Categorías personalizadas aparecen en la página pública.
  await page.goto(`${base}/configuracion`);
  await page.getByLabel("Nueva categoría").fill("Wifi");
  await page.getByRole("button", { name: "Agregar" }).click();
  await expect(page.getByText("Wifi", { exact: true })).toBeVisible();
  await page.goto(biz.publicUrl);
  await page.getByRole("radio", { name: /^4 estrellas/ }).check({ force: true });
  await expect(page.getByText("Wifi", { exact: true })).toBeVisible();

  // Panel maestro: búsqueda, filtros y conteo por comercio.
  await page.goto("/admin?q=filtros");
  const row = page.getByRole("row").filter({ hasText: "Café Filtros" });
  await expect(row).toContainText("6");
  await page.goto("/admin?q=no-existe-ninguno");
  await expect(page.getByText("Ningún negocio coincide con la búsqueda")).toBeVisible();
  await page.goto("/admin?estado=SUSPENDED&q=filtros");
  await expect(page.getByText("Ningún negocio coincide con la búsqueda")).toBeVisible();

  // Reporte imprimible.
  await page.goto(`${base}/reportes`);
  await expect(page.getByRole("heading", { name: "Café Filtros" })).toBeVisible();
  await expect(page.getByText("Principales oportunidades de mejora")).toBeVisible();

  expect(errors).toEqual([]);
});
