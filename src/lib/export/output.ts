"use client";
import JSZip from "jszip";

export interface ExportedFile {
  name: string;
  blob: Blob;
}

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Descarga cada PNG por separado, con una pausa para que el navegador no las bloquee. */
export async function downloadEach(files: ExportedFile[]): Promise<void> {
  for (const f of files) {
    downloadBlob(f.blob, f.name);
    await new Promise((r) => setTimeout(r, 350));
  }
}

export async function buildZip(files: ExportedFile[]): Promise<Blob> {
  const zip = new JSZip();
  // Los PNG ya están comprimidos: STORE evita trabajo inútil.
  for (const f of files) zip.file(f.name, f.blob, { compression: "STORE" });
  return zip.generateAsync({ type: "blob" });
}

// ——— Guardado en /public/export (solo en un entorno local que lo permita) ———

export async function localSaveAvailable(): Promise<boolean> {
  try {
    const res = await fetch("/api/export", { cache: "no-store" });
    if (!res.ok) return false;
    const data = (await res.json()) as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

export async function saveToPublicExport(folder: string, files: ExportedFile[]): Promise<string[]> {
  const form = new FormData();
  form.append("folder", folder);
  for (const f of files) form.append("files", f.blob, f.name);
  const res = await fetch("/api/export", { method: "POST", body: form });
  const data = (await res.json().catch(() => ({}))) as { saved?: string[]; error?: string };
  if (!res.ok) throw new Error(data.error ?? "No se pudo guardar en el servidor.");
  return data.saved ?? [];
}
