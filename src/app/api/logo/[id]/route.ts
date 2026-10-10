import { prisma } from "@/server/db";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[a-z0-9]{10,40}$/i.test(id)) return new Response("No encontrado", { status: 404 });
  const b = await prisma.business.findUnique({ where: { id }, select: { logoData: true, logoMimeType: true } });
  if (!b?.logoData || !b.logoMimeType) return new Response("No encontrado", { status: 404 });
  return new Response(new Uint8Array(b.logoData), {
    headers: {
      "Content-Type": b.logoMimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Security-Policy": "default-src 'none'",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
