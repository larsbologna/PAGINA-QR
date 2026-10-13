import { readFileSync } from "node:fs";
import { test, expect, devices } from "@playwright/test";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { doc, setDoc } from "firebase/firestore";

// Modo Firebase real contra los emuladores de Firestore y Authentication.
const BASE = "http://localhost:4174/";
const PROJECT = "demo-reputacion";
const AUTH = "http://127.0.0.1:9099";
let env: RulesTestEnvironment;

async function createAuthUser(email: string, password: string): Promise<string> {
  const r = await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-key`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  });
  const j = (await r.json()) as { localId: string };
  return j.localId;
}

async function login(page: import("@playwright/test").Page, email: string, password: string) {
  await page.goto(`${BASE}#/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

test.beforeAll(async () => {
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") } });
  await env.clearFirestore();
  const adminUid = await createAuthUser("admin@e2e.test", "admin-clave-123");
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore();
    await setDoc(doc(db, "admins", adminUid), { email: "admin@e2e.test" });
    // Otro comercio con una opinión que el dueño de prueba NO debe poder ver.
    await setDoc(doc(db, "businesses", "ajeno"), {
      name: "Comercio Ajeno", brandColor: "#334155", logo: null, welcomeMessage: "Hola", thankYouMessage: "Gracias",
      googleReviewUrl: null, categories: [], active: true, isDemo: false,
    });
    await setDoc(doc(db, "access", "ajeno"), { ownerUids: ["otro"], ownerEmails: ["otro@e2e.test"] });
    await setDoc(doc(db, "businesses/ajeno/feedback/x"), { rating: 1, comment: "SECRETO-AJENO", categories: [], status: "NEW", createdAt: new Date() });
  });
});

test.afterAll(async () => env?.cleanup());

test("recorrido completo con Firebase: alta → QR → opiniones → panel del dueño, con aislamiento", async ({ browser }) => {
  const errors: string[] = [];
  const GOOGLE = "https://g.page/r/E2eFirebase/review";

  // 1) El superadministrador crea el comercio y la cuenta del dueño.
  const adminPage = await (await browser.newContext()).newPage();
  adminPage.on("pageerror", (e) => errors.push(e.message));
  await login(adminPage, "admin@e2e.test", "admin-clave-123");
  await expect(adminPage.getByRole("heading", { name: "Comercios" })).toBeVisible();
  await adminPage.getByLabel("Nombre").fill("Pizzería Firebase");
  await adminPage.getByLabel("Enlace de Google Maps (opcional)").fill(GOOGLE);
  await adminPage.getByRole("button", { name: "Crear comercio" }).click();
  const row = adminPage.locator(".card").filter({ hasText: "Pizzería Firebase" }).first();
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: "Opciones" }).click();
  await row.getByLabel("Email del dueño").fill("dueno@e2e.test");
  await row.getByLabel("Contraseña inicial").fill("dueno-clave-123");
  await row.getByRole("button", { name: "Crear cuenta del dueño" }).click();
  await expect(row.getByText("Dueños: dueno@e2e.test")).toBeVisible();

  // 2) El QR descargado apunta a la página pública del comercio.
  await adminPage.goto(`${BASE}#/panel/pizzeria-firebase/qr`);
  const dl = adminPage.waitForEvent("download");
  await adminPage.getByRole("button", { name: "PNG 512px" }).click();
  const png = PNG.sync.read(readFileSync((await (await dl).path())!));
  expect(jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data).toBe(`${BASE}?c=pizzeria-firebase`);

  // 3) Un cliente desde el celular: 2 estrellas con contacto, y otro con 5 estrellas.
  const phone = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
  phone.on("pageerror", (e) => errors.push(e.message));
  await phone.goto(`${BASE}?c=pizzeria-firebase`);
  await phone.getByRole("radio", { name: /^2 estrellas/ }).click();
  await phone.getByLabel("¿Qué te pareció tu experiencia?").fill("La pizza llegó fría");
  await phone.getByText("Quiero que me contacten").click();
  await phone.getByLabel("Teléfono o WhatsApp").fill("11 5555-0500");
  await phone.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(phone.getByRole("heading", { name: "¡Recibimos tu opinión!" })).toBeVisible();

  const phone2 = await (await browser.newContext({ ...devices["Pixel 7"] })).newPage();
  await phone2.route("https://g.page/**", (r) => r.fulfill({ body: "Google Maps (simulado)" }));
  await phone2.goto(`${BASE}?c=pizzeria-firebase`);
  await phone2.getByRole("radio", { name: /^5 estrellas/ }).click();
  const cta = phone2.getByRole("link", { name: /Continuar a Google Maps/ });
  await expect(cta).toHaveAttribute("href", GOOGLE);
  await cta.click();
  await expect(phone2).toHaveURL(GOOGLE);

  // 4) El dueño entra y ve solo lo suyo.
  const owner = await (await browser.newContext()).newPage();
  owner.on("pageerror", (e) => errors.push(e.message));
  await login(owner, "dueno@e2e.test", "dueno-clave-123");
  await expect(owner.getByRole("heading", { name: "Tu progreso" })).toBeVisible();
  await expect(owner.locator(".stat").filter({ hasText: "Opiniones recibidas" })).toContainText("2");
  await owner.getByRole("link", { name: /Para mejorar/ }).click();
  const card = owner.locator("li.fb").filter({ hasText: "La pizza llegó fría" });
  await expect(card).toBeVisible();
  await expect(card.getByRole("link", { name: "11 5555-0500" })).toBeVisible();
  await card.getByRole("button", { name: "Resuelta" }).click();
  await expect(owner.getByText("Marcada como «Resuelta».")).toBeVisible();
  await owner.goto(`${BASE}#/panel/pizzeria-firebase/mejorar?ver=REVIEWED`);
  await expect(owner.locator("li.fb").filter({ hasText: "La pizza llegó fría" })).toBeVisible();

  // Aislamiento: el panel de otro comercio no se puede abrir.
  await owner.goto(`${BASE}#/panel/ajeno/mejorar`);
  await expect(owner.getByRole("heading", { name: "No encontramos este comercio" })).toBeVisible();
  await expect(owner.getByText("SECRETO-AJENO")).toHaveCount(0);
  // Y el dueño no entra al panel maestro.
  await owner.goto(`${BASE}#/admin`);
  await expect(owner.getByRole("heading", { name: "Comercios" })).toHaveCount(0);

  expect(errors).toEqual([]);
});
