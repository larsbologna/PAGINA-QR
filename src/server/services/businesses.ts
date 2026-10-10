import "server-only";
import { Prisma, type BusinessStatus, type PlanTier } from "@prisma/client";
import { prisma } from "../db";
import { withSystem, withTenant, type Tx } from "../tenant";
import { audit } from "../audit";
import { AppError } from "../errors";
import { slugify, RESERVED_SLUGS, isValidSlug } from "@/lib/slug";
import { getIndustry } from "@/lib/industries";
import { createInvitation } from "./members";

export interface CreateBusinessInput {
  name: string;
  slug?: string;
  industry: string;
  plan: PlanTier;
  googleReviewUrl?: string | null;
  contactEmail?: string;
  ownerEmail?: string;
  isDemo?: boolean;
}

async function slugTaken(tx: Tx | typeof prisma, slug: string, exceptBusinessId?: string): Promise<boolean> {
  if (RESERVED_SLUGS.has(slug)) return true;
  const [b, h] = await Promise.all([
    tx.business.findUnique({ where: { slug }, select: { id: true } }),
    tx.businessSlugHistory.findUnique({ where: { slug }, select: { businessId: true } }),
  ]);
  if (b && b.id !== exceptBusinessId) return true;
  if (h && h.businessId !== exceptBusinessId) return true;
  return false;
}

export async function generateUniqueSlug(name: string, tx: Tx | typeof prisma = prisma): Promise<string> {
  let base = slugify(name);
  if (base.length < 3) base = `negocio-${base || "nuevo"}`.replace(/-+$/, "");
  base = base.slice(0, 54).replace(/-+$/, "");
  for (let i = 1; i < 1000; i++) {
    const candidate = i === 1 ? base : `${base}-${i}`;
    if (!(await slugTaken(tx, candidate))) return candidate;
  }
  throw new AppError("CONFLICT", "No se pudo generar un identificador único.");
}

export async function createBusiness(input: CreateBusinessInput, actorId: string | null) {
  const result = await withSystem(async (tx) => {
    let slug: string;
    if (input.slug) {
      if (!isValidSlug(input.slug)) throw new AppError("VALIDATION", "Identificador inválido.");
      if (await slugTaken(tx, input.slug)) throw new AppError("CONFLICT", "Ese identificador ya está en uso.");
      slug = input.slug;
    } else {
      slug = await generateUniqueSlug(input.name, tx);
    }
    const industry = getIndustry(input.industry);
    const business = await tx.business.create({
      data: {
        name: input.name.trim(),
        slug,
        industry: industry.id,
        plan: input.plan,
        googleReviewUrl: input.googleReviewUrl || null,
        contactEmail: input.contactEmail || null,
        isDemo: input.isDemo ?? false,
        plans: { create: { plan: input.plan } },
        categories: { create: industry.categories.map((name, i) => ({ name, sortOrder: i })) },
      },
    });
    await audit({ userId: actorId, businessId: business.id, action: "business.created", metadata: { slug, plan: input.plan } }, tx);
    return business;
  });

  let invitationToken: string | null = null;
  if (input.ownerEmail) {
    invitationToken = (await createInvitation(result.id, input.ownerEmail, "OWNER", actorId)).token;
  }
  return { business: result, invitationToken };
}

/** Busca un negocio por slug actual o histórico (para que los QR impresos sigan funcionando). */
export async function findBusinessForPublic(slug: string) {
  const normalized = slug.toLowerCase();
  if (!isValidSlug(normalized)) return null;
  const business = await prisma.business.findUnique({ where: { slug: normalized } });
  if (business) return { business, redirectTo: null as string | null };
  const old = await prisma.businessSlugHistory.findUnique({ where: { slug: normalized }, include: { business: true } });
  if (old) return { business: old.business, redirectTo: old.business.slug };
  return null;
}

export async function getPublicCategories(businessId: string) {
  return withTenant(businessId, (tx) =>
    tx.feedbackCategory.findMany({
      where: { businessId, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true, name: true },
    }),
  );
}

export interface AdminUpdateInput {
  name: string;
  slug: string;
  industry: string;
  contactEmail: string | null;
  internalNotes: string | null;
  googleReviewUrl: string | null;
  retentionMonths: number;
}

export async function updateBusinessAdmin(businessId: string, input: AdminUpdateInput, actorId: string) {
  return withSystem(async (tx) => {
    const current = await tx.business.findUnique({ where: { id: businessId } });
    if (!current) throw new AppError("NOT_FOUND", "Negocio no encontrado.");
    if (input.slug !== current.slug) {
      if (await slugTaken(tx, input.slug, businessId)) throw new AppError("CONFLICT", "Ese identificador ya está en uso.");
      // Si el slug nuevo estaba en el historial de este mismo negocio, se quita de ahí.
      await tx.businessSlugHistory.deleteMany({ where: { slug: input.slug, businessId } });
      await tx.businessSlugHistory.create({ data: { businessId, slug: current.slug } });
      await audit({ userId: actorId, businessId, action: "business.slug_changed", metadata: { from: current.slug, to: input.slug } }, tx);
    }
    const updated = await tx.business.update({
      where: { id: businessId },
      data: {
        name: input.name,
        slug: input.slug,
        industry: getIndustry(input.industry).id,
        contactEmail: input.contactEmail,
        internalNotes: input.internalNotes,
        googleReviewUrl: input.googleReviewUrl,
        retentionMonths: input.retentionMonths,
      },
    });
    await audit({ userId: actorId, businessId, action: "business.updated" }, tx);
    return updated;
  });
}

export async function setBusinessStatus(businessId: string, status: BusinessStatus, actorId: string) {
  return withSystem(async (tx) => {
    const updated = await tx.business.update({
      where: { id: businessId },
      data: { status, suspendedAt: status === "SUSPENDED" ? new Date() : null },
    });
    await audit({ userId: actorId, businessId, action: "business.status_changed", metadata: { status } }, tx);
    return updated;
  });
}

export async function setBusinessPlan(businessId: string, plan: PlanTier, endsAt: Date | null, actorId: string) {
  return withSystem(async (tx) => {
    await tx.businessPlan.updateMany({
      where: { businessId, status: "ACTIVE" },
      data: { status: "ENDED", endsAt: new Date() },
    });
    await tx.businessPlan.create({ data: { businessId, plan, endsAt } });
    const updated = await tx.business.update({ where: { id: businessId }, data: { plan } });
    await audit({ userId: actorId, businessId, action: "business.plan_changed", metadata: { plan } }, tx);
    return updated;
  });
}

export interface BrandingInput {
  name: string;
  brandColor: string;
  welcomeMessage: string;
  thankYouMessage: string;
  googleReviewUrl: string | null;
}

export async function updateBranding(businessId: string, input: BrandingInput, actorId: string) {
  const updated = await prisma.business.update({ where: { id: businessId }, data: input });
  await audit({ userId: actorId, businessId, action: "business.branding_updated" });
  return updated;
}

export async function updateThresholds(businessId: string, positiveMin: number, negativeMax: number, actorId: string) {
  await prisma.business.update({ where: { id: businessId }, data: { positiveMin, negativeMax } });
  await audit({ userId: actorId, businessId, action: "business.updated", metadata: { positiveMin, negativeMax } });
}

// ── Logos ────────────────────────────────────────────────────────────────
export const LOGO_MAX_BYTES = 512 * 1024;

/** Detecta el tipo real por "magic bytes" (no confía en la extensión). SVG no se acepta. */
export function detectImageType(buf: Uint8Array): "image/png" | "image/jpeg" | "image/webp" | null {
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return "image/png";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (
    buf.length >= 12 &&
    String.fromCharCode(buf[0]!, buf[1]!, buf[2]!, buf[3]!) === "RIFF" &&
    String.fromCharCode(buf[8]!, buf[9]!, buf[10]!, buf[11]!) === "WEBP"
  )
    return "image/webp";
  return null;
}

export async function setBusinessLogo(businessId: string, data: Uint8Array, actorId: string) {
  if (data.length === 0) throw new AppError("VALIDATION", "El archivo está vacío.");
  if (data.length > LOGO_MAX_BYTES) throw new AppError("VALIDATION", "El logo no puede superar 512 KB.");
  const mime = detectImageType(data);
  if (!mime) throw new AppError("VALIDATION", "Formato no admitido. Usá PNG, JPG o WEBP.");
  await prisma.business.update({
    where: { id: businessId },
    data: { logoData: Buffer.from(data), logoMimeType: mime, logoUpdatedAt: new Date() },
  });
  await audit({ userId: actorId, businessId, action: "business.logo_updated" });
}

export async function removeBusinessLogo(businessId: string, actorId: string) {
  await prisma.business.update({ where: { id: businessId }, data: { logoData: null, logoMimeType: null, logoUpdatedAt: new Date() } });
  await audit({ userId: actorId, businessId, action: "business.logo_updated", metadata: { removed: true } });
}

export function logoUrl(b: { id: string; logoUpdatedAt: Date | null; logoMimeType: string | null }): string | null {
  if (!b.logoMimeType) return null;
  return `/api/logo/${b.id}?v=${b.logoUpdatedAt?.getTime() ?? 0}`;
}

// ── Panel maestro ────────────────────────────────────────────────────────
export interface AdminListFilters {
  q?: string;
  status?: BusinessStatus;
  plan?: PlanTier;
}

export async function listBusinessesForAdmin(filters: AdminListFilters) {
  const where: Prisma.BusinessWhereInput = {
    ...(filters.q ? { name: { contains: filters.q, mode: "insensitive" } } : {}),
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.plan ? { plan: filters.plan } : {}),
  };
  return withSystem(async (tx) => {
    const businesses = await tx.business.findMany({
      where,
      orderBy: { createdAt: "desc" },
      select: {
        id: true, name: true, slug: true, status: true, plan: true, isDemo: true, createdAt: true, googleReviewUrl: true,
        _count: { select: { members: true } },
      },
    });
    const ids = businesses.map((b) => b.id);
    const since30 = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [totals, recent] = await Promise.all([
      tx.feedback.groupBy({ by: ["businessId"], where: { businessId: { in: ids } }, _count: { _all: true }, _max: { createdAt: true } }),
      tx.feedback.groupBy({ by: ["businessId"], where: { businessId: { in: ids }, createdAt: { gte: since30 } }, _count: { _all: true } }),
    ]);
    const totalMap = new Map(totals.map((t) => [t.businessId, t]));
    const recentMap = new Map(recent.map((r) => [r.businessId, r._count._all]));
    return businesses.map((b) => ({
      ...b,
      feedbackTotal: totalMap.get(b.id)?._count._all ?? 0,
      feedbackLast30: recentMap.get(b.id) ?? 0,
      lastFeedbackAt: totalMap.get(b.id)?._max.createdAt ?? null,
    }));
  });
}

export async function getBusinessForAdmin(businessId: string) {
  return prisma.business.findUnique({
    where: { id: businessId },
    include: {
      plans: { orderBy: { createdAt: "desc" }, take: 10 },
      slugHistory: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function deleteBusiness(businessId: string, actorId: string) {
  await withSystem(async (tx) => {
    const b = await tx.business.findUnique({ where: { id: businessId }, select: { slug: true, name: true } });
    if (!b) throw new AppError("NOT_FOUND", "Negocio no encontrado.");
    await audit({ userId: actorId, businessId, action: "business.deleted", metadata: { slug: b.slug } }, tx);
    await tx.business.delete({ where: { id: businessId } });
  });
}

export async function applyRetention(businessId?: string, now = new Date()): Promise<{ businessId: string; deleted: number }[]> {
  return withSystem(async (tx) => {
    const businesses = await tx.business.findMany({
      where: businessId ? { id: businessId } : {},
      select: { id: true, retentionMonths: true },
    });
    const out: { businessId: string; deleted: number }[] = [];
    for (const b of businesses) {
      const cutoff = new Date(now);
      cutoff.setMonth(cutoff.getMonth() - b.retentionMonths);
      const { count } = await tx.feedback.deleteMany({ where: { businessId: b.id, createdAt: { lt: cutoff } } });
      if (count > 0) await audit({ businessId: b.id, action: "business.retention_applied", metadata: { deleted: count } }, tx);
      out.push({ businessId: b.id, deleted: count });
    }
    return out;
  });
}
