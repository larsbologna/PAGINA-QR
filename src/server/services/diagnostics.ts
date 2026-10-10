import "server-only";
import { prisma } from "../db";
import { withTenant } from "../tenant";
import { config, publicFeedbackUrl } from "../config";
import { checkGoogleUrl } from "@/lib/google-url";

export type CheckLevel = "ok" | "warning" | "error";
export interface DiagnosticCheck {
  id: string;
  label: string;
  level: CheckLevel;
  detail: string;
}

export async function runDiagnostics(businessId: string): Promise<{ checks: DiagnosticCheck[]; facts: { label: string; value: string | number | Date | null }[] }> {
  const b = await prisma.business.findUniqueOrThrow({ where: { id: businessId } });
  const [members, owners, pendingInvites, lastLogin] = await Promise.all([
    prisma.businessMember.count({ where: { businessId } }),
    prisma.businessMember.count({ where: { businessId, role: "OWNER" } }),
    prisma.invitation.count({ where: { businessId, acceptedAt: null, revokedAt: null, expiresAt: { gt: new Date() } } }),
    prisma.user.findFirst({
      where: { memberships: { some: { businessId } }, lastLoginAt: { not: null } },
      orderBy: { lastLoginAt: "desc" },
      select: { lastLoginAt: true },
    }),
  ]);
  const { activeCategories, total, last30, lastFeedback, unreviewed } = await withTenant(businessId, async (tx) => {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [activeCategories, total, last30, lastFeedback, unreviewed] = await Promise.all([
      tx.feedbackCategory.count({ where: { businessId, status: "ACTIVE" } }),
      tx.feedback.count({ where: { businessId } }),
      tx.feedback.count({ where: { businessId, createdAt: { gte: since } } }),
      tx.feedback.findFirst({ where: { businessId }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      tx.feedback.count({ where: { businessId, status: "NEW" } }),
    ]);
    return { activeCategories, total, last30, lastFeedback, unreviewed };
  });

  const checks: DiagnosticCheck[] = [];
  checks.push({
    id: "status",
    label: "Estado de la cuenta",
    level: b.status === "ACTIVE" ? "ok" : "error",
    detail: b.status === "ACTIVE" ? "Activa: la página pública recibe opiniones." : "Suspendida: la página pública no recibe opiniones y el equipo no puede ingresar.",
  });
  if (!b.googleReviewUrl) {
    checks.push({ id: "google", label: "Enlace de Google", level: "warning", detail: "Sin configurar: no se ofrecerá el botón para dejar reseña en Google." });
  } else {
    const g = checkGoogleUrl(b.googleReviewUrl);
    checks.push({
      id: "google",
      label: "Enlace de Google",
      level: g.ok ? "ok" : "error",
      detail: g.ok ? `Configurado (${g.kind === "review" ? "enlace directo para reseñar" : "perfil de Google Maps"}).` : g.error,
    });
  }
  checks.push({ id: "logo", label: "Logo", level: b.logoMimeType ? "ok" : "warning", detail: b.logoMimeType ? "Cargado." : "Sin logo: se muestran las iniciales del negocio." });
  checks.push({
    id: "categories",
    label: "Categorías de feedback",
    level: activeCategories > 0 ? "ok" : "warning",
    detail: activeCategories > 0 ? `${activeCategories} activas.` : "No hay categorías activas: el formulario solo tendrá comentario libre.",
  });
  checks.push({
    id: "owner",
    label: "Administrador del negocio",
    level: owners > 0 ? "ok" : pendingInvites > 0 ? "warning" : "error",
    detail: owners > 0 ? `${owners} administrador(es), ${members} miembro(s) en total.` : pendingInvites > 0 ? "Invitación enviada, todavía no aceptada." : "Nadie del negocio tiene acceso al panel.",
  });
  const isLocal = /localhost|127\.0\.0\.1/.test(config.appUrl);
  checks.push({
    id: "url",
    label: "URL pública",
    level: config.appUrl.startsWith("https://") ? "ok" : isLocal ? "warning" : "error",
    detail: config.appUrl.startsWith("https://")
      ? publicFeedbackUrl(b.slug)
      : `${publicFeedbackUrl(b.slug)} — en producción APP_URL debe usar https y un dominio propio antes de imprimir QR.`,
  });
  checks.push({
    id: "activity",
    label: "Actividad reciente",
    level: last30 > 0 ? "ok" : total > 0 ? "warning" : "warning",
    detail: last30 > 0 ? `${last30} opiniones en los últimos 30 días.` : total > 0 ? "Sin opiniones en los últimos 30 días: verificar que el QR esté visible." : "Todavía no recibió opiniones.",
  });

  return {
    checks,
    facts: [
      { label: "Opiniones totales", value: total },
      { label: "Últimos 30 días", value: last30 },
      { label: "Sin revisar", value: unreviewed },
      { label: "Última opinión", value: lastFeedback?.createdAt ?? null },
      { label: "Último ingreso del equipo", value: lastLogin?.lastLoginAt ?? null },
      { label: "Invitaciones pendientes", value: pendingInvites },
    ],
  };
}
