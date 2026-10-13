import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, StickyNote } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { listFeedback, topReasons } from "@/server/services/feedback";
import { parseFeedbackFilters } from "@/lib/feedback-filters";
import { formatDateTime, formatNumber } from "@/lib/format";
import { RATING_LABELS } from "@/lib/rating";
import { cn } from "@/lib/cn";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { StatusControl } from "@/components/inbox/status-control";
import { ContactInfo } from "@/components/inbox/contact-info";
import { STATUS_LABELS } from "@/lib/status";

export const metadata: Metadata = { title: "Para mejorar" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

const TABS = [
  { value: "pendientes", label: "Nuevas" },
  { value: "seguimiento", label: "En seguimiento" },
  { value: "resueltas", label: "Resueltas" },
  { value: "todas", label: "Todas" },
] as const;

export default async function ImprovePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;
  const tab = TABS.find((t) => t.value === sp.ver)?.value ?? "pendientes";
  const pageN = Number.parseInt(String(sp.pagina ?? "1"), 10);
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const base = `/panel/${b.slug}/mejorar`;

  const filters = {
    ...parseFeedbackFilters({}),
    ratings: [1, 2, 3, 4],
    status:
      tab === "pendientes" ? ("NEW" as const) : tab === "seguimiento" ? ("IN_PROGRESS" as const) : tab === "resueltas" ? ("REVIEWED" as const) : null,
    page: Number.isFinite(pageN) && pageN > 0 ? pageN : 1,
  };
  const [result, reasons] = await Promise.all([listFeedback(b.id, filters), topReasons(b.id, 30)]);
  const href = (p: { ver?: string; pagina?: number }) => {
    const q = new URLSearchParams();
    if ((p.ver ?? tab) !== "pendientes") q.set("ver", p.ver ?? tab);
    if (p.pagina && p.pagina > 1) q.set("pagina", String(p.pagina));
    const s = q.toString();
    return s ? `${base}?${s}` : base;
  };

  return (
    <>
      <PageHeader title="Para mejorar" description="Opiniones privadas de 1 a 4 estrellas: qué le pasó al cliente y por qué. Seguí cada caso: Nueva → En seguimiento → Resuelta." />

      {reasons.length > 0 && (
        <div className="mb-5 rounded-xl border border-line bg-white px-5 py-4">
          <p className="text-sm font-semibold">Motivos más frecuentes · últimos 30 días</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {reasons.map((r) => (
              <span key={r.id} className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-900 ring-1 ring-amber-200 ring-inset">
                {r.name} <strong className="tabular-nums">{formatNumber(r.count)}</strong>
              </span>
            ))}
          </div>
        </div>
      )}

      <nav aria-label="Filtro" className="mb-4 inline-flex rounded-lg border border-line bg-white p-0.5 shadow-sm">
        {TABS.map((t) => (
          <Link
            key={t.value}
            href={href({ ver: t.value })}
            aria-current={t.value === tab ? "page" : undefined}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium", t.value === tab ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {result.items.length === 0 ? (
        <Card>
          <EmptyState icon={CheckCircle2} title={tab === "pendientes" ? "No hay opiniones nuevas" : "No hay opiniones para mostrar"}>
            {tab === "pendientes" ? "Todo al día: no quedan opiniones de 1 a 4 estrellas sin atender." : "Cuando haya opiniones en este estado, aparecen acá."}
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-3">
          {result.items.map((f) => (
            <li key={f.id}>
              <Card className={f.rating <= 2 ? "border-l-4 border-l-red-500" : "border-l-4 border-l-amber-400"}>
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars rating={f.rating} />
                      <span className="text-sm font-medium">{RATING_LABELS[f.rating]}</span>
                      <time className="text-xs text-muted" dateTime={f.createdAt.toISOString()}>
                        {formatDateTime(f.createdAt, b.timezone)}
                      </time>
                      <span className="sr-only">Estado: {STATUS_LABELS[f.status]}</span>
                    </div>
                    <StatusControl slug={b.slug} feedbackId={f.id} status={f.status} />
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-medium text-muted">Motivo:</span>
                    {f.categories.length ? (
                      f.categories.map((c) => (
                        <Badge key={c.id} tone="amber">{c.name}</Badge>
                      ))
                    ) : (
                      <span className="text-xs text-muted">no indicado</span>
                    )}
                  </div>

                  {f.comment ? (
                    <p className="mt-2 text-sm whitespace-pre-line text-slate-800">“{f.comment}”</p>
                  ) : (
                    <p className="mt-2 text-sm text-muted italic">Sin comentario</p>
                  )}

                  {f.contact && <ContactInfo contact={f.contact} />}

                  <div className="mt-3 text-right">
                    <Link href={`/panel/${b.slug}/opiniones/${f.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                      <StickyNote className="size-3.5" aria-hidden />
                      {f.notesCount > 0 ? `Notas (${f.notesCount})` : "Agregar nota"}
                    </Link>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Pagination page={result.page} pages={result.pages} hrefFor={(p) => href({ pagina: p })} />
      </div>
    </>
  );
}
