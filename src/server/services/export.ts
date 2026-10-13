import "server-only";
import { toCsv } from "@/lib/csv";
import { formatDateTime } from "@/lib/format";
import { RATING_LABELS } from "@/lib/rating";
import type { FeedbackFilters } from "@/lib/feedback-filters";
import { feedbackForExport } from "./feedback";
import { audit } from "../audit";

export const CSV_HEADERS = ["Fecha", "Puntuación", "Valoración", "Comentario", "Categorías", "Estado", "ID"];

/**
 * Exporta opiniones a CSV. Solo incluye datos de la opinión (anónima);
 * las notas internas no se exportan.
 */
export async function exportFeedbackCsv(
  business: { id: string; timezone: string; isDemo: boolean },
  filters: FeedbackFilters,
  userId: string,
): Promise<{ csv: string; count: number }> {
  const rows = await feedbackForExport(business.id, filters);
  const data = rows.map((r) => [
    formatDateTime(r.createdAt, business.timezone),
    r.rating,
    RATING_LABELS[r.rating],
    r.comment ?? "",
    r.selections.map((s) => s.category.name).join(", "),
    r.status === "REVIEWED" ? "Resuelta" : r.status === "IN_PROGRESS" ? "En seguimiento" : "Nueva",
    r.id,
  ]);
  const headers = business.isDemo ? [...CSV_HEADERS, "DEMO"] : CSV_HEADERS;
  const finalRows = business.isDemo ? data.map((d) => [...d, "DATOS DE DEMOSTRACIÓN"]) : data;
  await audit({ userId, businessId: business.id, action: "feedback.exported", metadata: { count: rows.length } });
  return { csv: toCsv(headers, finalRows), count: rows.length };
}
