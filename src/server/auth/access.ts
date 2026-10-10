import "server-only";
import type { Business, MemberRole } from "@prisma/client";
import { prisma } from "../db";
import type { SessionUser } from "./sessions";

export type EffectiveRole = "SUPERADMIN" | MemberRole;

export interface BusinessAccess {
  business: Business;
  role: EffectiveRole;
  canManage: boolean; // configuración, categorías, equipo
}

/**
 * Resuelve si `user` puede acceder al negocio `slug`. Devuelve null si no existe
 * o si no tiene permiso (no se distingue, para no revelar qué negocios existen).
 * Un negocio suspendido solo es accesible para el superadministrador.
 */
export async function resolveBusinessAccess(user: SessionUser, slug: string): Promise<BusinessAccess | null> {
  const business = await prisma.business.findUnique({ where: { slug } });
  if (!business) return null;
  if (user.role === "SUPERADMIN") return { business, role: "SUPERADMIN", canManage: true };
  if (business.status !== "ACTIVE") return null;
  const membership = await prisma.businessMember.findUnique({
    where: { userId_businessId: { userId: user.id, businessId: business.id } },
  });
  if (!membership) return null;
  return { business, role: membership.role, canManage: membership.role === "OWNER" };
}

export async function listUserBusinesses(user: SessionUser) {
  if (user.role === "SUPERADMIN") {
    return prisma.business.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true, status: true, isDemo: true } });
  }
  const memberships = await prisma.businessMember.findMany({
    where: { userId: user.id },
    include: { business: { select: { id: true, name: true, slug: true, status: true, isDemo: true } } },
    orderBy: { business: { name: "asc" } },
  });
  return memberships.map((m) => m.business);
}
