import "server-only";
import { authenticate } from "./credentials";
import { createSession, deleteSessionToken } from "./sessions";
import { acceptInvitation } from "../services/members";
import { consumePasswordReset } from "../services/password-reset";
import { consumeRateLimit } from "../rate-limit";
import { config } from "../config";
import { audit } from "../audit";
import { log } from "../logger";
import { AppError } from "../errors";
import { passwordSchema } from "@/lib/validation";

export type FlowResult =
  | { ok: true; token: string; expiresAt: Date; redirectTo: string }
  | { ok: false; error?: string; fields?: Record<string, string> };

export function safeNext(raw: unknown): string | null {
  const v = typeof raw === "string" ? raw : "";
  return v.startsWith("/") && !v.startsWith("//") && !v.startsWith("/\\") ? v : null;
}

export async function loginFlow(input: { email?: unknown; password?: unknown; next?: unknown }, ip: string): Promise<FlowResult> {
  const email = String(input.email ?? "").trim().toLowerCase().slice(0, 160);
  const password = String(input.password ?? "").slice(0, 200);
  if (!email || !password) return { ok: false, error: "Completá email y contraseña." };
  if (!(await consumeRateLimit("login", `${ip}:${email}`, config.loginPer15Min, 15 * 60 * 1000))) {
    return { ok: false, error: "Demasiados intentos. Esperá unos minutos y volvé a probar." };
  }
  const user = await authenticate(email, password);
  if (!user) {
    log("warn", "auth.login_failed");
    return { ok: false, error: "Email o contraseña incorrectos." };
  }
  const { token, expiresAt } = await createSession(user.id);
  await audit({ userId: user.id, action: "auth.login" });
  return { ok: true, token, expiresAt, redirectTo: safeNext(input.next) ?? (user.role === "SUPERADMIN" ? "/admin" : "/panel") };
}

export async function invitationFlow(
  input: { token?: unknown; password?: unknown; confirm?: unknown; name?: unknown; existing?: unknown },
  ip: string,
): Promise<FlowResult> {
  if (!(await consumeRateLimit("invite", ip, 20, 15 * 60 * 1000))) return { ok: false, error: "Demasiados intentos. Esperá unos minutos." };
  const token = String(input.token ?? "").slice(0, 100);
  const password = String(input.password ?? "").slice(0, 200);
  const name = String(input.name ?? "").slice(0, 80);
  if (input.existing !== true) {
    const p = passwordSchema.safeParse(password);
    if (!p.success) return { ok: false, fields: { password: p.error.issues[0]!.message } };
    if (password !== input.confirm) return { ok: false, fields: { confirm: "Las contraseñas no coinciden." } };
  }
  try {
    const user = await acceptInvitation(token, { password, name });
    const { token: sessionToken, expiresAt } = await createSession(user.id);
    return { ok: true, token: sessionToken, expiresAt, redirectTo: "/panel" };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function resetFlow(input: { token?: unknown; password?: unknown; confirm?: unknown }, ip: string): Promise<FlowResult> {
  if (!(await consumeRateLimit("reset", ip, 20, 15 * 60 * 1000))) return { ok: false, error: "Demasiados intentos. Esperá unos minutos." };
  const password = String(input.password ?? "").slice(0, 200);
  const p = passwordSchema.safeParse(password);
  if (!p.success) return { ok: false, fields: { password: p.error.issues[0]!.message } };
  if (password !== input.confirm) return { ok: false, fields: { confirm: "Las contraseñas no coinciden." } };
  try {
    const userId = await consumePasswordReset(String(input.token ?? "").slice(0, 100), password);
    const { token, expiresAt } = await createSession(userId);
    return { ok: true, token, expiresAt, redirectTo: "/panel" };
  } catch (e) {
    if (e instanceof AppError) return { ok: false, error: e.message };
    throw e;
  }
}

export async function logoutFlow(token: string | undefined) {
  if (token) await deleteSessionToken(token);
}
