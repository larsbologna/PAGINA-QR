import { requireSuperadmin } from "@/server/auth/current";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, CheckCircle2, ExternalLink, XCircle } from "lucide-react";
import { getBusinessForAdmin } from "@/server/services/businesses";
import { runDiagnostics } from "@/server/services/diagnostics";
import { listMembers } from "@/server/services/members";
import { publicFeedbackUrl } from "@/server/config";
import { PLAN_LABELS, STATUS_LABELS } from "@/lib/plans";
import { formatDate, formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { InviteForm } from "@/components/team/invite-form";
import { MembersTable } from "@/components/team/members-table";
import { AdminDataForm, DeleteBusinessForm, PlanForm } from "@/components/admin/business-admin-forms";
import {
  adminInviteAction, adminPasswordResetAction, adminRemoveMemberAction, adminRevokeInvitationAction, applyRetentionAction, setStatusAction,
} from "@/app/admin/actions";

export const metadata: Metadata = { title: "Ficha del negocio" };

const LEVEL = {
  ok: { icon: CheckCircle2, cls: "text-emerald-600", label: "Correcto" },
  warning: { icon: AlertTriangle, cls: "text-amber-600", label: "Atención" },
  error: { icon: XCircle, cls: "text-red-600", label: "Problema" },
} as const;

export default async function AdminBusinessPage({ params }: { params: Promise<{ id: string }> }) {
  await requireSuperadmin();
  const { id } = await params;
  const b = await getBusinessForAdmin(id);
  if (!b) notFound();
  const [diag, team] = await Promise.all([runDiagnostics(b.id), listMembers(b.id)]);
  const active = b.status === "ACTIVE";

  return (
    <>
      <Link href="/admin" className="mb-3 inline-block text-sm text-muted hover:text-ink">← Negocios</Link>
      <PageHeader
        title={
          <span className="flex flex-wrap items-center gap-2">
            {b.name}
            <Badge tone={active ? "green" : "red"}>{STATUS_LABELS[b.status]}</Badge>
            <Badge tone="blue">{PLAN_LABELS[b.plan]}</Badge>
            {b.isDemo && <DemoBadge />}
          </span>
        }
        description={`Alta: ${formatDate(b.createdAt)}${b.suspendedAt ? ` · Suspendido desde ${formatDate(b.suspendedAt)}` : ""}`}
        actions={
          <>
            <ButtonLink href={`/panel/${b.slug}`} variant="secondary">Abrir panel</ButtonLink>
            <ButtonLink href={`/panel/${b.slug}/qr`} variant="secondary">QR</ButtonLink>
            <a href={publicFeedbackUrl(b.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1 px-2 text-sm font-medium text-brand-700 hover:underline">
              Página pública <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Diagnóstico de la cuenta" />
          <ul className="divide-y divide-line">
            {diag.checks.map((c) => {
              const L = LEVEL[c.level];
              return (
                <li key={c.id} className="flex gap-3 px-5 py-3">
                  <L.icon className={`mt-0.5 size-4 shrink-0 ${L.cls}`} aria-label={L.label} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-sm break-words text-muted">{c.detail}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card>
          <CardHeader title="Actividad" />
          <CardBody>
            <dl className="space-y-2.5 text-sm">
              {diag.facts.map((f) => (
                <div key={f.label} className="flex justify-between gap-3">
                  <dt className="text-muted">{f.label}</dt>
                  <dd className="text-right font-medium tabular-nums">
                    {f.value === null ? "—" : f.value instanceof Date ? formatDateTime(f.value) : typeof f.value === "number" ? formatNumber(f.value) : f.value}
                  </dd>
                </div>
              ))}
            </dl>
          </CardBody>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Datos del negocio" />
          <CardBody>
            <AdminDataForm b={{ ...b, plan: b.plan }} />
          </CardBody>
        </Card>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Estado del servicio" />
            <CardBody className="space-y-3 text-sm">
              <p className="text-muted">
                {active
                  ? "Suspender desactiva la página pública y el acceso del equipo. No borra datos."
                  : "Reactivar vuelve a habilitar la página pública y el acceso del equipo."}
              </p>
              <ActionButton
                action={setStatusAction.bind(null, b.id, active ? "SUSPENDED" : "ACTIVE")}
                variant={active ? "danger" : "primary"}
                pendingText="Guardando…"
                confirmText={active ? `¿Suspender ${b.name}?` : undefined}
              >
                {active ? "Suspender cuenta" : "Reactivar cuenta"}
              </ActionButton>
            </CardBody>
          </Card>
          <Card>
            <CardHeader title="Plan" />
            <CardBody className="space-y-4">
              <PlanForm id={b.id} plan={b.plan} />
              <div>
                <p className="mb-1 text-xs font-medium text-muted">Historial</p>
                <ul className="space-y-1 text-xs">
                  {b.plans.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span>{PLAN_LABELS[p.plan]} {p.status === "ACTIVE" ? <Badge tone="green">vigente</Badge> : null}</span>
                      <span className="text-muted">
                        {formatDate(p.startsAt)}
                        {p.endsAt ? ` → ${formatDate(p.endsAt)}` : ""}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardBody>
          </Card>
          {b.slugHistory.length > 0 && (
            <Card>
              <CardHeader title="URLs anteriores (redirigen)" />
              <CardBody>
                <ul className="space-y-1 text-xs text-muted">
                  {b.slugHistory.map((h) => <li key={h.id}>/r/{h.slug}</li>)}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Card className="mt-4">
        <CardHeader title="Equipo del negocio" description="Invitá al dueño o a su equipo. El enlace se muestra una sola vez." />
        <CardBody className="space-y-6">
          <InviteForm action={adminInviteAction.bind(null, b.id)} />
          <MembersTable
            members={team.members}
            invitations={team.invitations}
            removeAction={(mid) => adminRemoveMemberAction.bind(null, b.id, mid)}
            revokeAction={(iid) => adminRevokeInvitationAction.bind(null, b.id, iid)}
            resetAction={(mid) => adminPasswordResetAction.bind(null, b.id, mid)}
          />
        </CardBody>
      </Card>

      <Card className="mt-4 border-red-200">
        <CardHeader title="Datos y eliminación" />
        <CardBody className="space-y-6">
          <div className="space-y-2 text-sm">
            <p className="text-muted">
              Plazo de conservación: {b.retentionMonths} meses. La retención se aplica automáticamente si programás <code className="rounded bg-slate-100 px-1">npm run retention:run</code>; también podés aplicarla ahora.
            </p>
            <ActionButton action={applyRetentionAction.bind(null, b.id)} variant="secondary" pendingText="Aplicando…" confirmText="Se eliminarán las opiniones más antiguas que el plazo de conservación. ¿Continuar?">
              Aplicar retención ahora
            </ActionButton>
          </div>
          <DeleteBusinessForm id={b.id} slug={b.slug} />
        </CardBody>
      </Card>
    </>
  );
}
