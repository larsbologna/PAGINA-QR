import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./db";
import type { Tx } from "./tenant";

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.password_changed"
  | "auth.password_reset_created"
  | "business.created"
  | "business.updated"
  | "business.branding_updated"
  | "business.logo_updated"
  | "business.status_changed"
  | "business.plan_changed"
  | "business.slug_changed"
  | "business.deleted"
  | "business.retention_applied"
  | "category.created"
  | "category.updated"
  | "feedback.reviewed"
  | "feedback.unreviewed"
  | "feedback.note_added"
  | "feedback.exported"
  | "member.invited"
  | "member.invitation_revoked"
  | "member.joined"
  | "member.removed";

export async function audit(
  entry: { userId?: string | null; businessId?: string | null; action: AuditAction; metadata?: Prisma.InputJsonValue },
  tx?: Tx,
) {
  const client = tx ?? prisma;
  await client.auditLog.create({
    data: {
      userId: entry.userId ?? null,
      businessId: entry.businessId ?? null,
      action: entry.action,
      metadata: entry.metadata,
    },
  });
}
