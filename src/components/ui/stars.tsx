import { Star } from "lucide-react";
import { RATING_LABELS } from "@/lib/rating";
import { cn } from "@/lib/cn";

/** Puntuación de solo lectura (no editable). */
export function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const cls = size === "sm" ? "size-4" : "size-5";
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${rating} de 5 estrellas: ${RATING_LABELS[rating]}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn(cls, i <= rating ? "fill-star text-star" : "fill-slate-200 text-slate-200")} aria-hidden />
      ))}
    </span>
  );
}
