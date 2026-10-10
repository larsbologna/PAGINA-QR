import { test, expect, devices } from "@playwright/test";
import { SUPERADMIN, createBusinessViaUi, login, submitPublicFeedback, trackConsole } from "./helpers";

const GOOGLE = "https://maps.app.goo.gl/E2eTodasLasPuntuaciones";
let publicUrl = "";
let slug = "";

test.beforeAll(async ({ browser }) => {
  const page = await browser.newPage();
  await login(page, SUPERADMIN.email, SUPERADMIN.password);
  ({ publicUrl, slug } = await createBusinessViaUi(page, { name: "Barbería Pública", googleUrl: GOOGLE, industry: "barberia" }));
  await page.close();
});

test.use({ ...devices["Pixel 7"] });

for (const rating of [1, 2, 3, 4, 5]) {
  test(`con ${rating} estrella(s) se guarda y se ofrece la reseña en Google`, async ({ page }) => {
    const errors = trackConsole(page);
    await page.goto(publicUrl);
    await submitPublicFeedback(page, { rating, comment: `Prueba ${rating}` });
    await expect(page.getByRole("link", { name: "Dejar reseña en Google" })).toHaveAttribute("href", GOOGLE);
    await expect(page.getByText("Ya podés cerrar esta página cuando quieras.")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("el acceso a Google se ofrece también antes de puntuar", async ({ page }) => {
  await page.goto(publicUrl);
  await expect(page.getByRole("link", { name: "Ir a Google" })).toHaveAttribute("href", GOOGLE);
});

test("se usa cómodamente en un celular: estrellas grandes y sin desplazamiento horizontal", async ({ page }) => {
  await page.goto(publicUrl);
  const star = page.locator("label").filter({ has: page.getByRole("radio", { name: /^3 estrellas/ }) });
  const box = (await star.boundingBox())!;
  expect(box.width).toBeGreaterThanOrEqual(44);
  expect(box.height).toBeGreaterThanOrEqual(44);
  await page.getByRole("radio", { name: /^4 estrellas/ }).focus();
  await page.keyboard.press("ArrowRight"); // navegación con teclado
  await expect(page.getByRole("radio", { name: /^5 estrellas/ })).toBeChecked();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("muestra un error claro si falla el envío y permite reintentar sin duplicar", async ({ page }) => {
  let calls = 0;
  const keys: string[] = [];
  await page.route("**/api/public/feedback", async (route) => {
    calls++;
    keys.push(JSON.parse(route.request().postData()!).submissionKey);
    if (calls === 1) return route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "No pudimos guardar tu opinión. Probá de nuevo en unos minutos." }) });
    return route.continue();
  });
  await page.goto(publicUrl);
  await page.getByRole("radio", { name: /^3 estrellas/ }).check({ force: true });
  await page.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "No pudimos" })).toContainText("No pudimos guardar tu opinión");
  await page.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(page.getByRole("heading", { name: "¡Recibimos tu opinión!" })).toBeVisible();
  expect(keys[0]).toBe(keys[1]); // misma clave ⇒ el servidor no duplica
});

test("el servidor rechaza puntuaciones inválidas y orígenes externos", async ({ request }) => {
  const base = { slug, comment: "", categoryIds: [], website: "" };
  for (const rating of [0, 6, 2.5, "5"]) {
    const r = await request.post("/api/public/feedback", { data: { ...base, rating, submissionKey: `invalida-${String(rating)}-xx` } });
    expect(r.status()).toBe(400);
  }
  const foreign = await request.post("/api/public/feedback", {
    data: { ...base, rating: 5, submissionKey: "origen-externo-1" },
    headers: { Origin: "https://sitio-malicioso.example" },
  });
  expect(foreign.status()).toBe(403);
});

test("un negocio inexistente muestra la página 404", async ({ page }) => {
  const res = await page.goto("/r/no-existe-este-negocio");
  expect(res?.status()).toBe(404);
  await expect(page.getByText("No encontramos esta página")).toBeVisible();
});
