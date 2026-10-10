import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";

export function Pagination({ page, pages, hrefFor }: { page: number; pages: number; hrefFor: (p: number) => string }) {
  if (pages <= 1) return null;
  const item = "inline-flex h-9 items-center gap-1 rounded-lg border border-line bg-white px-3 text-sm font-medium";
  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link className={cn(item, "hover:bg-slate-50")} href={hrefFor(page - 1)} rel="prev">
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </Link>
      ) : (
        <span className={cn(item, "text-slate-400")} aria-disabled>
          <ChevronLeft className="size-4" aria-hidden /> Anterior
        </span>
      )}
      <span className="text-sm text-muted">
        Página {page} de {pages}
      </span>
      {page < pages ? (
        <Link className={cn(item, "hover:bg-slate-50")} href={hrefFor(page + 1)} rel="next">
          Siguiente <ChevronRight className="size-4" aria-hidden />
        </Link>
      ) : (
        <span className={cn(item, "text-slate-400")} aria-disabled>
          Siguiente <ChevronRight className="size-4" aria-hidden />
        </span>
      )}
    </nav>
  );
}
