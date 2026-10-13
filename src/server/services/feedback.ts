import "server-only";
import { Prisma } from "@prisma/client";
import { prisma } from "../db";
import { withTenant } from "../tenant";
import { audit } from "../audit";
import { AppError } from "../errors";
import { log } from "../logger";
import { config } from "../config";
import { consumeRateLimit } from "../rate-limit";
import { feedbackSubmissionSchema, firstError, type FeedbackSubmissionInput } from "@/lib/validation";
import type { FeedbackFilters } from "@/lib/feedback-filters";

export const PAGE_SIZE = 20;

export type SubmitResult = { ok: true; duplicate: boolean };

/**
 * Guarda una opinión pública. Reglas:
 * - La puntuación (1..5) se valida aquí y con CHECK en la base.
 * - Las categorías deben pertenecer al negocio y estar activas.
 * - submissionKey evita duplicados por doble clic o reintentos.
 * - Campo trampa (website) completo ⇒ se responde OK sin guardar.
 * - Límite de envíos por IP (hash) y negocio.
 */
export async function submitFeedback(raw: FeedbackSubmissionInput, ipIdentifier: string): Promise<SubmitResult> {
  const parsed = feedbackSubmissionSchema.safeParse(raw);
  if (!parsed.success) throw new AppError("VALIDATION", firstError(parsed.error));
  const input = parsed.data;

  const business = await prisma.business.findUnique({
    where: { slug: input.slug.toLowerCase() },
    select: { id: true, status: true },
  });
  if (!business) throw new AppError("NOT_FOUND", "Negocio no encontrado.");
  if (business.status !== "ACTIVE") throw new AppError("UNAVAILABLE", "Este negocio no está recibiendo opiniones en este momento.");

  if (input.website) {
    log("warn", "feedback.honeypot", { businessId: business.id });
    return { ok: true, duplicate: false };
  }

  const allowed = await consumeRateLimit(`feedback:${business.id}`, ipIdentifier, config.feedbackPerHour, 3600 * 1000);
  if (!allowed) {
    log("warn", "feedback.rate_limited", { businessId: business.id });
    throw new AppError("RATE_LIMITED", "Recibimos demasiados envíos desde esta conexión. Probá de nuevo más tarde.");
  }

  const categoryIds = [...new Set(input.categoryIds)];
  try {
    return await withTenant(business.id, async (tx) => {
      const existing = await tx.feedback.findUnique({
        where: { businessId_submissionKey: { businessId: business.id, submissionKey: input.submissionKey } },
        select: { id: true },
      });
      if (existing) return { ok: true as const, duplicate: true };

      if (categoryIds.length) {
        const valid = await tx.feedbackCategory.count({
          where: { businessId: business.id, status: "ACTIVE", id: { in: categoryIds } },
        });
        if (valid !== categoryIds.length) throw new AppError("VALIDATION", "Alguna de las categorías seleccionadas no es válida.");
      }

      const fb = await tx.feedback.create({
        data: {
          businessId: business.id,
          rating: input.rating,
          comment: input.comment ? input.comment : null,
          submissionKey: input.submissionKey,
        },
        select: { id: true },
      });
      if (categoryIds.length) {
        await tx.feedbackCategorySelection.createMany({
          data: categoryIds.map((categoryId) => ({ feedbackId: fb.id, categoryId, businessId: business.id })),
        });
      }
      log("info", "feedback.created", { businessId: business.id, rating: input.rating, categories: categoryIds.length });
      return { ok: true as const, duplicate: false };
    });
  } catch (e) {
    // Dos envíos simultáneos con la misma clave: el segundo choca con la restricción única.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") return { ok: true, duplicate: true };
    throw e;
  }
}

function buildWhere(businessId: string, f: FeedbackFilters, now = new Date()): Prisma.FeedbackWhereInput {
  return {
    businessId,
    ...(f.ratings.length ? { rating: { in: f.ratings } } : {}),
    ...(f.status ? { status: f.status } : {}),
    ...(f.categoryId ? { selections: { some: { categoryId: f.categoryId } } } : {}),
    ...(f.days ? { createdAt: { gte: new Date(now.getTime() - f.days * 24 * 3600 * 1000) } } : {}),
    // Se escapan % y _ para que la búsqueda sea literal.
    ...(f.q ? { comment: { contains: f.q.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" } } : {}),
  };
}

function buildOrder(sort: FeedbackFilters["sort"]): Prisma.FeedbackOrderByWithRelationInput[] {
  switch (sort) {
    case "antiguas":
      return [{ createdAt: "asc" }, { id: "asc" }];
    case "mayor":
      return [{ rating: "desc" }, { createdAt: "desc" }, { id: "desc" }];
    case "menor":
      return [{ rating: "asc" }, { createdAt: "desc" }, { id: "desc" }];
    default:
      return [{ createdAt: "desc" }, { id: "desc" }];
  }
}

export async function listFeedback(businessId: string, f: FeedbackFilters, pageSize = PAGE_SIZE) {
  return withTenant(businessId, async (tx) => {
    const where = buildWhere(businessId, f);
    const total = await tx.feedback.count({ where });
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(f.page, pages);
    const items = await tx.feedback.findMany({
      where,
      orderBy: buildOrder(f.sort),
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true, rating: true, comment: true, status: true, createdAt: true,
        selections: { select: { category: { select: { id: true, name: true } } } },
        _count: { select: { notes: true } },
      },
    });
    return {
      total,
      page,
      pages,
      items: items.map((i) => ({
        id: i.id,
        rating: i.rating,
        comment: i.comment,
        status: i.status,
        createdAt: i.createdAt,
        categories: i.selections.map((s) => s.category),
        notesCount: i._count.notes,
      })),
    };
  });
}

export async function getFeedbackDetail(businessId: string, feedbackId: string) {
  return withTenant(businessId, (tx) =>
    tx.feedback.findFirst({
      where: { id: feedbackId, businessId },
      select: {
        id: true, rating: true, comment: true, status: true, createdAt: true, reviewedAt: true,
        reviewedBy: { select: { name: true, email: true } },
        selections: { select: { category: { select: { id: true, name: true } } } },
        notes: {
          orderBy: { createdAt: "asc" },
          select: { id: true, body: true, createdAt: true, author: { select: { name: true, email: true } } },
        },
      },
    }),
  );
}

export async function setFeedbackReviewed(businessId: string, feedbackId: string, reviewed: boolean, userId: string) {
  await withTenant(businessId, async (tx) => {
    // Solo cambia el estado: la puntuación y el comentario del cliente nunca se modifican.
    const { count } = await tx.feedback.updateMany({
      where: { id: feedbackId, businessId },
      data: reviewed
        ? { status: "REVIEWED", reviewedAt: new Date(), reviewedById: userId }
        : { status: "NEW", reviewedAt: null, reviewedById: null },
    });
    if (count === 0) throw new AppError("NOT_FOUND", "Opinión no encontrada.");
    await audit({ userId, businessId, action: reviewed ? "feedback.reviewed" : "feedback.unreviewed", metadata: { feedbackId } }, tx);
  });
}

export async function markAllReviewed(businessId: string, userId: string) {
  return withTenant(businessId, async (tx) => {
    const { count } = await tx.feedback.updateMany({
      where: { businessId, status: "NEW" },
      data: { status: "REVIEWED", reviewedAt: new Date(), reviewedById: userId },
    });
    await audit({ userId, businessId, action: "feedback.reviewed", metadata: { bulk: count } }, tx);
    return count;
  });
}

export async function addFeedbackNote(businessId: string, feedbackId: string, userId: string, body: string) {
  await withTenant(businessId, async (tx) => {
    const fb = await tx.feedback.findFirst({ where: { id: feedbackId, businessId }, select: { id: true } });
    if (!fb) throw new AppError("NOT_FOUND", "Opinión no encontrada.");
    await tx.feedbackNote.create({ data: { feedbackId, businessId, authorId: userId, body } });
    await audit({ userId, businessId, action: "feedback.note_added", metadata: { feedbackId } }, tx);
  });
}

export async function feedbackForExport(businessId: string, f: FeedbackFilters) {
  return withTenant(businessId, (tx) =>
    tx.feedback.findMany({
      where: buildWhere(businessId, f),
      orderBy: buildOrder(f.sort),
      take: 50000,
      select: {
        id: true, rating: true, comment: true, status: true, createdAt: true,
        selections: { select: { category: { select: { name: true } } } },
      },
    }),
  );
}

/**
 * Registra que alguien tocó "Dejar reseña en Google". No guarda datos de la
 * persona. Con límite por conexión para que no se pueda inflar la métrica.
 */
export async function recordGoogleClick(slugRaw: string, ipIdentifier: string): Promise<boolean> {
  const slug = String(slugRaw ?? "").toLowerCase().slice(0, 80);
  const business = await prisma.business.findUnique({ where: { slug }, select: { id: true, status: true, googleReviewUrl: true } });
  if (!business || business.status !== "ACTIVE" || !business.googleReviewUrl) return false;
  if (!(await consumeRateLimit(`google-click:${business.id}`, ipIdentifier, 5, 3600 * 1000))) return false;
  await withTenant(business.id, (tx) => tx.googleClick.create({ data: { businessId: business.id } }));
  return true;
}

/** Motivos (categorías) más elegidos en opiniones de hasta `maxRating` estrellas. */
export async function topReasons(businessId: string, days: number, maxRating = 4, limit = 6) {
  const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  return withTenant(businessId, async (tx) => {
    const rows = await tx.feedbackCategorySelection.groupBy({
      by: ["categoryId"],
      where: { businessId, feedback: { createdAt: { gte: since }, rating: { lte: maxRating } } },
      _count: { _all: true },
    });
    const top = rows.sort((a, b) => b._count._all - a._count._all).slice(0, limit);
    const cats = await tx.feedbackCategory.findMany({ where: { businessId, id: { in: top.map((t) => t.categoryId) } }, select: { id: true, name: true } });
    const names = new Map(cats.map((c) => [c.id, c.name]));
    return top.map((t) => ({ id: t.categoryId, name: names.get(t.categoryId) ?? "—", count: t._count._all }));
  });
}

/** Opiniones de 1 a 4 estrellas todavía sin resolver (insignia del menú "Para mejorar"). */
export async function countPendingToImprove(businessId: string) {
  return withTenant(businessId, (tx) => tx.feedback.count({ where: { businessId, status: "NEW", rating: { lte: 4 } } }));
}
