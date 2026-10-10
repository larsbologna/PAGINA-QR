import "server-only";
import type { MemberRole } from "@prisma/client";
import { prisma } from "../db";
import { randomToken, sha256 } from "../crypto";
import { audit } from "../audit";
import { AppError } from "../errors";
import { hashPassword, verifyPassword } from "../auth/password";

const INVITATION_DAYS = 7;

export async function createInvitation(businessId: string, emailRaw: string, role: MemberRole, actorId: string | null) {
  const email = emailRaw.trim().toLowerCase();
  const existingMember = await prisma.businessMember.findFirst({ where: { businessId, user: { email } } });
  if (existingMember) throw new AppError("CONFLICT", "Esa persona ya tiene acceso a este negocio.");
  // Una sola invitación pendiente por email y negocio.
  await prisma.invitation.updateMany({
    where: { businessId, email, acceptedAt: null, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  const token = randomToken(32);
  const invitation = await prisma.invitation.create({
    data: {
      businessId,
      email,
      role,
      tokenHash: sha256(token),
      expiresAt: new Date(Date.now() + INVITATION_DAYS * 24 * 3600 * 1000),
      createdById: actorId,
    },
  });
  await audit({ userId: actorId, businessId, action: "member.invited", metadata: { role } });
  return { invitation, token };
}

export async function findValidInvitation(token: string) {
  if (!token || token.length > 100) return null;
  const inv = await prisma.invitation.findUnique({
    where: { tokenHash: sha256(token) },
    include: { business: { select: { id: true, name: true, status: true } } },
  });
  if (!inv || inv.acceptedAt || inv.revokedAt || inv.expiresAt.getTime() < Date.now()) return null;
  if (inv.business.status !== "ACTIVE") return null;
  const userExists = !!(await prisma.user.findUnique({ where: { email: inv.email }, select: { id: true } }));
  return { ...inv, userExists };
}

/**
 * Acepta una invitación. Si el email no tiene cuenta, la crea con la contraseña
 * indicada. Si ya existe, exige su contraseña actual para vincular el negocio.
 */
export async function acceptInvitation(token: string, input: { password: string; name?: string }) {
  const inv = await findValidInvitation(token);
  if (!inv) throw new AppError("NOT_FOUND", "La invitación no es válida o venció.");
  return prisma.$transaction(async (tx) => {
    let user = await tx.user.findUnique({ where: { email: inv.email } });
    if (user) {
      if (!(await verifyPassword(input.password, user.passwordHash))) {
        throw new AppError("VALIDATION", "La contraseña no coincide con tu cuenta existente.");
      }
    } else {
      user = await tx.user.create({
        data: { email: inv.email, name: input.name?.trim() || null, passwordHash: await hashPassword(input.password) },
      });
    }
    // Marcado atómico: si dos pestañas aceptan a la vez, solo una gana.
    const { count } = await tx.invitation.updateMany({
      where: { id: inv.id, acceptedAt: null },
      data: { acceptedAt: new Date() },
    });
    if (count === 0) throw new AppError("CONFLICT", "La invitación ya fue utilizada.");
    await tx.businessMember.upsert({
      where: { userId_businessId: { userId: user.id, businessId: inv.businessId } },
      create: { userId: user.id, businessId: inv.businessId, role: inv.role },
      update: {},
    });
    await tx.auditLog.create({ data: { userId: user.id, businessId: inv.businessId, action: "member.joined", metadata: { role: inv.role } } });
    return user;
  });
}

export async function listMembers(businessId: string) {
  const [members, invitations] = await Promise.all([
    prisma.businessMember.findMany({
      where: { businessId },
      include: { user: { select: { id: true, email: true, name: true, lastLoginAt: true } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.invitation.findMany({
      where: { businessId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } },
      select: { id: true, email: true, role: true, expiresAt: true, createdAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return { members, invitations };
}

export async function revokeInvitation(businessId: string, invitationId: string, actorId: string) {
  const { count } = await prisma.invitation.updateMany({
    where: { id: invitationId, businessId, acceptedAt: null },
    data: { revokedAt: new Date() },
  });
  if (count === 0) throw new AppError("NOT_FOUND", "Invitación no encontrada.");
  await audit({ userId: actorId, businessId, action: "member.invitation_revoked" });
}

export async function removeMember(businessId: string, memberId: string, actorId: string) {
  const member = await prisma.businessMember.findFirst({ where: { id: memberId, businessId } });
  if (!member) throw new AppError("NOT_FOUND", "Miembro no encontrado.");
  if (member.role === "OWNER") {
    const owners = await prisma.businessMember.count({ where: { businessId, role: "OWNER" } });
    if (owners <= 1) throw new AppError("VALIDATION", "No se puede quitar al único administrador del negocio.");
  }
  await prisma.businessMember.delete({ where: { id: member.id } });
  await audit({ userId: actorId, businessId, action: "member.removed" });
}
