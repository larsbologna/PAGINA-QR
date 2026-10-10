import "server-only";
import type { User } from "@prisma/client";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";
import { config } from "../config";

export type SessionUser = Pick<User, "id" | "email" | "name" | "role">;

export async function createSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + config.sessionDays * 24 * 3600 * 1000);
  await prisma.session.create({ data: { tokenHash: sha256(token), userId, expiresAt } });
  return { token, expiresAt };
}

export async function validateSessionToken(token: string | undefined | null): Promise<SessionUser | null> {
  if (!token || token.length > 200) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(token) },
    include: { user: { select: { id: true, email: true, name: true, role: true, isActive: true } } },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() <= Date.now() || !session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => undefined);
    return null;
  }
  // Actualiza "último uso" como máximo una vez por hora.
  if (Date.now() - session.lastUsedAt.getTime() > 3600 * 1000) {
    await prisma.session.update({ where: { id: session.id }, data: { lastUsedAt: new Date() } }).catch(() => undefined);
  }
  const { id, email, name, role } = session.user;
  return { id, email, name, role };
}

export async function deleteSessionToken(token: string): Promise<void> {
  await prisma.session.deleteMany({ where: { tokenHash: sha256(token) } });
}

export async function deleteUserSessions(userId: string, exceptToken?: string): Promise<void> {
  await prisma.session.deleteMany({
    where: { userId, ...(exceptToken ? { NOT: { tokenHash: sha256(exceptToken) } } : {}) },
  });
}
