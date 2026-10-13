import { NextResponse, type NextRequest } from "next/server";
import { recordGoogleClick } from "@/server/services/feedback";
import { clientIpFrom, isSameOrigin } from "@/server/request";
import { log, errorMeta } from "@/server/logger";

/** Recibe el aviso (navigator.sendBeacon) de un clic en "Dejar reseña en Google". */
export async function POST(req: NextRequest) {
  if (!isSameOrigin(req.headers)) return new NextResponse(null, { status: 403 });
  const raw = await req.text();
  if (raw.length > 500) return new NextResponse(null, { status: 413 });
  try {
    const { slug } = JSON.parse(raw) as { slug?: string };
    await recordGoogleClick(String(slug ?? ""), clientIpFrom(req.headers));
  } catch (e) {
    log("warn", "google_click.failed", errorMeta(e));
  }
  return new NextResponse(null, { status: 204 });
}
