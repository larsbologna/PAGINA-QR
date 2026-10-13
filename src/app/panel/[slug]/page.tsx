import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, MessageSquareText, QrCode } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { getDashboardStats } from "@/server/services/stats";
import { topReasons } from "@/server/services/feedback";
import { config } from "@/server/config";
import { parsePeriod } from "@/lib/periods";
import { formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { StatCard, Delta } from "@/components/dashboard/stat-card";
import { PeriodTabs } from "@/components/dashboard/period-tabs";
import { TrendSection } from "@/components/dashboard/trend-section";
import { InsightList } from "@/components/dashboard/insight-list";
import { SentimentBar } from "@/components/charts/sentiment";
import { CategoryBars } from "@/components/charts/category-bars";

export const metadata: Metadata = { title: "Progreso" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function ProgressPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const period = parsePeriod((await searchParams).periodo);
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const [s, reasons] = await Promise.all([getDashboardStats(b, period.days), topReasons(b.id, period.days, 4, 5)]);
  const base = `/panel/${b.slug}`;

  if (s.totalAllTime === 0) {
    return (
      <>
        <PageHeader title="Tu progreso" />
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
            Imprimí el QR y colocalo en un lugar visible: mostrador, mesas o la caja. Tu progreso va a aparecer acá apenas lleguen las primeras opiniones.
          </EmptyState>
        </Card>
      </>
    );
  }

  const highlights = s.insights.insights.filter((i) => i.kind !== "info").slice(0, 3);

  return (
    <>
      <PageHeader
        title="Tu progreso"
        description={`${period.label} · comparado con los ${period.days} días anteriores`}
        actions={<PeriodTabs basePath={base} current={period.value} />}
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          label="Opiniones recibidas"
          value={formatNumber(s.current.total)}
          delta={<Delta current={s.current.total} previous={s.previous.total} />}
        />
        <StatCard
          label="Calificación promedio"
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
        <StatCard
          label="Clientes enviados a Google"
          value={formatNumber(s.googleClicks.current)}
          delta={<Delta current={s.googleClicks.current} previous={s.googleClicks.previous} />}
          sub={b.googleReviewUrl ? undefined : <Link href={`${base}/configuracion`} className="font-medium text-brand-700 hover:underline">Cargá tu enlace de Google</Link>}
        />
        <StatCard
          label="Para revisar"
          value={formatNumber(s.pendingToImprove)}
          sub={
            <Link href={`${base}/mejorar`} className="inline-flex items-center gap-0.5 font-medium text-brand-700 hover:underline">
              Ver opiniones <ArrowRight className="size-3" aria-hidden />
            </Link>
          }
        />
      </div>

      <p className="mt-3 text-xs text-muted">
        Opiniones privadas recogidas con el QR de {config.productName}. “Clientes enviados a Google” cuenta cuántas personas tocaron “Dejar reseña en Google”; la calificación pública de Google puede ser distinta.
      </p>

      <div className="mt-4">
        <TrendSection series={s.series} unit={s.unit} total={s.current.total} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Lo que más se repite" description="Motivos elegidos en opiniones de 1 a 4 estrellas" />
          <CardBody className="space-y-6">
            {reasons.length ? (
              <CategoryBars rows={reasons.map((r) => ({ name: r.name, value: r.count }))} valueLabel="menciones en opiniones de 1 a 4 estrellas" />
            ) : (
              <p className="py-4 text-center text-sm text-muted">Ningún motivo se repite en este período. ¡Bien!</p>
            )}
            {highlights.length > 0 && (
              <div className="border-t border-line pt-4">
                <InsightList insights={highlights} />
              </div>
            )}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Satisfacción" description="Cómo se reparten las opiniones del período" />
          <CardBody>
            <SentimentBar positive={s.current.positive} neutral={s.current.neutral} negative={s.current.negative} thresholds={s.thresholds} />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-4 text-sm no-print">
        <Link href={`${base}/reportes?periodo=${period.value}`} className="inline-flex items-center gap-1 font-medium text-brand-700 hover:underline">
          <FileText className="size-4" aria-hidden /> Descargar reporte del período
        </Link>
        <Link href={`${base}/opiniones`} className="inline-flex items-center gap-1 font-medium text-slate-600 hover:underline">
          <MessageSquareText className="size-4" aria-hidden /> Ver todas las opiniones
        </Link>
      </div>
    </>
  );
}
