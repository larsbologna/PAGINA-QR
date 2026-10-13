// Estadísticas calculadas en el navegador a partir de las opiniones reales.
const DAY = 86400000;

export function computeStats(feedback, clicks, days, now = Date.now()) {
  const from = now - days * DAY;
  const prevFrom = from - days * DAY;
  const cur = feedback.filter((f) => f.createdAt.getTime() >= from);
  const prev = feedback.filter((f) => f.createdAt.getTime() >= prevFrom && f.createdAt.getTime() < from);
  const avg = (l) => (l.length ? l.reduce((a, f) => a + f.rating, 0) / l.length : null);
  const sumClicks = (a, b) => clicks.filter((c) => { const t = Date.parse(`${c.day}T12:00:00Z`); return t >= a && t < b; }).reduce((s, c) => s + c.count, 0);

  const reasons = new Map();
  for (const f of cur) if (f.rating <= 4) for (const c of f.categories ?? []) reasons.set(c, (reasons.get(c) ?? 0) + 1);

  // Serie: por día (≤31 días), por semana (≤120) o por mes.
  const unit = days <= 31 ? "day" : days <= 120 ? "week" : "month";
  const keyOf = (d) => {
    const x = new Date(d);
    if (unit === "month") return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}`;
    if (unit === "week") { const m = new Date(x); m.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return m.toISOString().slice(0, 10); }
    return x.toISOString().slice(0, 10);
  };
  const buckets = new Map();
  for (let t = from; t <= now; t += DAY) buckets.set(keyOf(t), { count: 0, sum: 0 });
  for (const f of cur) {
    const b = buckets.get(keyOf(f.createdAt));
    if (b) { b.count++; b.sum += f.rating; }
  }

  return {
    total: cur.length,
    prevTotal: prev.length,
    average: avg(cur),
    prevAverage: avg(prev),
    googleClicks: sumClicks(from, now + DAY),
    prevGoogleClicks: sumClicks(prevFrom, from),
    pending: feedback.filter((f) => f.rating <= 4 && f.status !== "REVIEWED").length,
    distribution: [1, 2, 3, 4, 5].map((r) => cur.filter((f) => f.rating === r).length),
    reasons: [...reasons.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6),
    unit,
    series: [...buckets.entries()].map(([key, v]) => ({ key, count: v.count, average: v.count ? v.sum / v.count : null })),
  };
}
