import Link from "next/link";
import { Search } from "lucide-react";
import { DAYS_OPTIONS, SORT_OPTIONS, type FeedbackFilters } from "@/lib/feedback-filters";
import { Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const RATING_OPTIONS = [
  { value: "", label: "Todas" },
  { value: "5", label: "5 estrellas" },
  { value: "4", label: "4 estrellas" },
  { value: "3", label: "3 estrellas" },
  { value: "2", label: "2 estrellas" },
  { value: "1", label: "1 estrella" },
  { value: "4,5", label: "4 y 5 estrellas" },
  { value: "1,2", label: "1 y 2 estrellas" },
];

/** Formulario GET: funciona sin JavaScript y deja los filtros en la URL. */
export function FiltersForm({ action, filters, categories }: { action: string; filters: FeedbackFilters; categories: { id: string; name: string }[] }) {
  const ratingValue = filters.ratings.join(",");
  return (
    <form action={action} method="get" className="grid gap-3 rounded-xl border border-line bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="relative sm:col-span-2 lg:col-span-2">
        <label htmlFor="q" className="sr-only">Buscar en comentarios</label>
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
        <Input id="q" name="q" type="search" defaultValue={filters.q} placeholder="Buscar en comentarios…" className="pl-9" maxLength={100} />
      </div>
      <div>
        <label htmlFor="puntuacion" className="sr-only">Puntuación</label>
        <Select id="puntuacion" name="puntuacion" defaultValue={RATING_OPTIONS.some((o) => o.value === ratingValue) ? ratingValue : ""}>
          {RATING_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.value ? o.label : "Puntuación: todas"}</option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="categoria" className="sr-only">Categoría</label>
        <Select id="categoria" name="categoria" defaultValue={filters.categoryId ?? ""}>
          <option value="">Categoría: todas</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="dias" className="sr-only">Período</label>
        <Select id="dias" name="dias" defaultValue={filters.days ? String(filters.days) : ""}>
          <option value="">Período: todo</option>
          {DAYS_OPTIONS.map((d) => (
            <option key={d} value={d}>{d === 365 ? "Últimos 12 meses" : `Últimos ${d} días`}</option>
          ))}
        </Select>
      </div>
      <div>
        <label htmlFor="estado" className="sr-only">Estado</label>
        <Select id="estado" name="estado" defaultValue={filters.status === "NEW" ? "nuevas" : filters.status === "REVIEWED" ? "revisadas" : ""}>
          <option value="">Estado: todas</option>
          <option value="nuevas">Sin revisar</option>
          <option value="revisadas">Revisadas</option>
        </Select>
      </div>
      <div>
        <label htmlFor="orden" className="sr-only">Ordenar</label>
        <Select id="orden" name="orden" defaultValue={filters.sort}>
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>Orden: {o.label.toLowerCase()}</option>
          ))}
        </Select>
      </div>
      <div className="flex gap-2 sm:justify-end">
        <Link href={action} className="inline-flex h-10 items-center rounded-lg px-3 text-sm font-medium text-slate-600 hover:bg-slate-100">
          Limpiar
        </Link>
        <Button type="submit" variant="secondary">Aplicar filtros</Button>
      </div>
    </form>
  );
}
