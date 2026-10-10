import { NextResponse, type NextRequest } from "next/server";
import { submitFeedback } from "@/server/services/feedback";
import { AppError, HTTP_STATUS } from "@/server/errors";
import { clientIpFrom } from "@/server/request";
import { log, errorMeta } from "@/server/logger";

const MAX_BODY = 8 * 1024;

export async function POST(req: NextRequest) {
  // Rechaza envíos desde otros sitios (el formulario siempre es same-origin).
  const origin = req.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.get("host")) {
        return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
      }
    } catch {
      return NextResponse.json({ error: "Origen no permitido." }, { status: 403 });
    }
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return NextResponse.json({ error: "Formato no admitido." }, { status: 415 });
  }
  const raw = await req.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "El envío es demasiado grande." }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Datos inválidos." }, { status: 400 });
  }
  try {
    const result = await submitFeedback(body as Parameters<typeof submitFeedback>[0], clientIpFrom(req.headers));
    return NextResponse.json({ ok: true, duplicate: result.duplicate }, { status: result.duplicate ? 200 : 201 });
  } catch (e) {
    if (e instanceof AppError) return NextResponse.json({ error: e.message }, { status: HTTP_STATUS[e.code] });
    log("error", "feedback.submit_failed", errorMeta(e));
    return NextResponse.json({ error: "No pudimos guardar tu opinión. Probá de nuevo en unos minutos." }, { status: 500 });
  }
}
