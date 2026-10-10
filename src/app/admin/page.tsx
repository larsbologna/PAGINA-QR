import { requireSuperadmin } from "@/server/auth/current";
import type { Metadata } from "next";
import Link from "next/link";
import { Building2, Plus, Search } from "lucide-react";
import type { BusinessStatus, PlanTier } from "@prisma/client";
import { listBusinessesForAdmin } from "@/server/services/businesses";
import { PLAN_KEYS, PLAN_LABELS, STATUS_LABELS } from "@/lib/plans";
import { formatDate, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink, Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge, DemoBadge } from "@/components/ui/badge";
import { Input, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/empty-state";
import { Alert } from "@/components/ui/alert";
import { StatCard } from "@/components/dashboard/stat-card";

export const metadata: Metadata = { title: "Panel maestro" };

type SP = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

export default async function AdminHome({ searchParams }: { searchParams: Promise<SP> }) {
  await requireSuperadmin(); // el layout no se re-ejecuta en navegaciones: se verifica en cada página
  const sp = await searchParams;
  const q = one(sp.q).trim().slice(0, 80);
  const status = (["ACTIVE", "SUSPENDED"] as const).find((s) => s === one(sp.estado)) as BusinessStatus | undefined;
  const plan = PLAN_KEYS.find((p) => p === one(sp.plan)) as PlanTier | undefined;
  const [rows, all] = await Promise.all([
    listBusinessesForAdmin({ q, status, plan }),
    q || status || plan ? listBusinessesForAdmin({}) : null,
  ]);
  const totals = all ?? rows;
  const filtered = !!(q || status || plan);

  return (
    <>
      <PageHeader
        title="Negocios"
        description="Todos los negocios que gestionás desde la plataforma."
        actions={
          <ButtonLink href="/admin/negocios/nuevo">
            <Plus className="size-4" aria-hidden /> Nuevo negocio
          </ButtonLink>
        }
      />
      {one(sp.eliminado) && <Alert tone="success" className="mb-4">El negocio y todos sus datos fueron eliminados.</Alert>}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Negocios" value={formatNumber(totals.length)} sub={`${totals.filter((b) => b.isDemo).length} de demostración`} />
        <StatCard label="Activos" value={formatNumber(totals.filter((b) => b.status === "ACTIVE").length)} />
        <StatCard label="Suspendidos" value={formatNumber(totals.filter((b) => b.status === "SUSPENDED").length)} />
        <StatCard label="Opiniones (30 días)" value={formatNumber(totals.filter((b) => !b.isDemo).reduce((a, b) => a + b.feedbackLast30, 0))} sub="sin contar demos" />
      </div>

      <form method="get" className="mb-4 grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-[1fr_180px_180px_auto]">
        <div className="relative">
          <label htmlFor="q" className="sr-only">Buscar por nombre</label>
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <Input id="q" name="q" type="search" defaultValue={q} placeholder="Buscar por nombre…" className="pl-9" />
        </div>
        <div>
          <label htmlFor="estado" className="sr-only">Estado</label>
          <Select id="estado" name="estado" defaultValue={status ?? ""}>
            <option value="">Estado: todos</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
          </Select>
        </div>
        <div>
          <label htmlFor="plan" className="sr-only">Plan</label>
          <Select id="plan" name="plan" defaultValue={plan ?? ""}>
            <option value="">Plan: todos</option>
            {PLAN_KEYS.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
          </Select>
        </div>
        <Button type="submit" variant="secondary">Filtrar</Button>
      </form>

      <Card>
        {rows.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={filtered ? "Ningún negocio coincide con la búsqueda" : "Todavía no creaste negocios"}
            action={filtered ? <ButtonLink href="/admin" variant="secondary">Ver todos</ButtonLink> : <ButtonLink href="/admin/negocios/nuevo">Crear el primero</ButtonLink>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="border-b border-line bg-slate-50 text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Negocio</th>
                  <th className="px-3 py-2.5 font-medium">Estado</th>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 text-right font-medium">Opiniones</th>
                  <th className="px-3 py-2.5 text-right font-medium">Últ. 30 días</th>
                  <th className="px-3 py-2.5 font-medium">Última opinión</th>
                  <th className="px-5 py-2.5 font-medium">Alta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3">
                      <Link href={`/admin/negocios/${b.id}`} className="font-medium text-ink hover:text-brand-700 hover:underline">
                        {b.name}
                      </Link>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted">
                        /r/{b.slug} {b.isDemo && <DemoBadge />}
                        {!b.googleReviewUrl && <Badge tone="amber">Sin enlace de Google</Badge>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={b.status === "ACTIVE" ? "green" : "red"}>{STATUS_LABELS[b.status]}</Badge>
                    </td>
                    <td className="px-3 py-3">{PLAN_LABELS[b.plan]}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(b.feedbackTotal)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatNumber(b.feedbackLast30)}</td>
                    <td className="px-3 py-3 text-muted">{b.lastFeedbackAt ? formatDate(b.lastFeedbackAt) : "—"}</td>
                    <td className="px-5 py-3 text-muted">{formatDate(b.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
