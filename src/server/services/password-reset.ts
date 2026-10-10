import "server-only";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";
import { audit } from "../audit";
import { AppError } from "../errors";
import { hashPassword } from "../auth/password";

const RESET_HOURS = 24;

/** El superadministrador genera un enlace de un solo uso para que un usuario elija una contraseña nueva. */
export async function createPasswordReset(userId: string, actorId: string, businessId?: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new AppError("NOT_FOUND", "Usuario no encontrado.");
  await prisma.passwordReset.updateMany({ where: { userId, usedAt: null }, data: { usedAt: new Date() } });
  const token = randomToken(32);
  await prisma.passwordReset.create({
    data: { userId, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_HOURS * 3600 * 1000) },
  });
  await audit({ userId: actorId, businessId: businessId ?? null, action: "auth.password_reset_created" });
  return token;
}

export async function findValidReset(token: string) {
  if (!token || token.length > 100) return null;
  const r = await prisma.passwordReset.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { email: true, isActive: true } } },
  });
  if (!r || r.usedAt || r.expiresAt.getTime() < Date.now() || !r.user.isActive) return null;
  return r;
}

/** Aplica la contraseña nueva, invalida el enlace y cierra todas las sesiones abiertas. */
export async function consumePasswordReset(token: string, newPassword: string) {
  const r = await findValidReset(token);
  if (!r) throw new AppError("NOT_FOUND", "El enlace no es válido o venció.");
  const passwordHash = await hashPassword(newPassword);
  return prisma.$transaction(async (tx) => {
    const { count } = await tx.passwordReset.updateMany({ where: { id: r.id, usedAt: null }, data: { usedAt: new Date() } });
    if (count === 0) throw new AppError("CONFLICT", "El enlace ya fue utilizado.");
    await tx.user.update({ where: { id: r.userId }, data: { passwordHash } });
    await tx.session.deleteMany({ where: { userId: r.userId } });
    await tx.auditLog.create({ data: { userId: r.userId, action: "auth.password_changed", metadata: { via: "reset" } } });
    return r.userId;
  });
}
