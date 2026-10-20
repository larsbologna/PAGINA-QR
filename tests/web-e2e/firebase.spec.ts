// Recorridos completos en el navegador contra los emuladores de Firestore y Authentication.
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { test, expect, devices, type Browser, type Page } from "@playwright/test";
import { initializeTestEnvironment, type RulesTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs } from "firebase/firestore";

const BASE = "http://localhost:4174/";
const PROJECT = "demo-pagina-qr";
const AUTH = "http://127.0.0.1:9099";
const GOOGLE = "https://g.page/r/cafe-test/review";
const SHOTS = "test-results/capturas";
const PASSWORD = "clave-de-prueba-123";
let env: RulesTestEnvironment;

function crearNegocio(args: string[]) {
  return execFileSync("node", ["tools/crear-negocio.mjs", "--proyecto", PROJECT, ...args], { encoding: "utf8" });
}

async function feedback(slug: string) {
  let list: Record<string, unknown>[] = [];
  await env.withSecurityRulesDisabled(async (ctx) => {
    const s = await getDocs(collection(ctx.firestore(), `businesses/${slug}/feedback`));
    list = s.docs.map((d) => ({ id: d.id, ...d.data() }));
  });
  return list;
}

/** Cada visitante usa un contexto nuevo (otra sesión anónima, como otro celular). */
async function visitor(browser: Browser) {
  const ctx = await browser.newContext({ ...devices["Pixel 7"], locale: "es-AR" });
  // Google no se abre de verdad en las pruebas.
  await ctx.route("https://g.page/**", (r) => r.fulfill({ contentType: "text/html", body: "<title>Google (simulado)</title><h1>GOOGLE OK</h1>" }));
  await ctx.route("https://maps.app.goo.gl/**", (r) => r.fulfill({ contentType: "text/html", body: "<h1>GOOGLE NUEVO</h1>" }));
  const page = await ctx.newPage();
  return { ctx, page };
}

async function login(page: Page, email = "dueno@e2e.test") {
  await page.goto(`${BASE}#/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(PASSWORD);
  await page.getByRole("button", { name: "Ingresar" }).click();
}

/** Cualquier enlace o botón que lleve a Google (no debe existir con 1 a 4 estrellas). */
const googleLinks = (page: Page) => page.locator('a[href*="g.page"], a[href*="goo.gl"], a[href*="google."], [data-google]');

const noHorizontalScroll = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test.describe.configure({ mode: "serial" });

test.beforeAll(async () => {
  mkdirSync(SHOTS, { recursive: true });
  await fetch(`${AUTH}/emulator/v1/projects/${PROJECT}/accounts`, { method: "DELETE" });
  env = await initializeTestEnvironment({ projectId: PROJECT, firestore: { host: "127.0.0.1", port: 8080, rules: readFileSync("firestore.rules", "utf8") } });
  await env.clearFirestore();
  // Alta con la herramienta real (Admin SDK contra el emulador).
  const out = crearNegocio(["--slug", "cafe-test", "--nombre", "Café de Prueba", "--email", "dueno@e2e.test", "--password", PASSWORD, "--rubro", "Cafetería", "--direccion", "Av. Corrientes 1234", "--google", GOOGLE]);
  expect(out).toContain("Negocio creado");
  crearNegocio(["--slug", "ajeno", "--nombre", "Negocio Ajeno", "--email", "otro@e2e.test", "--password", PASSWORD]);
  crearNegocio(["--slug", "pausado", "--nombre", "Pausado", "--email", "otro@e2e.test"]);
  crearNegocio(["--slug", "pausado", "--suspender"]);
  crearNegocio(["--slug", "cambio", "--nombre", "Cambio de Puntuación", "--email", "otro@e2e.test", "--google", GOOGLE]);
  // Una opinión del otro negocio que el dueño de prueba nunca debe ver.
  await env.withSecurityRulesDisabled(async (ctx) => {
    const { setDoc } = await import("firebase/firestore");
    await setDoc(doc(ctx.firestore(), "businesses/ajeno/feedback/aaaaaaaaaaaaaaaaaaaaaaaa"), { rating: 1, comment: "SECRETO-AJENO", uid: "x", status: "pending", createdAt: new Date() });
  });
});

test.afterAll(async () => env?.cleanup());

test("5 estrellas: registra, agradece y abre las reseñas de Google del negocio", async ({ browser }) => {
  const { ctx, page } = await visitor(browser);
  await page.goto(`${BASE}?c=cafe-test`);
  await expect(page.getByText("Café de Prueba", { exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "¿Cómo fue tu experiencia?" })).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/01-publica-celular.png` });

  const star = page.getByRole("radio", { name: /^5 estrellas/ });
  const box = await star.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  await star.click();
  await expect(page.getByRole("heading", { name: "¡Gracias por tu opinión!" })).toBeVisible();
  const btn = page.getByRole("link", { name: /Escribir mi reseña en Google/ });
  await expect(btn).toBeVisible();
  await expect(btn).toHaveAttribute("href", GOOGLE);
  await page.screenshot({ path: `${SHOTS}/02-cinco-estrellas.png` });
  await page.waitForURL(GOOGLE, { timeout: 10_000 });
  await expect(page.getByText("GOOGLE OK")).toBeVisible();
  const list = await feedback("cafe-test");
  expect(list.filter((f) => f.rating === 5)).toHaveLength(1);
  expect(list[0]).toMatchObject({ rating: 5, comment: "", status: "pending" });
  await ctx.close();
});

for (const rating of [1, 2, 3, 4]) {
  test(`${rating} estrella(s): pide qué mejorar, guarda y NO ofrece Google`, async ({ browser }) => {
    const { ctx, page } = await visitor(browser);
    await page.goto(`${BASE}?c=cafe-test`);
    await page.getByRole("radio", { name: new RegExp(`^${rating} estrella`) }).click();
    await expect(page.getByRole("heading", { name: "¿Qué podríamos mejorar?" })).toBeVisible();
    await expect(page.getByRole("img", { name: `Elegiste ${rating} de 5 estrellas` })).toBeVisible();
    await expect(googleLinks(page)).toHaveCount(0);
    await expect(page.getByText(/Google/)).toHaveCount(0);
    const comment = rating === 3 ? "" : `Comentario de ${rating} estrellas`;
    if (comment) await page.getByLabel(/Qué podríamos mejorar/).fill(comment);
    if (rating === 2) await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/03-mejorar.png` });
    // Doble toque: no debe duplicar.
    const send = page.getByRole("button", { name: "Enviar opinión" });
    await send.dblclick();
    await expect(page.getByRole("heading", { name: "¡Gracias! Recibimos tu opinión." })).toBeVisible();
    await expect(page.getByText("para mejorar")).toBeVisible();
    await expect(googleLinks(page)).toHaveCount(0);
    // Tampoco hay redirección a Google.
    await page.waitForTimeout(2500);
    expect(page.url()).toContain("localhost:4174");
    if (rating === 2) await page.screenshot({ path: `${SHOTS}/04-confirmacion.png` });
    const mine = (await feedback("cafe-test")).filter((f) => f.rating === rating);
    expect(mine).toHaveLength(1);
    expect(mine[0].comment).toBe(comment);
    await ctx.close();
  });
}

test("cambiar de 5 a 4 estrellas: el botón de Google desaparece al instante", async ({ browser }) => {
  const { ctx, page } = await visitor(browser);
  await page.goto(`${BASE}?c=cambio`);
  await page.getByRole("radio", { name: /^5 estrellas/ }).click();
  await expect(page.getByRole("link", { name: /Escribir mi reseña en Google/ })).toHaveAttribute("href", GOOGLE);
  await page.getByRole("button", { name: "Cambiar puntuación" }).click();
  await expect(googleLinks(page)).toHaveCount(0);
  await page.getByRole("radio", { name: /^4 estrellas/ }).click();
  await expect(page.getByRole("heading", { name: "¿Qué podríamos mejorar?" })).toBeVisible();
  await expect(googleLinks(page)).toHaveCount(0);
  await page.getByLabel(/Qué podríamos mejorar/).fill("Cambié a 4");
  await page.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(page.getByRole("heading", { name: "¡Gracias! Recibimos tu opinión." })).toBeVisible();
  await expect(googleLinks(page)).toHaveCount(0);
  // No hubo redirección pendiente de la selección anterior.
  await page.waitForTimeout(3000);
  expect(page.url()).toContain("localhost:4174");
  const saved = await feedback("cambio");
  expect(saved).toHaveLength(1);
  expect(saved[0]).toMatchObject({ rating: 4, comment: "Cambié a 4" });
  await ctx.close();
});

test("negocio inexistente o suspendido", async ({ browser }) => {
  const { ctx, page } = await visitor(browser);
  await page.goto(`${BASE}?c=no-existe`);
  await expect(page.getByRole("heading", { name: "No encontramos este negocio" })).toBeVisible();
  await page.goto(`${BASE}?c=pausado`);
  await expect(page.getByText("no está disponible")).toBeVisible();
  await ctx.close();
});

test("panel protegido: sin sesión lleva al ingreso; credenciales malas fallan", async ({ page }) => {
  await page.goto(`${BASE}#/panel/cafe-test`);
  await expect(page.getByRole("heading", { name: "Ingresá a tu panel" })).toBeVisible();
  await page.getByLabel("Email").fill("dueno@e2e.test");
  await page.getByLabel("Contraseña").fill("incorrecta-123");
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page.getByText("Email o contraseña incorrectos.")).toBeVisible();
});

test("panel: resumen con datos reales, filtros, nota y resolución persistentes", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1366, height: 900 });
  await login(page);
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await expect(page.locator(".place-name")).toHaveText("Café de Prueba");
  // 5 opiniones: 5,1,2,3,4 → promedio 3,0; 2 positivas, 2 negativas, 4 pendientes.
  await expect(page.locator(".kpi-hero .kpi-value")).toContainText("3,0");
  const kpi = (label: string) => page.locator(".kpi", { hasText: label }).locator(".kpi-value");
  await expect(kpi("Opiniones")).toHaveText("5");
  await expect(kpi("Positivas")).toHaveText("2");
  await expect(kpi("Negativas")).toHaveText("2");
  await expect(kpi("Pendientes de resolver")).toHaveText("4");
  await expect(page.getByText("No son tus reseñas de Google")).toBeVisible();
  await expect(page.getByText("Tus reseñas públicas están en Google")).toBeVisible();
  await expect(page.locator(".dist-row")).toHaveCount(5);
  // Tooltip del gráfico.
  await page.locator(".chart-plot rect[data-i]").last().hover();
  await expect(page.locator(".chart-tip")).toBeVisible();
  await expect(page.locator(".chart-tip")).toContainText("5 opiniones");
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/05-resumen-escritorio.png`, fullPage: true });
  await page.getByRole("button", { name: "Últimos 7 días" }).click();
  await expect(kpi("Opiniones")).toHaveText("5");

  // Opiniones y filtros.
  await page.getByRole("navigation").first().getByRole("link", { name: "Opiniones" }).click();
  await expect(page.locator(".review")).toHaveCount(5);
  await expect(page.getByText("SECRETO-AJENO")).toHaveCount(0);
  const chip = (name: string) => page.locator(".chip", { hasText: name });
  await expect(chip("Positivas").locator(".chip-count")).toHaveText("2");
  await chip("Intermedias").click();
  await expect(page.locator(".review")).toHaveCount(1);
  await chip("Negativas").click();
  await expect(page.locator(".review")).toHaveCount(2);
  await chip("Pendientes").click();
  await expect(page.locator(".review")).toHaveCount(4);
  await chip("Resueltas").click();
  await expect(page.getByText("Todavía no marcaste opiniones como resueltas.")).toBeVisible();
  await chip("Todas").click();
  await page.screenshot({ path: `${SHOTS}/06-opiniones.png`, fullPage: true });

  // Detalle: nota interna con guardado automático.
  await page.locator(".review", { hasText: "Comentario de 1 estrellas" }).locator(".review-main").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel(/Nota interna/).fill("Llamamos al cliente y le ofrecimos disculpas.");
  await expect(dialog.getByText("Nota guardada")).toBeVisible();
  await dialog.getByText("Problema resuelto").click();
  await expect(page.getByText("Opinión marcada como resuelta")).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/07-detalle.png` });

  // Persisten al recargar.
  await page.reload();
  const again = page.getByRole("dialog");
  await expect(again.getByLabel(/Nota interna/)).toHaveValue("Llamamos al cliente y le ofrecimos disculpas.");
  await expect(again.getByRole("checkbox")).toBeChecked();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".chip", { hasText: "Pendientes" }).locator(".chip-count")).toHaveText("3");
  await expect(page.locator(".chip", { hasText: "Resueltas" }).locator(".chip-count")).toHaveText("1");

  // Volver a pendiente desde el listado.
  await page.locator(".review", { hasText: "Comentario de 1 estrellas" }).getByText("Resuelta", { exact: true }).last().click();
  await expect(page.getByText("La opinión volvió a pendiente")).toBeVisible();
  await expect(page.locator(".chip", { hasText: "Pendientes" }).locator(".chip-count")).toHaveText("4");
  // Y otra vez resuelta, para comprobar el resumen.
  await page.locator(".review", { hasText: "Comentario de 1 estrellas" }).locator("label.resolve").click();
  await expect(page.locator(".chip", { hasText: "Pendientes" }).locator(".chip-count")).toHaveText("3");

  const stored = (await feedback("cafe-test")).find((f) => f.comment === "Comentario de 1 estrellas")!;
  expect(stored).toMatchObject({ status: "resolved", note: "Llamamos al cliente y le ofrecimos disculpas.", rating: 1 });
  await page.getByRole("navigation").first().getByRole("link", { name: "Resumen" }).click();
  await expect(kpi("Pendientes de resolver")).toHaveText("3");
  expect(errors).toEqual([]);
});

test("configuración: valida y actualiza el enlace de Google que usa la pantalla pública", async ({ page, browser }) => {
  await login(page);
  await page.getByRole("navigation").first().getByRole("link", { name: "Configuración" }).click();
  const g = page.getByLabel("Enlace directo a tus reseñas de Google");
  await g.fill("https://evil.com/maps");
  await g.blur();
  await expect(page.getByText("Tiene que ser el enlace de reseñas")).toBeVisible();
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados")).toHaveCount(0);
  await g.fill("https://maps.app.goo.gl/nuevo123");
  await expect(page.getByRole("link", { name: "Probar enlace" })).toHaveAttribute("href", "https://maps.app.goo.gl/nuevo123");
  await page.getByLabel("Dirección (opcional)").fill("Calle Falsa 123");
  await page.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(page.getByText("Cambios guardados")).toBeVisible();
  await expect(page.locator(".place-meta")).toContainText("Calle Falsa 123");
  await expect(page.locator(".link-field code")).toHaveText(`${BASE}?c=cafe-test`);
  await page.screenshot({ path: `${SHOTS}/08-configuracion.png`, fullPage: true });
  await page.reload();
  await expect(page.getByLabel("Enlace directo a tus reseñas de Google")).toHaveValue("https://maps.app.goo.gl/nuevo123");

  let profile: Record<string, unknown> = {};
  await env.withSecurityRulesDisabled(async (ctx) => {
    profile = (await getDoc(doc(ctx.firestore(), "businesses/cafe-test"))).data()!;
  });
  expect(profile.googleReviewUrl).toBe("https://maps.app.goo.gl/nuevo123");

  const { ctx, page: pub } = await visitor(browser);
  await pub.goto(`${BASE}?c=cafe-test`);
  await pub.getByRole("radio", { name: /^5 estrellas/ }).click();
  await expect(pub.getByRole("link", { name: /Escribir mi reseña en Google/ })).toHaveAttribute("href", "https://maps.app.goo.gl/nuevo123");
  await pub.waitForURL("https://maps.app.goo.gl/nuevo123", { timeout: 10_000 });
  await ctx.close();
});

test("aislamiento: un dueño no accede al panel de otro negocio", async ({ page }) => {
  await login(page);
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await page.goto(`${BASE}#/panel/ajeno/opiniones`);
  await expect(page.getByRole("heading", { name: "No encontramos ese negocio" })).toBeVisible();
  await expect(page.getByText("SECRETO-AJENO")).toHaveCount(0);
  // Sin mapas: la identidad es de reseñas.
  await expect(page.locator(".review-art, .pub-art, .panel-art").first()).toBeAttached();
  await page.goto(`${BASE}#/panel/ajeno/opiniones/aaaaaaaaaaaaaaaaaaaaaaaa`);
  await expect(page.getByText("SECRETO-AJENO")).toHaveCount(0);
});

test("dueño con varios negocios elige cuál abrir; panel en celular", async ({ browser }) => {
  const ctx = await browser.newContext({ ...devices["iPhone 13"], locale: "es-AR" });
  const page = await ctx.newPage();
  await login(page, "otro@e2e.test");
  await expect(page.getByRole("heading", { name: "Elegí un negocio" })).toBeVisible();
  await page.getByRole("link", { name: /Negocio Ajeno/ }).click();
  await expect(page.getByRole("heading", { name: "Resumen" })).toBeVisible();
  await expect(page.locator(".bottom-nav")).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/09-panel-celular.png`, fullPage: true, timeout: 15_000 });
  await page.locator(".bottom-nav").getByRole("link", { name: "Opiniones" }).click();
  await expect(page.getByText("SECRETO-AJENO")).toBeVisible();
  expect(await noHorizontalScroll(page)).toBe(true);
  await ctx.close();
});

test("superadministrador: crea, limpia, suspende y elimina negocios", async ({ page, browser }) => {
  test.setTimeout(120_000);
  const out = crearNegocio(["--superadmin", "--email", "super@e2e.test", "--password", PASSWORD]);
  expect(out).toContain("superadministrador");
  await login(page, "super@e2e.test");
  await expect(page.getByRole("heading", { name: /Negocios/ })).toBeVisible();
  await expect(page.locator(".biz-card", { hasText: "Café de Prueba" })).toBeVisible();

  // Alta desde el formulario.
  await page.getByRole("button", { name: "Nuevo negocio" }).click();
  await page.getByLabel("Nombre del negocio").fill("Estilo Sur Barber");
  await expect(page.getByLabel("Identificador del QR")).toHaveValue("estilo-sur-barber");
  await page.getByLabel("Rubro").fill("Barbería");
  await page.getByLabel("Enlace a sus reseñas de Google").fill(GOOGLE);
  await page.getByLabel("Email del dueño").fill("barber@e2e.test");
  await page.getByLabel("Contraseña inicial").fill(PASSWORD);
  await page.getByRole("button", { name: "Crear negocio" }).click();
  await expect(page.getByText("«Estilo Sur Barber» creado")).toBeVisible();
  await expect(page.locator(".credentials")).toContainText("barber@e2e.test");
  await expect(page.locator(".credentials")).toContainText("?c=estilo-sur-barber");
  const card = page.locator(".biz-card", { hasText: "Estilo Sur Barber" });
  await expect(card).toBeVisible();
  await page.screenshot({ path: `${SHOTS}/12-superadmin.png`, fullPage: true });

  // Una opinión de prueba desde la pantalla pública.
  const { ctx, page: pub } = await visitor(browser);
  await pub.goto(`${BASE}?c=estilo-sur-barber`);
  await pub.getByRole("radio", { name: /^2 estrellas/ }).click();
  await pub.getByLabel(/Qué podríamos mejorar/).fill("opinión de prueba");
  await pub.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(pub.getByRole("heading", { name: "¡Gracias! Recibimos tu opinión." })).toBeVisible();
  expect(await feedback("estilo-sur-barber")).toHaveLength(1);

  // El superadmin puede abrir el panel del negocio.
  await page.reload();
  await card.getByRole("link", { name: "Abrir panel" }).click();
  await expect(page.getByText("opinión de prueba")).toBeVisible();
  await page.getByRole("link", { name: "Superadmin" }).click();

  // Borrar opiniones de prueba (pide escribir el identificador).
  await card.getByRole("button", { name: "Borrar opiniones" }).click();
  const dlg = page.getByRole("dialog");
  await expect(dlg.getByRole("button", { name: "Borrar opiniones" })).toBeDisabled();
  await dlg.getByLabel(/para confirmar/).fill("estilo-sur-barber");
  await dlg.getByRole("button", { name: "Borrar opiniones" }).click();
  await expect(page.getByText("1 opinión borrada")).toBeVisible();
  expect(await feedback("estilo-sur-barber")).toHaveLength(0);
  // El negocio, su enlace y su dueño siguen.
  await expect(card).toBeVisible();

  // Suspender: la pantalla pública deja de recibir opiniones.
  await card.getByRole("button", { name: "Suspender" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Suspender" }).click();
  await expect(card.getByText("Suspendido")).toBeVisible();
  await pub.goto(`${BASE}?c=estilo-sur-barber`);
  await expect(pub.getByText("no está disponible")).toBeVisible();
  await card.getByRole("button", { name: "Activar" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Activar" }).click();
  await expect(card.getByText("Activo")).toBeVisible();
  await ctx.close();

  // El dueño nuevo entra y ve solo su negocio.
  const owner = await browser.newContext({ locale: "es-AR" });
  const op = await owner.newPage();
  await login(op, "barber@e2e.test");
  await expect(op.locator(".place-name")).toHaveText("Estilo Sur Barber");
  await expect(op.getByRole("link", { name: "Superadmin" })).toHaveCount(0);
  await op.goto(`${BASE}#/admin`);
  await expect(op.getByRole("heading", { name: "Sin acceso" })).toBeVisible();
  await owner.close();

  // Eliminar.
  await card.getByRole("button", { name: "Eliminar" }).click();
  await page.getByRole("dialog").getByLabel(/para confirmar/).fill("estilo-sur-barber");
  await page.getByRole("dialog").getByRole("button", { name: "Eliminar negocio" }).click();
  await expect(page.getByText("Negocio eliminado")).toBeVisible();
  await expect(card).toHaveCount(0);
});

test("estado vacío del panel", async ({ page }) => {
  crearNegocio(["--slug", "vacio", "--nombre", "Negocio Nuevo", "--email", "vacio@e2e.test", "--password", PASSWORD]);
  await login(page, "vacio@e2e.test");
  await expect(page.getByRole("heading", { name: "Todavía no llegaron opiniones" })).toBeVisible();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${SHOTS}/10-vacio.png`, fullPage: true });
});

test("escritorio: pantalla pública", async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 860 });
  await page.goto(`${BASE}?c=cafe-test`);
  await expect(page.getByRole("heading", { name: "¿Cómo fue tu experiencia?" })).toBeVisible();
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${SHOTS}/11-publica-escritorio.png` });
  // Teclado: flechas + Enter.
  await page.getByRole("radio", { name: /^1 estrella/ }).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "¿Qué podríamos mejorar?" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Elegiste 3 de 5 estrellas" })).toBeVisible();
});
