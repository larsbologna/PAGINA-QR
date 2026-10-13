import { test, expect, devices } from "@playwright/test";

const BASE = "http://localhost:4173/";
const PUBLIC = `${BASE}?c=demo-cafe-la-esquina`;

function trackErrors(page: import("@playwright/test").Page) {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  return errors;
}

test.use({ viewport: devices["Pixel 7"].viewport, deviceScaleFactor: devices["Pixel 7"].deviceScaleFactor, isMobile: true, hasTouch: true, userAgent: devices["Pixel 7"].userAgent });

test.describe("Web estática · modo demo (sin Firebase configurado)", () => {

  test("5 estrellas muestra el botón para continuar a Google Maps", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(PUBLIC);
    await page.getByRole("radio", { name: /^5 estrellas/ }).click();
    await expect(page.getByRole("heading", { name: "¡Gracias por las 5 estrellas!" })).toBeVisible();
    const cta = page.getByRole("link", { name: /Continuar a Google Maps/ });
    await expect(cta).toHaveAttribute("href", /google\.com\/maps/);
    await expect(cta).not.toHaveAttribute("target", "_blank");
    expect(errors).toEqual([]);
  });

  test("1 a 4 estrellas abre el formulario privado, guarda y aparece en el panel", async ({ page }) => {
    const errors = trackErrors(page);
    await page.goto(PUBLIC);
    await page.getByRole("radio", { name: /^2 estrellas/ }).click();
    await expect(page.getByRole("heading", { name: "Contanos qué podemos mejorar" })).toBeVisible();
    await page.getByLabel("¿Qué te pareció tu experiencia?").fill("Prueba E2E desde el celular");
    await page.getByRole("button", { name: "Tiempo de espera" }).click();
    await page.getByText("Quiero que me contacten").click();
    await page.getByRole("button", { name: "Enviar opinión" }).click();
    await expect(page.getByRole("alert")).toContainText("teléfono o un email");
    await page.getByLabel("Teléfono o WhatsApp").fill("11 5555-0400");
    await page.getByRole("button", { name: "Enviar opinión" }).click();
    await expect(page.getByRole("heading", { name: "¡Recibimos tu opinión!" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Dejar reseña en Google/ })).toBeVisible();

    // Mismo navegador → mismo almacenamiento de demo → el panel la muestra.
    await page.goto(`${BASE}#/login`);
    await page.getByRole("button", { name: "Entrar a la demo" }).click();
    await page.goto(`${BASE}#/panel/demo-cafe-la-esquina/mejorar`);
    const card = page.locator("li.fb").filter({ hasText: "Prueba E2E desde el celular" });
    await expect(card).toBeVisible();
    await expect(card.getByRole("link", { name: "11 5555-0400" })).toHaveAttribute("href", "tel:1155550400");
    await card.getByRole("button", { name: "En seguimiento" }).click();
    await expect(page.locator("li.fb").filter({ hasText: "Prueba E2E desde el celular" })).toHaveCount(0); // sale de "Nuevas"
    await page.goto(`${BASE}#/panel/demo-cafe-la-esquina/mejorar?ver=IN_PROGRESS`);
    await expect(page.locator("li.fb").filter({ hasText: "Prueba E2E desde el celular" })).toBeVisible();
    expect(errors).toEqual([]);
  });

  test("las estrellas son grandes y no hay desplazamiento horizontal en el celular", async ({ page }) => {
    await page.goto(PUBLIC);
    const box = (await page.getByRole("radio", { name: /^3 estrellas/ }).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(44);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  test("un comercio inexistente muestra un mensaje claro", async ({ page }) => {
    await page.goto(`${BASE}?c=no-existe`);
    await expect(page.getByRole("heading", { name: "No encontramos este comercio" })).toBeVisible();
  });
});
