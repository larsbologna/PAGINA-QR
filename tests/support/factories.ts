import { randomUUID } from "node:crypto";
import { createBusiness } from "@/server/services/businesses";
import { createUser } from "@/server/auth/credentials";
import { withSystem } from "@/server/tenant";
import { prisma } from "@/server/db";

export async function makeSuperadmin(email = "super@test.com") {
  return createUser({ email, password: "superadmin-clave-123", role: "SUPERADMIN" });
}

export async function makeBusiness(name: string, opts: { industry?: string } = {}) {
  const { business } = await createBusiness({ name, industry: opts.industry ?? "restaurante", plan: "BASICO" }, null);
  return business;
}

export async function makeMember(businessId: string, email: string, role: "OWNER" | "MEMBER" = "OWNER") {
  const user = await createUser({ email, password: "clave-de-prueba-123" });
  await prisma.businessMember.create({ data: { userId: user.id, businessId, role } });
  return user;
}

export async function categoriesOf(businessId: string) {
  return withSystem((tx) => tx.feedbackCategory.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } }));
}

/** Inserta opiniones con fecha controlada (solo para pruebas). */
export async function insertFeedback(
  businessId: string,
  rows: { rating: number; daysAgo: number; comment?: string; categoryIds?: string[]; status?: "NEW" | "REVIEWED" }[],
  now = new Date(),
) {
  return withSystem(async (tx) => {
    const ids: string[] = [];
    for (const r of rows) {
      const fb = await tx.feedback.create({
        data: {
          businessId,
          rating: r.rating,
          comment: r.comment ?? null,
          status: r.status ?? "NEW",
          submissionKey: randomUUID(),
          createdAt: new Date(now.getTime() - r.daysAgo * 24 * 3600 * 1000),
        },
      });
      if (r.categoryIds?.length) {
        await tx.feedbackCategorySelection.createMany({
          data: r.categoryIds.map((categoryId) => ({ feedbackId: fb.id, categoryId, businessId })),
        });
      }
      ids.push(fb.id);
    }
    return ids;
  });
}
