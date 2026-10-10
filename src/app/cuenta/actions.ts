"use server";

import { requireUser, readSessionToken } from "@/server/auth/current";
import { changePassword } from "@/server/auth/credentials";
import { deleteUserSessions } from "@/server/auth/sessions";
import { consumeRateLimit } from "@/server/rate-limit";
import { audit } from "@/server/audit";
import { passwordSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

export async function changePasswordAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (!(await consumeRateLimit("password", user.id, 10, 15 * 60 * 1000))) return { error: "Demasiados intentos. Esperá unos minutos." };
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const parsed = passwordSchema.safeParse(next);
  if (!parsed.success) return { fields: { next: parsed.error.issues[0]!.message } };
  if (next !== form.get("confirm")) return { fields: { confirm: "Las contraseñas no coinciden." } };
  if (!(await changePassword(user.id, current, next))) return { fields: { current: "La contraseña actual no es correcta." } };
  // Cierra las demás sesiones abiertas con la contraseña anterior.
  await deleteUserSessions(user.id, await readSessionToken());
  await audit({ userId: user.id, action: "auth.password_changed" });
  return { ok: true, message: "Contraseña actualizada. Se cerraron tus otras sesiones." };
}
