import { expect, type Browser, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import jsQR from "jsqr";

export { SUPERADMIN } from "./global-setup";

/** Registra errores de consola y de página para verificar que no haya errores críticos. */
export function trackConsole(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${page.url()} :: ${m.text()}`);
  });
  page.on("pageerror", (e) => errors.push(`${page.url()} :: ${e.message}`));
  return errors;
}

export async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Ingresar" }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

export interface CreatedBusiness {
  publicUrl: string;
  slug: string;
  inviteLink: string | null;
}

export async function createBusinessViaUi(
  page: Page,
  input: { name: string; ownerEmail?: string; googleUrl?: string; industry?: string },
): Promise<CreatedBusiness> {
  await page.goto("/admin/negocios/nuevo");
  await page.getByLabel("Nombre del negocio").fill(input.name);
  if (input.industry) await page.getByLabel("Rubro").selectOption(input.industry);
  if (input.googleUrl) await page.getByLabel("Enlace de Google (opcional)").fill(input.googleUrl);
  if (input.ownerEmail) await page.getByLabel("Email del dueño (opcional)").fill(input.ownerEmail);
  await page.getByRole("button", { name: "Crear negocio" }).click();
  await expect(page.getByText(`Negocio “${input.name}” creado.`)).toBeVisible();
  const publicUrl = await page.getByLabel("Enlace público (QR)").inputValue();
  const invite = page.getByLabel(/Invitación para el dueño/);
  const inviteLink = input.ownerEmail ? await invite.inputValue() : null;
  return { publicUrl, slug: publicUrl.split("/r/")[1]!, inviteLink };
}

export async function acceptInvitation(browser: Browser, link: string, password: string) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(link);
  await page.getByLabel("Elegí una contraseña").fill(password);
  await page.getByLabel("Repetí la contraseña").fill(password);
  await page.getByRole("button", { name: "Crear cuenta y entrar" }).click();
  await expect(page).toHaveURL(/\/panel\//);
  return { ctx, page };
}

export function decodeQr(png: Buffer): string | null {
  const img = PNG.sync.read(png);
  return jsQR(new Uint8ClampedArray(img.data), img.width, img.height)?.data ?? null;
}

/**
 * Completa el formulario público. Con 5 estrellas y enlace de Google, la página
 * ofrece ir a Google; para comentar en privado se usa "Prefiero dejar un comentario privado".
 */
export async function submitPublicFeedback(page: Page, opts: { rating: number; comment?: string; categories?: string[] }) {
  await page.getByRole("radio", { name: new RegExp(`^${opts.rating} estrellas?:`) }).check({ force: true });
  if (opts.rating === 5) {
    const privateLink = page.getByRole("button", { name: "Prefiero dejar un comentario privado" });
    const form = page.getByRole("heading", { name: /Contanos qué/ });
    await expect(privateLink.or(form)).toBeVisible();
    if (await privateLink.isVisible()) await privateLink.click();
  }
  if (opts.comment) await page.getByLabel("¿Qué te pareció tu experiencia?").fill(opts.comment);
  for (const c of opts.categories ?? []) await page.getByText(c, { exact: true }).click();
  await page.getByRole("button", { name: "Enviar opinión" }).click();
  await expect(page.getByRole("heading", { name: "¡Recibimos tu opinión!" })).toBeVisible();
}
