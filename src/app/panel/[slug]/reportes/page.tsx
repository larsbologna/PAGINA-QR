import type { Metadata } from "next";
import { Download } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { getDashboardStats } from "@/server/services/stats";
import { config } from "@/server/config";
import { parsePeriod } from "@/lib/periods";
import { formatDate, formatNumber } from "@/lib/format";
import { filtersToSearchParams } from "@/lib/feedback-filters";
import { PageHeader } from "@/components/ui/page-header";
import { ButtonLink } from "@/components/ui/button";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { InsightList } from "@/components/dashboard/insight-list";
import { DistributionBars } from "@/components/charts/distribution";
import { CategoryBars } from "@/components/charts/category-bars";
import { PrintButton } from "@/components/qr/print-button";

export const metadata: Metadata = { title: "Reportes" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-t border-line pt-5">
      <h2 className="mb-3 text-sm font-semibold tracking-wide text-slate-500 uppercase">{title}</h2>
      {children}
    </section>
  );
}

export default async function ReportsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const period = parsePeriod((await searchParams).periodo);
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const s = await getDashboardStats(b, period.days);
  const now = new Date();
  const from = new Date(now.getTime() - period.days * 86400000);
  const opportunities = s.insights.insights.filter((i) => i.kind === "problem" || i.kind === "decline");
  const topCategories = [...s.categories].filter((c) => c.mentions > 0).sort((a, c) => c.mentions - a.mentions).slice(0, 6);
  const csvQs = filtersToSearchParams({ days: period.days === 365 ? 365 : period.days }).toString();

  return (
    <>
      <div className="no-print">
        <PageHeader
          title="Reportes"
          description="Reporte listo para imprimir o guardar como PDF desde el navegador."
          actions={
            <>
              <PeriodTabs basePath={`/panel/${b.slug}/reportes`} current={period.value} />
              <ButtonLink href={`/api/negocios/${b.slug}/exportar?${csvQs}`} variant="secondary" prefetch={false}>
                <Download className="size-4" aria-hidden /> CSV del período
              </ButtonLink>
              <PrintButton label="Imprimir / PDF" />
            </>
          }
        />
      </div>

      <article className="space-y-6 rounded-xl border border-line bg-white p-6 sm:p-10 print:border-0 print:p-0">
        <header>
          {b.isDemo && <p className="mb-2 text-xs font-semibold text-violet-700">DEMO · REPORTE CON DATOS FICTICIOS</p>}
          <p className="text-sm text-muted">Reporte de opiniones · {config.productName}</p>
          <h1 className="mt-1 text-2xl font-semibold">{b.name}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Período: {formatDate(from, b.timezone)} al {formatDate(now, b.timezone)} ({period.label.toLowerCase()})
          </p>
        </header>

        <Section title="Resumen del período">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["Opiniones", formatNumber(s.current.total)],
              ["Promedio interno", s.current.average === null ? "—" : `${formatNumber(s.current.average, 1)} / 5`],
              ["Positivas", s.current.total ? `${formatNumber((s.current.positive / s.current.total) * 100)}%` : "—"],
              ["Período anterior", `${formatNumber(s.previous.total)} opiniones`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs text-muted">{k}</dt>
                <dd className="mt-0.5 text-xl font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-xs text-muted">
            Opiniones privadas recogidas con el QR. No corresponden a la calificación pública de Google.
          </p>
        </Section>

        <div className="grid gap-6 sm:grid-cols-2">
          <Section title="Distribución de puntuaciones">
            {s.current.total ? <DistributionBars distribution={s.current.distribution} /> : <p className="text-sm text-muted">Sin opiniones en el período.</p>}
          </Section>
          <Section title="Categorías más mencionadas">
            {topCategories.length ? (
              <CategoryBars rows={topCategories.map((c) => ({ name: c.name, value: c.mentions, hint: `(${c.problemMentions} en neutrales/negativas)` }))} valueLabel="menciones" />
            ) : (
              <p className="text-sm text-muted">Ninguna categoría mencionada en el período.</p>
            )}
          </Section>
        </div>

        <Section title="Principales oportunidades de mejora">
          {!s.insights.sufficient ? (
            <p className="text-sm text-muted">{s.insights.message}</p>
          ) : opportunities.length ? (
            <InsightList insights={opportunities} />
          ) : (
            <p className="text-sm text-slate-700">No se detectaron problemas repetidos ni caídas relevantes en el período.</p>
          )}
        </Section>

        {s.insights.sufficient && s.insights.insights.some((i) => i.kind === "improvement") && (
          <Section title="Lo que mejoró">
            <InsightList insights={s.insights.insights.filter((i) => i.kind === "improvement")} />
          </Section>
        )}

        <Section title="Evolución temporal">
          {s.current.total >= 5 ? (
            <table className="w-full text-sm tabular-nums">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="py-1 text-left font-medium">{s.unit === "day" ? "Día" : s.unit === "week" ? "Semana" : "Mes"}</th>
                  <th className="py-1 text-right font-medium">Opiniones</th>
                  <th className="py-1 text-right font-medium">Promedio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {s.series.filter((p) => p.count > 0).map((p) => (
                  <tr key={p.key}>
                    <td className="py-1">{p.label}</td>
                    <td className="py-1 text-right">{formatNumber(p.count)}</td>
                    <td className="py-1 text-right">{p.average === null ? "—" : formatNumber(p.average, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-sm text-muted">No hay datos suficientes para mostrar la evolución (mínimo 5 opiniones en el período).</p>
          )}
        </Section>

        <footer className="border-t border-line pt-4 text-xs text-muted">
          Generado el {formatDate(now, b.timezone)}. El reporte no incluye datos personales ni notas internas.
        </footer>
      </article>
    </>
  );
}
