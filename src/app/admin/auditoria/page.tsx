import { requireSuperadmin } from "@/server/auth/current";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/server/db";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = { title: "Auditoría" };

const LABELS: Record<string, string> = {
  "auth.login": "Inicio de sesión",
  "auth.password_changed": "Cambio de contraseña",
  "business.created": "Negocio creado",
  "business.updated": "Datos actualizados",
  "business.branding_updated": "Identidad actualizada",
  "business.logo_updated": "Logo actualizado",
  "business.status_changed": "Estado cambiado",
  "business.plan_changed": "Plan cambiado",
  "business.slug_changed": "URL cambiada",
  "business.deleted": "Negocio eliminado",
  "business.retention_applied": "Retención aplicada",
  "category.created": "Categoría creada",
  "category.updated": "Categoría modificada",
  "feedback.reviewed": "Opinión revisada",
  "feedback.unreviewed": "Opinión marcada sin revisar",
  "feedback.note_added": "Nota agregada",
  "feedback.exported": "Exportación CSV",
  "member.invited": "Invitación creada",
  "member.invitation_revoked": "Invitación revocada",
  "member.joined": "Miembro se unió",
  "member.removed": "Miembro quitado",
};

export default async function AuditPage() {
  await requireSuperadmin();
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { user: { select: { email: true } }, business: { select: { id: true, name: true } } },
  });
  return (
    <>
      <PageHeader title="Auditoría" description="Últimas 200 acciones registradas. No incluye comentarios de clientes ni contraseñas." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-line bg-slate-50 text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2.5 font-medium">Fecha</th>
                <th className="px-3 py-2.5 font-medium">Acción</th>
                <th className="px-3 py-2.5 font-medium">Usuario</th>
                <th className="px-5 py-2.5 font-medium">Negocio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {logs.map((l) => (
                <tr key={l.id}>
                  <td className="px-5 py-2 whitespace-nowrap text-muted">{formatDateTime(l.createdAt)}</td>
                  <td className="px-3 py-2">{LABELS[l.action] ?? l.action}</td>
                  <td className="px-3 py-2 text-muted">{l.user?.email ?? "Sistema / público"}</td>
                  <td className="px-5 py-2">
                    {l.business ? <Link href={`/admin/negocios/${l.business.id}`} className="hover:underline">{l.business.name}</Link> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-muted">Sin registros todavía.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
