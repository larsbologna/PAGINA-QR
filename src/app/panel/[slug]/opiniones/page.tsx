import type { Metadata } from "next";
import Link from "next/link";
import { Download, MessageSquareText, StickyNote } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { listFeedback } from "@/server/services/feedback";
import { listCategories } from "@/server/services/categories";
import { filtersToSearchParams, parseFeedbackFilters } from "@/lib/feedback-filters";
import { formatDateTime, formatNumber } from "@/lib/format";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Pagination } from "@/components/ui/pagination";
import { SubmitButton } from "@/components/ui/submit-button";
import { FiltersForm } from "@/components/inbox/filters-form";
import { ReviewToggle } from "@/components/inbox/review-toggle";
import { markAllReviewedAction } from "../actions";

export const metadata: Metadata = { title: "Opiniones" };

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InboxPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const filters = parseFeedbackFilters(await searchParams);
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const base = `/panel/${b.slug}/opiniones`;
  const [result, categories] = await Promise.all([listFeedback(b.id, filters), listCategories(b.id)]);
  const qs = filtersToSearchParams({ ...filters, page: 1 }).toString();
  const hasFilters = qs.length > 0;

  return (
    <>
      <PageHeader
        title="Opiniones"
        description="Opiniones privadas recibidas con el QR. La puntuación y el comentario del cliente no se pueden editar."
        actions={
          <>
            <form action={markAllReviewedAction.bind(null, b.slug)}>
              <SubmitButton variant="ghost" size="sm" pendingText="Marcando…">Marcar todas como revisadas</SubmitButton>
            </form>
            <ButtonLink href={`/api/negocios/${b.slug}/exportar${qs ? `?${qs}` : ""}`} variant="secondary" size="sm" prefetch={false}>
              <Download className="size-4" aria-hidden /> Exportar CSV
            </ButtonLink>
          </>
        }
      />

      <FiltersForm action={base} filters={filters} categories={categories.map((c) => ({ id: c.id, name: c.status === "ARCHIVED" ? `${c.name} (archivada)` : c.name }))} />

      <p className="mt-4 mb-3 text-sm text-muted" aria-live="polite">
        {formatNumber(result.total)} {result.total === 1 ? "opinión" : "opiniones"}
        {hasFilters ? " con los filtros aplicados" : ""}
      </p>

      {result.items.length === 0 ? (
        <Card>
          <EmptyState
            icon={MessageSquareText}
            title={hasFilters ? "No hay opiniones con estos filtros" : "Todavía no hay opiniones"}
            action={hasFilters ? <ButtonLink href={base} variant="secondary">Quitar filtros</ButtonLink> : undefined}
          >
            {hasFilters ? "Probá ampliar el período o quitar algún filtro." : "Cuando un cliente escanee el QR y opine, la vas a ver acá."}
          </EmptyState>
        </Card>
      ) : (
        <ul className="space-y-3">
          {result.items.map((f) => (
            <li key={f.id}>
              <Card className={f.status === "NEW" ? "border-l-4 border-l-brand-600" : undefined}>
                <div className="px-5 py-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <Stars rating={f.rating} />
                      <time className="text-xs text-muted" dateTime={f.createdAt.toISOString()}>
                        {formatDateTime(f.createdAt, b.timezone)}
                      </time>
                      {f.status === "NEW" ? <Badge tone="brand">Sin revisar</Badge> : <Badge>Revisada</Badge>}
                    </div>
                    <ReviewToggle slug={b.slug} feedbackId={f.id} reviewed={f.status === "REVIEWED"} />
                  </div>
                  {f.comment ? (
                    <p className="mt-3 line-clamp-4 text-sm whitespace-pre-line text-slate-800">{f.comment}</p>
                  ) : (
                    <p className="mt-3 text-sm text-muted italic">Sin comentario</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1.5">
                      {f.categories.map((c) => (
                        <Badge key={c.id}>{c.name}</Badge>
                      ))}
                    </div>
                    <Link href={`${base}/${f.id}`} className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                      {f.notesCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs text-muted">
                          <StickyNote className="size-3.5" aria-hidden /> {f.notesCount}
                        </span>
                      )}
                      Ver detalle y notas
                    </Link>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Pagination
          page={result.page}
          pages={result.pages}
          hrefFor={(p) => {
            const s = filtersToSearchParams({ ...filters, page: p }).toString();
            return s ? `${base}?${s}` : base;
          }}
        />
      </div>
    </>
  );
}
