import "server-only";
import { Prisma } from "@prisma/client";
import { withTenant } from "../tenant";
import { audit } from "../audit";
import { AppError } from "../errors";
import { MAX_CATEGORIES_PER_BUSINESS } from "@/lib/validation";

export async function listCategories(businessId: string) {
  return withTenant(businessId, (tx) =>
    tx.feedbackCategory.findMany({
      where: { businessId },
      orderBy: [{ status: "asc" }, { sortOrder: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { selections: true } } },
    }),
  );
}

function isUniqueViolation(e: unknown) {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";
}

export async function createCategory(businessId: string, name: string, actorId: string) {
  return withTenant(businessId, async (tx) => {
    const active = await tx.feedbackCategory.count({ where: { businessId, status: "ACTIVE" } });
    if (active >= MAX_CATEGORIES_PER_BUSINESS) {
      throw new AppError("VALIDATION", `Podés tener hasta ${MAX_CATEGORIES_PER_BUSINESS} categorías activas.`);
    }
    const max = await tx.feedbackCategory.aggregate({ where: { businessId }, _max: { sortOrder: true } });
    try {
      const c = await tx.feedbackCategory.create({ data: { businessId, name, sortOrder: (max._max.sortOrder ?? 0) + 1 } });
      await audit({ userId: actorId, businessId, action: "category.created" }, tx);
      return c;
    } catch (e) {
      if (isUniqueViolation(e)) throw new AppError("CONFLICT", "Ya existe una categoría con ese nombre.");
      throw e;
    }
  });
}

export async function renameCategory(businessId: string, categoryId: string, name: string, actorId: string) {
  return withTenant(businessId, async (tx) => {
    try {
      const { count } = await tx.feedbackCategory.updateMany({ where: { id: categoryId, businessId }, data: { name } });
      if (count === 0) throw new AppError("NOT_FOUND", "Categoría no encontrada.");
    } catch (e) {
      if (isUniqueViolation(e)) throw new AppError("CONFLICT", "Ya existe una categoría con ese nombre.");
      throw e;
    }
    await audit({ userId: actorId, businessId, action: "category.updated", metadata: { rename: true } }, tx);
  });
}

/** Las categorías no se borran (para conservar el historial): se archivan. */
export async function setCategoryStatus(businessId: string, categoryId: string, status: "ACTIVE" | "ARCHIVED", actorId: string) {
  return withTenant(businessId, async (tx) => {
    if (status === "ACTIVE") {
      const active = await tx.feedbackCategory.count({ where: { businessId, status: "ACTIVE" } });
      if (active >= MAX_CATEGORIES_PER_BUSINESS) {
        throw new AppError("VALIDATION", `Podés tener hasta ${MAX_CATEGORIES_PER_BUSINESS} categorías activas.`);
      }
    }
    const { count } = await tx.feedbackCategory.updateMany({ where: { id: categoryId, businessId }, data: { status } });
    if (count === 0) throw new AppError("NOT_FOUND", "Categoría no encontrada.");
    await audit({ userId: actorId, businessId, action: "category.updated", metadata: { status } }, tx);
  });
}

export async function moveCategory(businessId: string, categoryId: string, direction: "up" | "down") {
  return withTenant(businessId, async (tx) => {
    const list = await tx.feedbackCategory.findMany({
      where: { businessId, status: "ACTIVE" },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      select: { id: true },
    });
    const idx = list.findIndex((c) => c.id === categoryId);
    const swap = direction === "up" ? idx - 1 : idx + 1;
    if (idx < 0 || swap < 0 || swap >= list.length) return;
    [list[idx], list[swap]] = [list[swap]!, list[idx]!];
    for (let i = 0; i < list.length; i++) {
      await tx.feedbackCategory.update({ where: { id: list[i]!.id }, data: { sortOrder: i } });
    }
  });
}
