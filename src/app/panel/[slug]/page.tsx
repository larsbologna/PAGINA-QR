import type { Metadata } from "next";
import Link from "next/link";
import { Info, MessageSquareText, QrCode } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { getDashboardStats } from "@/server/services/stats";
import { config } from "@/server/config";
import { parsePeriod } from "@/lib/periods";
import { formatNumber, plural } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { StatCard, Delta } from "@/components/dashboard/stat-card";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { TrendSection } from "@/components/dashboard/trend-section";
import { DistributionBars } from "@/components/charts/distribution";
import { SentimentBar } from "@/components/charts/sentiment";
import { CategoryBars } from "@/components/charts/category-bars";

export const metadata: Metadata = { title: "Resumen" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function SummaryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const period = parsePeriod((await searchParams).periodo);
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const s = await getDashboardStats(b, period.days);
  const base = `/panel/${b.slug}`;

  if (s.totalAllTime === 0) {
    return (
      <>
        <PageHeader title="Resumen" />
        <Card>
          <EmptyState
            icon={MessageSquareText}
            title="Todavía no recibiste opiniones"
            action={
              <ButtonLink href={`${base}/qr`}>
                <QrCode className="size-4" aria-hidden /> Descargar el código QR
              </ButtonLink>
            }
          >
            Imprimí el QR y colocalo en un lugar visible: mostrador, mesas o la caja. Las opiniones aparecerán acá apenas lleguen.
          </EmptyState>
        </Card>
      </>
    );
  }

  const pctPositive = s.current.total ? (s.current.positive / s.current.total) * 100 : null;
  const prevPctPositive = s.previous.total ? (s.previous.positive / s.previous.total) * 100 : null;
  const problems = s.categories
    .filter((c) => c.problemMentions > 0)
    .sort((a, c) => c.problemMentions - a.problemMentions)
    .slice(0, 5);

  return (
    <>
      <PageHeader
        title="Resumen"
        description={`${period.label} · comparado con los ${period.days} días anteriores`}
        actions={<PeriodTabs basePath={base} current={period.value} />}
      />

      <p className="mb-5 flex items-start gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-xs text-slate-600">
        <Info className="mt-0.5 size-3.5 shrink-0 text-slate-400" aria-hidden />
        Estos datos son opiniones privadas recogidas con el QR de {config.productName}. No son tu calificación pública de Google.
      </p>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Opiniones totales"
          value={formatNumber(s.totalAllTime)}
          sub={
            s.unreviewed > 0 ? (
              <Link href={`${base}/opiniones?estado=nuevas`} className="font-medium text-brand-700 hover:underline">
                {plural(s.unreviewed, "sin revisar", "sin revisar")}
              </Link>
            ) : (
              "Todas revisadas"
            )
          }
        />
        <StatCard
          label="Promedio interno"
          value={
            s.current.average === null ? (
              "—"
            ) : (
              <>
                {formatNumber(s.current.average, 1)}
                <span className="ml-1 text-base font-normal text-muted">/ 5</span>
              </>
            )
          }
          delta={<Delta current={s.current.average} previous={s.previous.average} digits={1} />}
        />
        <StatCard label="Últimos 7 días" value={formatNumber(s.last7)} sub="opiniones recibidas" />
        <StatCard label="Últimos 30 días" value={formatNumber(s.last30)} sub="opiniones recibidas" />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Distribución de puntuaciones" description={`${plural(s.current.total, "opinión", "opiniones")} en el período`} />
          <CardBody>
            {s.current.total ? <DistributionBars distribution={s.current.distribution} /> : <p className="py-6 text-center text-sm text-muted">Sin opiniones en este período.</p>}
          </CardBody>
        </Card>
        <Card>
          <CardHeader
            title="Positivas, neutrales y negativas"
            description={<Delta current={pctPositive} previous={prevPctPositive} suffix=" pts. de positivas" />}
            action={
              access.canManage ? (
                <Link href={`${base}/configuracion#criterios`} className="text-xs font-medium text-brand-700 hover:underline">
                  Cambiar criterios
                </Link>
              ) : undefined
            }
          />
          <CardBody>
            <SentimentBar positive={s.current.positive} neutral={s.current.neutral} negative={s.current.negative} thresholds={s.thresholds} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-4">
        <TrendSection series={s.series} unit={s.unit} total={s.current.total} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Categorías con más problemas"
            description="Menciones en opiniones neutrales o negativas"
            action={<Link href={`${base}/analisis?periodo=${period.value}`} className="text-xs font-medium text-brand-700 hover:underline">Ver análisis</Link>}
          />
          <CardBody>
            {problems.length ? (
              <CategoryBars rows={problems.map((c) => ({ name: c.name, value: c.problemMentions }))} valueLabel="menciones en opiniones neutrales o negativas" />
            ) : (
              <p className="py-6 text-center text-sm text-muted">No hay categorías señaladas en opiniones neutrales o negativas en este período.</p>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Comparación con el período anterior" />
          <CardBody className="overflow-x-auto">
            <table className="w-full text-sm tabular-nums">
              <thead className="text-xs text-muted">
                <tr>
                  <th className="pb-2 text-left font-medium">Indicador</th>
                  <th className="pb-2 text-right font-medium">Actual</th>
                  <th className="pb-2 text-right font-medium">Anterior</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                <tr>
                  <td className="py-2">Opiniones</td>
                  <td className="py-2 text-right">{formatNumber(s.current.total)}</td>
                  <td className="py-2 text-right">{formatNumber(s.previous.total)}</td>
                </tr>
                <tr>
                  <td className="py-2">Promedio interno</td>
                  <td className="py-2 text-right">{s.current.average === null ? "—" : formatNumber(s.current.average, 1)}</td>
                  <td className="py-2 text-right">{s.previous.average === null ? "—" : formatNumber(s.previous.average, 1)}</td>
                </tr>
                <tr>
                  <td className="py-2">% positivas</td>
                  <td className="py-2 text-right">{pctPositive === null ? "—" : `${formatNumber(pctPositive)}%`}</td>
                  <td className="py-2 text-right">{prevPctPositive === null ? "—" : `${formatNumber(prevPctPositive)}%`}</td>
                </tr>
                <tr>
                  <td className="py-2">Negativas</td>
                  <td className="py-2 text-right">{formatNumber(s.current.negative)}</td>
                  <td className="py-2 text-right">{formatNumber(s.previous.negative)}</td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
