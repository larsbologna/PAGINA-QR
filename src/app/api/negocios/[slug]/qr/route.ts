import type { NextRequest } from "next/server";
import { routeBusinessAccess } from "@/server/auth/route-access";
import { publicFeedbackUrl } from "@/server/config";
import { parseQrSize, printTemplateSvg, qrFileName, qrPng, qrSvg } from "@/server/services/qr";

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const r = await routeBusinessAccess(slug);
  if (!r) return new Response("No encontrado", { status: 404 });
  const b = r.access.business;
  const url = publicFeedbackUrl(b.slug);
  const sp = req.nextUrl.searchParams;
  const format = sp.get("formato");
  const download = sp.get("descargar") === "1";
  const headers = (type: string, name: string): HeadersInit => ({
    "Content-Type": type,
    "Cache-Control": "private, no-store",
    ...(download ? { "Content-Disposition": `attachment; filename="${name}"` } : {}),
  });

  if (format === "svg") {
    return new Response(await qrSvg(url), { headers: headers("image/svg+xml", qrFileName(b.name, "svg")) });
  }
  if (format === "plantilla") {
    const message = (sp.get("mensaje") ?? "").trim().slice(0, 80) || "Contanos cómo fue tu experiencia";
    const svg = await printTemplateSvg({ url, businessName: b.name, message, brandColor: b.brandColor });
    return new Response(svg, { headers: headers("image/svg+xml", qrFileName(b.name, "svg", "plantilla-impresion")) });
  }
  const size = parseQrSize(sp.get("tamano"));
  const png = await qrPng(url, size);
  return new Response(new Uint8Array(png), { headers: headers("image/png", qrFileName(b.name, "png", String(size))) });
}
