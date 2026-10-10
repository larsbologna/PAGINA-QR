import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { getDashboardStats } from "@/server/services/stats";
import { parsePeriod } from "@/lib/periods";
import { formatNumber } from "@/lib/format";
import { MIN_FEEDBACK_FOR_INSIGHTS, MIN_MENTIONS_FOR_TREND } from "@/lib/insights";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { InsightList } from "@/components/dashboard/insight-list";

export const metadata: Metadata = { title: "Análisis" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const avg = (sum: number, n: number) => (n ? formatNumber(sum / n, 1) : "—");

export default async function AnalysisPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const period = parsePeriod((await searchParams).periodo);
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const s = await getDashboardStats(b, period.days);
  const rows = [...s.categories].sort((a, c) => c.mentions - a.mentions || c.prevMentions - a.prevMentions);

  return (
    <>
      <PageHeader
        title="Análisis de problemas"
        description="Conclusiones calculadas a partir de las opiniones reales. Sin datos suficientes, no se muestran conclusiones."
        actions={<PeriodTabs basePath={`/panel/${b.slug}/analisis`} current={period.value} />}
      />
      <div className="grid gap-4 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader title="Qué dicen las opiniones" description={`${period.label} · ${formatNumber(s.current.total)} opiniones`} />
          <CardBody>
            {s.insights.sufficient ? (
              <InsightList insights={s.insights.insights} />
            ) : (
              <EmptyState icon={BarChart3} title="Todavía no hay información suficiente">
                {s.insights.message}
              </EmptyState>
            )}
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Cómo se calcula" />
          <CardBody className="space-y-2 text-sm text-slate-700">
            <p>Se comparan los últimos {period.days} días con los {period.days} días anteriores.</p>
            <p>
              Un problema es una categoría elegida en una opinión neutral o negativa (menos de {s.thresholds.positiveMin} estrellas). Se muestra desde 2 menciones.
            </p>
            <p>
              Las mejoras o caídas por categoría requieren al menos {MIN_MENTIONS_FOR_TREND} menciones en cada período y un cambio de 0,3 puntos o más.
            </p>
            <p>Se necesitan al menos {MIN_FEEDBACK_FOR_INSIGHTS} opiniones en el período para sacar conclusiones.</p>
          </CardBody>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Detalle por categoría" description="Menciones y promedio de las opiniones que eligieron cada categoría" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm tabular-nums">
            <thead className="border-b border-line bg-slate-50 text-xs text-muted">
              <tr>
                <th className="px-5 py-2.5 text-left font-medium">Categoría</th>
                <th className="px-3 py-2.5 text-right font-medium">Menciones</th>
                <th className="px-3 py-2.5 text-right font-medium">En neutrales o negativas</th>
                <th className="px-3 py-2.5 text-right font-medium">Promedio</th>
                <th className="px-3 py-2.5 text-right font-medium">Menciones (anterior)</th>
                <th className="px-5 py-2.5 text-right font-medium">Promedio (anterior)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((c) => (
                <tr key={c.categoryId}>
                  <td className="px-5 py-2.5">{c.name}</td>
                  <td className="px-3 py-2.5 text-right">{formatNumber(c.mentions)}</td>
                  <td className="px-3 py-2.5 text-right">{formatNumber(c.problemMentions)}</td>
                  <td className="px-3 py-2.5 text-right">{avg(c.ratingSum, c.mentions)}</td>
                  <td className="px-3 py-2.5 text-right text-muted">{formatNumber(c.prevMentions)}</td>
                  <td className="px-5 py-2.5 text-right text-muted">{avg(c.prevRatingSum, c.prevMentions)}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted">No hay categorías configuradas.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
