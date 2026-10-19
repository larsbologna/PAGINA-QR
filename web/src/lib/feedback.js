// Reglas de negocio de las opiniones. Única fuente de verdad para la
// clasificación, los filtros y las estadísticas (pantalla y pruebas).

export const COMMENT_MAX = 1000;
export const NOTE_MAX = 2000;

export const RATING_LABELS = { 1: "Muy mala", 2: "Mala", 3: "Regular", 4: "Buena", 5: "Excelente" };

/** 1–2 negativa · 3 intermedia · 4–5 positiva. */
export function sentimentOf(rating) {
  if (rating <= 2) return "negative";
  if (rating === 3) return "neutral";
  return "positive";
}
export const SENTIMENT_LABELS = { negative: "Negativa", neutral: "Intermedia", positive: "Positiva" };

/**
 * Las opiniones de 1 a 4 estrellas pasaron por "¿Qué podríamos mejorar?":
 * quedan pendientes hasta que el negocio las marque como resueltas.
 * Las de 5 estrellas no reportan un problema, así que no requieren seguimiento.
 */
export const needsFollowUp = (f) => f.rating <= 4;
export const isResolved = (f) => f.status === "resolved";
export const isPending = (f) => needsFollowUp(f) && !isResolved(f);

export const FILTERS = [
  { id: "todas", label: "Todas", test: () => true },
  { id: "positivas", label: "Positivas", test: (f) => sentimentOf(f.rating) === "positive" },
  { id: "negativas", label: "Negativas", test: (f) => sentimentOf(f.rating) === "negative" },
  { id: "pendientes", label: "Pendientes", test: isPending },
  { id: "resueltas", label: "Resueltas", test: (f) => needsFollowUp(f) && isResolved(f) },
];

export function applyFilter(list, id) {
  const f = FILTERS.find((x) => x.id === id) ?? FILTERS[0];
  return list.filter(f.test);
}

export const PERIODS = [
  { id: "7d", label: "7 días", days: 7 },
  { id: "30d", label: "30 días", days: 30 },
  { id: "todo", label: "Todo", days: null },
];

const DAY = 86400000;
const startOfDay = (t) => {
  const d = new Date(t);
  d.setHours(0, 0, 0, 0);
  return d;
};
const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

/**
 * Estadísticas a partir de las opiniones reales.
 * @param {{rating:number,status?:string,createdAt:Date}[]} feedback
 * @param {number|null} days  período (null = todo)
 */
export function computeStats(feedback, days, now = Date.now()) {
  const from = days ? startOfDay(now - (days - 1) * DAY).getTime() : null;
  const cur = from === null ? feedback : feedback.filter((f) => f.createdAt.getTime() >= from);
  const count = (fn) => cur.filter(fn).length;
  const total = cur.length;

  // Serie temporal: por día hasta 31 días; si no, por semana o por mes.
  const first = from ?? (cur.length ? Math.min(...cur.map((f) => f.createdAt.getTime())) : now);
  const span = Math.max(1, Math.round((startOfDay(now) - startOfDay(first)) / DAY) + 1);
  const unit = span <= 31 ? "day" : span <= 26 * 7 ? "week" : "month";
  const bucketStart = (t) => {
    const d = startOfDay(t);
    if (unit === "week") d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    if (unit === "month") d.setDate(1);
    return d;
  };
  const buckets = new Map();
  for (let d = bucketStart(first); d.getTime() <= now; ) {
    buckets.set(dayKey(d), { start: new Date(d), negative: 0, neutral: 0, positive: 0, total: 0, sum: 0 });
    if (unit === "day") d.setDate(d.getDate() + 1);
    else if (unit === "week") d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
  }
  for (const f of cur) {
    const b = buckets.get(dayKey(bucketStart(f.createdAt.getTime())));
    if (!b) continue;
    b[sentimentOf(f.rating)]++;
    b.total++;
    b.sum += f.rating;
  }

  return {
    total,
    average: total ? cur.reduce((a, f) => a + f.rating, 0) / total : null,
    positive: count((f) => sentimentOf(f.rating) === "positive"),
    neutral: count((f) => sentimentOf(f.rating) === "neutral"),
    negative: count((f) => sentimentOf(f.rating) === "negative"),
    // Los pendientes no dependen del período: es lo que queda por resolver hoy.
    pending: feedback.filter(isPending).length,
    distribution: [1, 2, 3, 4, 5].map((r) => count((f) => f.rating === r)),
    unit,
    series: [...buckets.values()].map((b) => ({ ...b, average: b.total ? b.sum / b.total : null })),
  };
}

/** Identificador aleatorio para que un reintento no duplique la opinión. */
export function newFeedbackId() {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
