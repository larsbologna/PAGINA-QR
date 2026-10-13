import "server-only";
import { Prisma } from "@prisma/client";
import { withTenant, type Tx } from "../tenant";
import { periodRanges, type Range } from "@/lib/periods";
import { bucketKeys, bucketLabel, bucketUnitForDays, type BucketUnit } from "@/lib/buckets";
import { buildInsights, type CategoryPeriodStats, type InsightResult } from "@/lib/insights";

export interface PeriodSummary {
  total: number;
  average: number | null;
  distribution: [number, number, number, number, number]; // índices 0..4 ⇒ estrellas 1..5
  positive: number;
  neutral: number;
  negative: number;
}

export interface SeriesPoint {
  key: string;
  label: string;
  count: number;
  average: number | null;
}

export interface DashboardStats {
  days: number;
  thresholds: { positiveMin: number; negativeMax: number };
  totalAllTime: number;
  last7: number;
  last30: number;
  unreviewed: number;
  /** Clics en "Dejar reseña en Google" en el período actual y el anterior. */
  googleClicks: { current: number; previous: number };
  /** Opiniones de 1 a 4 estrellas sin revisar (para la sección "Para mejorar"). */
  pendingToImprove: number;
  current: PeriodSummary;
  previous: PeriodSummary;
  unit: BucketUnit;
  series: SeriesPoint[];
  categories: CategoryPeriodStats[];
  insights: InsightResult;
}

interface BusinessRef {
  id: string;
  positiveMin: number;
  negativeMax: number;
  timezone: string;
}

async function summarize(tx: Tx, b: BusinessRef, r: Range): Promise<PeriodSummary> {
  const rows = await tx.feedback.groupBy({
    by: ["rating"],
    where: { businessId: b.id, createdAt: { gte: r.from, lt: r.to } },
    _count: { _all: true },
  });
  const distribution: PeriodSummary["distribution"] = [0, 0, 0, 0, 0];
  for (const row of rows) distribution[row.rating - 1] = row._count._all;
  const total = distribution.reduce((a, n) => a + n, 0);
  const sum = distribution.reduce((a, n, i) => a + n * (i + 1), 0);
  let positive = 0, neutral = 0, negative = 0;
  distribution.forEach((n, i) => {
    const rating = i + 1;
    if (rating >= b.positiveMin) positive += n;
    else if (rating <= b.negativeMax) negative += n;
    else neutral += n;
  });
  return { total, average: total ? sum / total : null, distribution, positive, neutral, negative };
}

export async function getDashboardStats(b: BusinessRef, days: number, now = new Date()): Promise<DashboardStats> {
  const { current, previous } = periodRanges(days, now);
  const unit = bucketUnitForDays(days);
  const DAY = 24 * 3600 * 1000;

  return withTenant(b.id, async (tx) => {
    const [cur, prev, totalAllTime, last7, last30, unreviewed, clicksCur, clicksPrev, pendingToImprove] = await Promise.all([
      summarize(tx, b, current),
      summarize(tx, b, previous),
      tx.feedback.count({ where: { businessId: b.id } }),
      tx.feedback.count({ where: { businessId: b.id, createdAt: { gte: new Date(now.getTime() - 7 * DAY), lt: now } } }),
      tx.feedback.count({ where: { businessId: b.id, createdAt: { gte: new Date(now.getTime() - 30 * DAY), lt: now } } }),
      tx.feedback.count({ where: { businessId: b.id, status: "NEW" } }),
      tx.googleClick.count({ where: { businessId: b.id, createdAt: { gte: current.from, lt: current.to } } }),
      tx.googleClick.count({ where: { businessId: b.id, createdAt: { gte: previous.from, lt: previous.to } } }),
      tx.feedback.count({ where: { businessId: b.id, status: "NEW", rating: { lte: 4 } } }),
    ]);

    // Serie temporal agrupada en la zona horaria del negocio.
    const seriesRows = await tx.$queryRaw<{ bucket: string; count: number; avg: number | null }[]>`
      SELECT to_char(date_trunc(${unit}, ("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${b.timezone}), 'YYYY-MM-DD') AS bucket,
             COUNT(*)::int AS count,
             AVG("rating")::float AS avg
      FROM "feedback"
      WHERE "businessId" = ${b.id} AND "createdAt" >= ${current.from} AND "createdAt" < ${current.to}
      GROUP BY 1 ORDER BY 1`;
    const byKey = new Map(seriesRows.map((r) => [r.bucket, r]));
    const series = bucketKeys(current.from, current.to, unit, b.timezone).map((key) => {
      const r = byKey.get(key);
      return { key, label: bucketLabel(key, unit), count: r?.count ?? 0, average: r?.avg ?? null };
    });

    // Menciones por categoría en el período actual y el anterior.
    const catRows = await tx.$queryRaw<
      { id: string; name: string; mentions: number; problem: number; rsum: number; pmentions: number; pproblem: number; prsum: number }[]
    >(Prisma.sql`
      SELECT c."id", c."name",
        COUNT(f."id") FILTER (WHERE f."createdAt" >= ${current.from})::int AS mentions,
        COUNT(f."id") FILTER (WHERE f."createdAt" >= ${current.from} AND f."rating" < ${b.positiveMin})::int AS problem,
        COALESCE(SUM(f."rating") FILTER (WHERE f."createdAt" >= ${current.from}), 0)::int AS rsum,
        COUNT(f."id") FILTER (WHERE f."createdAt" < ${current.from})::int AS pmentions,
        COUNT(f."id") FILTER (WHERE f."createdAt" < ${current.from} AND f."rating" < ${b.positiveMin})::int AS pproblem,
        COALESCE(SUM(f."rating") FILTER (WHERE f."createdAt" < ${current.from}), 0)::int AS prsum
      FROM "feedback_categories" c
      LEFT JOIN "feedback_category_selections" s ON s."categoryId" = c."id" AND s."businessId" = c."businessId"
      LEFT JOIN "feedback" f ON f."id" = s."feedbackId" AND f."businessId" = c."businessId"
        AND f."createdAt" >= ${previous.from} AND f."createdAt" < ${current.to}
      WHERE c."businessId" = ${b.id}
      GROUP BY c."id", c."name", c."sortOrder"
      ORDER BY c."sortOrder"`);
    const categories: CategoryPeriodStats[] = catRows.map((r) => ({
      categoryId: r.id,
      name: r.name,
      mentions: r.mentions,
      problemMentions: r.problem,
      ratingSum: r.rsum,
      prevMentions: r.pmentions,
      prevProblemMentions: r.pproblem,
      prevRatingSum: r.prsum,
    }));

    const insights = buildInsights({
      days,
      total: cur.total,
      prevTotal: prev.total,
      average: cur.average,
      prevAverage: prev.average,
      negativeCount: cur.negative,
      prevNegativeCount: prev.negative,
      categories,
    });

    return {
      days,
      thresholds: { positiveMin: b.positiveMin, negativeMax: b.negativeMax },
      totalAllTime,
      last7,
      last30,
      unreviewed,
      googleClicks: { current: clicksCur, previous: clicksPrev },
      pendingToImprove,
      current: cur,
      previous: prev,
      unit,
      series,
      categories,
      insights,
    };
  });
}
