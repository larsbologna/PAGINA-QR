"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperadmin } from "@/server/auth/current";
import {
  applyRetention, createBusiness, deleteBusiness, getBusinessForAdmin, setBusinessPlan, setBusinessStatus, updateBusinessAdmin,
} from "@/server/services/businesses";
import { createInvitation, removeMember, revokeInvitation } from "@/server/services/members";
import { createPasswordReset } from "@/server/services/password-reset";
import { prisma } from "@/server/db";
import { AppError } from "@/server/errors";
import { config } from "@/server/config";
import { createBusinessSchema, emailSchema, fieldErrors, googleUrlSchema, slugSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function str(form: FormData, k: string) {
  const v = form.get(k);
  return typeof v === "string" ? v : "";
}

async function run(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
}

export async function createBusinessAction(_prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireSuperadmin();
  const parsed = createBusinessSchema.safeParse({
    name: str(form, "name"),
    slug: str(form, "slug"),
    industry: str(form, "industry"),
    plan: str(form, "plan"),
    googleReviewUrl: str(form, "googleReviewUrl"),
    contactEmail: str(form, "contactEmail"),
    ownerEmail: str(form, "ownerEmail"),
  });
  if (!parsed.success) return { error: "Revisá los campos marcados.", fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  return run(async () => {
    const { business, invitationToken } = await createBusiness(
      {
        name: d.name,
        slug: d.slug || undefined,
        industry: d.industry,
        plan: d.plan,
        googleReviewUrl: d.googleReviewUrl ?? null,
        contactEmail: d.contactEmail || undefined,
        ownerEmail: d.ownerEmail || undefined,
      },
      admin.id,
    );
    revalidatePath("/admin");
    return {
      ok: true,
      message: `Negocio “${business.name}” creado.`,
      data: {
        id: business.id,
        slug: business.slug,
        publicUrl: `${config.appUrl}/r/${business.slug}`,
        ...(invitationToken ? { link: `${config.appUrl}/invitacion/${invitationToken}` } : {}),
      },
    };
  });
}

const adminUpdateSchema = z.object({
  name: z.string().trim().min(2, "El nombre es demasiado corto.").max(80),
  slug: slugSchema,
  industry: z.string().trim().max(40),
  contactEmail: z.union([z.literal(""), emailSchema]),
  internalNotes: z.string().trim().max(2000),
  googleReviewUrl: googleUrlSchema,
  retentionMonths: z.coerce.number().int().min(1, "Mínimo 1 mes.").max(120, "Máximo 120 meses."),
});

export async function updateBusinessAdminAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireSuperadmin();
  const parsed = adminUpdateSchema.safeParse(Object.fromEntries(["name", "slug", "industry", "contactEmail", "internalNotes", "googleReviewUrl", "retentionMonths"].map((k) => [k, str(form, k)])));
  if (!parsed.success) return { error: "Revisá los campos marcados.", fields: fieldErrors(parsed.error) };
  const d = parsed.data;
  return run(async () => {
    await updateBusinessAdmin(
      businessId,
      { ...d, contactEmail: d.contactEmail || null, internalNotes: d.internalNotes || null, googleReviewUrl: d.googleReviewUrl },
      admin.id,
    );
    revalidatePath(`/admin/negocios/${businessId}`);
    revalidatePath("/admin");
    return { ok: true, message: "Datos guardados." };
  });
}

export async function setStatusAction(businessId: string, status: "ACTIVE" | "SUSPENDED") {
  const admin = await requireSuperadmin();
  await setBusinessStatus(businessId, status, admin.id);
  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/admin");
}

export async function setPlanAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireSuperadmin();
  const plan = z.enum(["BASICO", "PROFESIONAL", "PREMIUM"]).safeParse(str(form, "plan"));
  if (!plan.success) return { error: "Plan inválido." };
  const endsRaw = str(form, "endsAt");
  let endsAt: Date | null = null;
  if (endsRaw) {
    endsAt = new Date(`${endsRaw}T23:59:59-03:00`);
    if (Number.isNaN(endsAt.getTime())) return { error: "Fecha de vencimiento inválida." };
  }
  await setBusinessPlan(businessId, plan.data, endsAt, admin.id);
  revalidatePath(`/admin/negocios/${businessId}`);
  revalidatePath("/admin");
  return { ok: true, message: "Plan actualizado." };
}

export async function adminInviteAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireSuperadmin();
  const email = emailSchema.safeParse(str(form, "email"));
  if (!email.success) return { fields: { email: email.error.issues[0]!.message } };
  const role = str(form, "role") === "OWNER" ? "OWNER" : "MEMBER";
  return run(async () => {
    const { token } = await createInvitation(businessId, email.data, role, admin.id);
    revalidatePath(`/admin/negocios/${businessId}`);
    return { ok: true, message: "Invitación creada (vence en 7 días).", data: { link: `${config.appUrl}/invitacion/${token}` } };
  });
}

export async function adminRemoveMemberAction(businessId: string, memberId: string): Promise<ActionState> {
  const admin = await requireSuperadmin();
  return run(async () => {
    await removeMember(businessId, memberId, admin.id);
    revalidatePath(`/admin/negocios/${businessId}`);
  });
}

export async function adminRevokeInvitationAction(businessId: string, invitationId: string): Promise<ActionState> {
  const admin = await requireSuperadmin();
  return run(async () => {
    await revokeInvitation(businessId, invitationId, admin.id);
    revalidatePath(`/admin/negocios/${businessId}`);
  });
}

export async function applyRetentionAction(businessId: string): Promise<ActionState> {
  await requireSuperadmin();
  const [r] = await applyRetention(businessId);
  revalidatePath(`/admin/negocios/${businessId}`);
  return { ok: true, message: `Se eliminaron ${r?.deleted ?? 0} opiniones más antiguas que el plazo de conservación.` };
}

export async function deleteBusinessAction(businessId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const admin = await requireSuperadmin();
  const b = await getBusinessForAdmin(businessId);
  if (!b) return { error: "Negocio no encontrado." };
  if (str(form, "confirm").trim() !== b.slug) return { error: `Para confirmar, escribí exactamente: ${b.slug}` };
  await deleteBusiness(businessId, admin.id);
  revalidatePath("/admin");
  redirect("/admin?eliminado=1");
}

export async function adminPasswordResetAction(businessId: string, memberId: string): Promise<ActionState> {
  const admin = await requireSuperadmin();
  const member = await prisma.businessMember.findFirst({ where: { id: memberId, businessId }, select: { userId: true } });
  if (!member) return { error: "Miembro no encontrado." };
  const token = await createPasswordReset(member.userId, admin.id, businessId);
  return { ok: true, message: "Enlace generado (vence en 24 h, un solo uso).", data: { link: `${config.appUrl}/restablecer/${token}` } };
}
