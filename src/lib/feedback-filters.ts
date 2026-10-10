/** Filtros de la bandeja de opiniones, serializables en la URL. */
export type FeedbackSort = "recientes" | "antiguas" | "mayor" | "menor";

export interface FeedbackFilters {
  ratings: number[];
  status: "NEW" | "REVIEWED" | null;
  categoryId: string | null;
  days: number | null;
  q: string;
  sort: FeedbackSort;
  page: number;
}

export const SORT_OPTIONS: { value: FeedbackSort; label: string }[] = [
  { value: "recientes", label: "Más recientes" },
  { value: "antiguas", label: "Más antiguas" },
  { value: "mayor", label: "Mayor puntuación" },
  { value: "menor", label: "Menor puntuación" },
];

export const DAYS_OPTIONS = [7, 30, 90, 365];

type Params = Record<string, string | string[] | undefined>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseFeedbackFilters(params: Params): FeedbackFilters {
  const ratingsRaw = one(params.puntuacion) ?? "";
  const ratings = [...new Set(ratingsRaw.split(",").map((x) => Number.parseInt(x, 10)).filter((n) => n >= 1 && n <= 5))].sort();
  const estado = one(params.estado);
  const status = estado === "nuevas" ? "NEW" : estado === "revisadas" ? "REVIEWED" : null;
  const categoryId = (one(params.categoria) ?? "").slice(0, 40) || null;
  const daysN = Number.parseInt(one(params.dias) ?? "", 10);
  const days = DAYS_OPTIONS.includes(daysN) ? daysN : null;
  const q = (one(params.q) ?? "").trim().slice(0, 100);
  const sortRaw = one(params.orden) as FeedbackSort | undefined;
  const sort = SORT_OPTIONS.some((s) => s.value === sortRaw) ? sortRaw! : "recientes";
  const pageN = Number.parseInt(one(params.pagina) ?? "1", 10);
  const page = Number.isFinite(pageN) && pageN > 0 && pageN < 100000 ? pageN : 1;
  return { ratings, status, categoryId, days, q, sort, page };
}

export function filtersToSearchParams(f: Partial<FeedbackFilters>): URLSearchParams {
  const p = new URLSearchParams();
  if (f.ratings?.length) p.set("puntuacion", f.ratings.join(","));
  if (f.status) p.set("estado", f.status === "NEW" ? "nuevas" : "revisadas");
  if (f.categoryId) p.set("categoria", f.categoryId);
  if (f.days) p.set("dias", String(f.days));
  if (f.q) p.set("q", f.q);
  if (f.sort && f.sort !== "recientes") p.set("orden", f.sort);
  if (f.page && f.page > 1) p.set("pagina", String(f.page));
  return p;
}
