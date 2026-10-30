import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { slugify } from "@/lib/export/filenames";

// Guarda los PNG exportados en /public/export/<proyecto>/ — solo en desarrollo local.
// En Vercel (o cualquier producción) el disco no es persistente: la ruta queda
// desactivada y el editor usa las descargas del navegador.

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function enabled(): boolean {
  if (process.env.VERCEL) return false;
  return process.env.NODE_ENV === "development" || process.env.ENABLE_LOCAL_EXPORT === "1";
}

const MAX_FILES = 10;
const MAX_BYTES = 20 * 1024 * 1024;
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export async function GET() {
  return Response.json({ enabled: enabled() });
}

export async function POST(req: Request) {
  if (!enabled()) return Response.json({ error: "El guardado en /public/export solo funciona en local." }, { status: 403 });

  const form = await req.formData();
  const folder = slugify(String(form.get("folder") ?? "carrusel"));
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length || files.length > MAX_FILES) return Response.json({ error: "Cantidad de archivos inválida." }, { status: 400 });

  // Se valida todo antes de escribir: solo nombres simples .png y contenido PNG real.
  const ready: { name: string; data: Buffer }[] = [];
  for (const file of files) {
    const name = path.basename(file.name);
    const data = Buffer.from(await file.arrayBuffer());
    if (!/^[a-z0-9-]+\.png$/.test(name) || data.length > MAX_BYTES || !data.subarray(0, 8).equals(PNG_SIGNATURE)) {
      return Response.json({ error: `Archivo no permitido: ${name}` }, { status: 400 });
    }
    ready.push({ name, data });
  }

  const dir = path.join(process.cwd(), "public", "export", folder);
  await mkdir(dir, { recursive: true });
  for (const f of ready) await writeFile(path.join(dir, f.name), f.data);
  return Response.json({ saved: ready.map((f) => `/export/${folder}/${f.name}`) });
}
