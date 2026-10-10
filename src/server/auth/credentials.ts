import "server-only";
import { prisma } from "../db";
import { hashPassword, verifyDummy, verifyPassword } from "./password";

export async function authenticate(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) {
    await verifyDummy(password); // tiempo de respuesta similar exista o no el usuario
    return null;
  }
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  return user;
}

export async function createUser(input: { email: string; password: string; name?: string | null; role?: "SUPERADMIN" | "USER" }) {
  return prisma.user.create({
    data: {
      email: input.email.trim().toLowerCase(),
      name: input.name?.trim() || null,
      passwordHash: await hashPassword(input.password),
      role: input.role ?? "USER",
    },
  });
}

export async function changePassword(userId: string, current: string, next: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(current, user.passwordHash))) return false;
  await prisma.user.update({ where: { id: userId }, data: { passwordHash: await hashPassword(next) } });
  return true;
}
