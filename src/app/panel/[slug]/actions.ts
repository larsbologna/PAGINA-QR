"use server";

import { revalidatePath } from "next/cache";
import { getBusinessAccess, requireManageAccess } from "@/server/auth/current";
import { addFeedbackNote, markAllReviewed, setFeedbackReviewed } from "@/server/services/feedback";
import { removeBusinessLogo, setBusinessLogo, updateBranding, updateThresholds } from "@/server/services/businesses";
import { createCategory, moveCategory, renameCategory, setCategoryStatus } from "@/server/services/categories";
import { createInvitation, removeMember, revokeInvitation } from "@/server/services/members";
import { AppError } from "@/server/errors";
import { config } from "@/server/config";
import { brandingSchema, categoryNameSchema, emailSchema, fieldErrors, noteSchema, thresholdsSchema } from "@/lib/validation";
import type { ActionState } from "@/lib/action-state";

function refresh(slug: string) {
  revalidatePath(`/panel/${slug}`, "layout");
}

async function run(fn: () => Promise<ActionState | void>): Promise<ActionState> {
  try {
    return (await fn()) ?? { ok: true };
  } catch (e) {
    if (e instanceof AppError) return { error: e.message };
    throw e;
  }
}

// ── Opiniones ───────────────────────────────────────────────────────────
export async function setReviewedAction(slug: string, feedbackId: string, reviewed: boolean) {
  const { user, access } = await getBusinessAccess(slug);
  await setFeedbackReviewed(access.business.id, feedbackId, reviewed, user.id);
  refresh(slug);
}

export async function markAllReviewedAction(slug: string) {
  const { user, access } = await getBusinessAccess(slug);
  await markAllReviewed(access.business.id, user.id);
  refresh(slug);
}

export async function addNoteAction(slug: string, feedbackId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await getBusinessAccess(slug);
  const parsed = noteSchema.safeParse(form.get("body"));
  if (!parsed.success) return { fields: { body: parsed.error.issues[0]!.message } };
  return run(async () => {
    await addFeedbackNote(access.business.id, feedbackId, user.id, parsed.data);
    refresh(slug);
    return { ok: true, message: "Nota agregada." };
  });
}

// ── Configuración ───────────────────────────────────────────────────────
export async function updateBrandingAction(slug: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  const parsed = brandingSchema.safeParse({
    name: form.get("name"),
    brandColor: form.get("brandColor"),
    welcomeMessage: form.get("welcomeMessage"),
    thankYouMessage: form.get("thankYouMessage"),
    googleReviewUrl: form.get("googleReviewUrl") ?? "",
  });
  if (!parsed.success) return { error: "Revisá los campos marcados.", fields: fieldErrors(parsed.error) };
  await updateBranding(access.business.id, parsed.data, user.id);
  refresh(slug);
  return { ok: true, message: "Cambios guardados." };
}

export async function uploadLogoAction(slug: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  const file = form.get("logo");
  if (!(file instanceof File) || file.size === 0) return { error: "Elegí una imagen." };
  if (file.size > 512 * 1024) return { error: "El logo no puede superar 512 KB." };
  return run(async () => {
    await setBusinessLogo(access.business.id, new Uint8Array(await file.arrayBuffer()), user.id);
    refresh(slug);
    return { ok: true, message: "Logo actualizado." };
  });
}

export async function removeLogoAction(slug: string) {
  const { user, access } = await requireManageAccess(slug);
  await removeBusinessLogo(access.business.id, user.id);
  refresh(slug);
}

export async function updateThresholdsAction(slug: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  const parsed = thresholdsSchema.safeParse({ positiveMin: form.get("positiveMin"), negativeMax: form.get("negativeMax") });
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  await updateThresholds(access.business.id, parsed.data.positiveMin, parsed.data.negativeMax, user.id);
  refresh(slug);
  return { ok: true, message: "Criterios guardados." };
}

export async function createCategoryAction(slug: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  const parsed = categoryNameSchema.safeParse(form.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  return run(async () => {
    await createCategory(access.business.id, parsed.data, user.id);
    refresh(slug);
    return { ok: true, message: "Categoría agregada." };
  });
}

export async function renameCategoryAction(slug: string, categoryId: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  const parsed = categoryNameSchema.safeParse(form.get("name"));
  if (!parsed.success) return { error: parsed.error.issues[0]!.message };
  return run(async () => {
    await renameCategory(access.business.id, categoryId, parsed.data, user.id);
    refresh(slug);
    return { ok: true };
  });
}

export async function setCategoryStatusAction(slug: string, categoryId: string, status: "ACTIVE" | "ARCHIVED"): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  return run(async () => {
    await setCategoryStatus(access.business.id, categoryId, status, user.id);
    refresh(slug);
  });
}

export async function moveCategoryAction(slug: string, categoryId: string, direction: "up" | "down") {
  const { access } = await requireManageAccess(slug);
  await moveCategory(access.business.id, categoryId, direction);
  refresh(slug);
}

// ── Equipo ──────────────────────────────────────────────────────────────
export async function inviteMemberAction(slug: string, _prev: ActionState, form: FormData): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  const email = emailSchema.safeParse(form.get("email"));
  if (!email.success) return { fields: { email: email.error.issues[0]!.message } };
  const role = form.get("role") === "OWNER" ? "OWNER" : "MEMBER";
  return run(async () => {
    const { token } = await createInvitation(access.business.id, email.data, role, user.id);
    refresh(slug);
    return {
      ok: true,
      message: "Invitación creada. Copiá el enlace y envíaselo a la persona (vence en 7 días).",
      data: { link: `${config.appUrl}/invitacion/${token}` },
    };
  });
}

export async function revokeInvitationAction(slug: string, invitationId: string) {
  const { user, access } = await requireManageAccess(slug);
  await revokeInvitation(access.business.id, invitationId, user.id);
  refresh(slug);
}

export async function removeMemberAction(slug: string, memberId: string): Promise<ActionState> {
  const { user, access } = await requireManageAccess(slug);
  return run(async () => {
    await removeMember(access.business.id, memberId, user.id);
    refresh(slug);
  });
}
