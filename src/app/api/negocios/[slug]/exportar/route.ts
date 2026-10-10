import type { NextRequest } from "next/server";
import { routeBusinessAccess } from "@/server/auth/route-access";
import { exportFeedbackCsv } from "@/server/services/export";
import { parseFeedbackFilters } from "@/lib/feedback-filters";
import { slugify } from "@/lib/slug";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await routeBusinessAccess(slug);
  if (!r) return new Response("No encontrado", { status: 404 });
  const filters = parseFeedbackFilters(Object.fromEntries(req.nextUrl.searchParams));
  const { csv } = await exportFeedbackCsv(r.access.business, filters, r.user.id);
  const date = new Date().toISOString().slice(0, 10);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="opiniones-${slugify(r.access.business.name) || "negocio"}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
