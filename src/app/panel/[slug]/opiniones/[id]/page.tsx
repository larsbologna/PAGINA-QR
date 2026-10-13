import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Lock } from "lucide-react";
import { getBusinessAccess } from "@/server/auth/current";
import { getFeedbackDetail } from "@/server/services/feedback";
import { formatDateTime } from "@/lib/format";
import { RATING_LABELS } from "@/lib/rating";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Stars } from "@/components/ui/stars";
import { ReviewToggle } from "@/components/inbox/review-toggle";
import { NoteForm } from "@/components/inbox/note-form";

export const metadata: Metadata = { title: "Detalle de opinión" };

export default async function FeedbackDetailPage({ params }: { params: Promise<{ slug: string; id: string }> }) {
  const { slug, id } = await params;
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const f = await getFeedbackDetail(b.id, id);
  if (!f) notFound();

  return (
    <div className="mx-auto max-w-3xl">
      <Link href={`/panel/${b.slug}/mejorar`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> Volver a “Para mejorar”
      </Link>
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <div className="flex items-center gap-3">
              <Stars rating={f.rating} size="md" />
              <span className="text-sm font-medium">{f.rating} / 5 · {RATING_LABELS[f.rating]}</span>
            </div>
            <p className="mt-1 text-xs text-muted">Recibida el {formatDateTime(f.createdAt, b.timezone)}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {f.status === "NEW" ? <Badge tone="brand">Sin revisar</Badge> : <Badge>Revisada</Badge>}
            <ReviewToggle slug={b.slug} feedbackId={f.id} reviewed={f.status === "REVIEWED"} />
          </div>
        </div>
        <CardBody className="space-y-4">
          <div>
            <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Comentario del cliente</h2>
            {f.comment ? <p className="mt-1 whitespace-pre-line text-slate-800">{f.comment}</p> : <p className="mt-1 text-sm text-muted italic">Sin comentario</p>}
          </div>
          {f.selections.length > 0 && (
            <div>
              <h2 className="text-xs font-medium tracking-wide text-muted uppercase">Categorías</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {f.selections.map((s) => <Badge key={s.category.id}>{s.category.name}</Badge>)}
              </div>
            </div>
          )}
          {f.reviewedAt && (
            <p className="text-xs text-muted">
              Revisada el {formatDateTime(f.reviewedAt, b.timezone)}
              {f.reviewedBy ? ` por ${f.reviewedBy.name ?? f.reviewedBy.email}` : ""}.
            </p>
          )}
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Lock className="size-3.5" aria-hidden /> La puntuación y el comentario originales no se pueden modificar.
          </p>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardHeader title="Notas internas" description="Seguimiento privado del equipo." />
        <CardBody className="space-y-4">
          {f.notes.length === 0 ? (
            <p className="text-sm text-muted">Todavía no hay notas.</p>
          ) : (
            <ul className="space-y-3">
              {f.notes.map((n) => (
                <li key={n.id} className="rounded-lg bg-slate-50 px-4 py-3">
                  <p className="text-sm whitespace-pre-line text-slate-800">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {n.author ? (n.author.name ?? n.author.email) : "Usuario eliminado"} · {formatDateTime(n.createdAt, b.timezone)}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <NoteForm slug={b.slug} feedbackId={f.id} />
        </CardBody>
      </Card>
    </div>
  );
}
