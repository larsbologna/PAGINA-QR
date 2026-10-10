"use client";

import { useState } from "react";
import { Check, Copy, Download, ExternalLink, Printer } from "lucide-react";
import { buttonClass } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";

const SIZES = [
  { value: 256, label: "Pequeño · 256 px (web, WhatsApp)" },
  { value: 512, label: "Mediano · 512 px" },
  { value: 1024, label: "Grande · 1024 px (impresión hasta 8 cm)" },
  { value: 2048, label: "Muy grande · 2048 px (carteles)" },
];

export function QrTools({ slug, publicUrl, printHref }: { slug: string; publicUrl: string; printHref: string }) {
  const [size, setSize] = useState(1024);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("Contanos cómo fue tu experiencia");
  const api = `/api/negocios/${slug}/qr`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(publicUrl);
    } catch {
      const el = document.getElementById("public-url") as HTMLInputElement | null;
      el?.select();
      document.execCommand("copy");
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="public-url" className="text-sm font-medium">Enlace público</label>
        <div className="mt-1.5 flex gap-2">
          <Input id="public-url" readOnly value={publicUrl} onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={copy} className={buttonClass("secondary", "md")} aria-live="polite">
            {copied ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
            {copied ? "Copiado" : "Copiar"}
          </button>
        </div>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-brand-700 hover:underline">
          Abrir página pública <ExternalLink className="size-3.5" aria-hidden />
        </a>
      </div>

      <div>
        <label htmlFor="qr-size" className="text-sm font-medium">Tamaño del PNG</label>
        <Select id="qr-size" className="mt-1.5" value={size} onChange={(e) => setSize(Number(e.target.value))}>
          {SIZES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`${api}?formato=png&tamano=${size}&descargar=1`} className={buttonClass("primary", "md")} download>
            <Download className="size-4" aria-hidden /> Descargar PNG
          </a>
          <a href={`${api}?formato=svg&descargar=1`} className={buttonClass("secondary", "md")} download>
            <Download className="size-4" aria-hidden /> Descargar SVG (vectorial)
          </a>
        </div>
        <p className="mt-2 text-xs text-muted">El SVG no pierde calidad a ningún tamaño: es el ideal para imprenta.</p>
      </div>

      <div className="border-t border-line pt-6">
        <h3 className="text-sm font-semibold">Plantilla para imprimir</h3>
        <p className="mt-0.5 text-sm text-muted">Tarjeta A6 (10,5 × 14,8 cm) con el nombre, un mensaje y el QR.</p>
        <label htmlFor="qr-message" className="mt-3 block text-sm font-medium">Mensaje</label>
        <Input id="qr-message" className="mt-1.5" maxLength={80} value={message} onChange={(e) => setMessage(e.target.value)} />
        <div className="mt-3 flex flex-wrap gap-2">
          <a href={`${printHref}?mensaje=${encodeURIComponent(message)}`} className={buttonClass("secondary", "md")}>
            <Printer className="size-4" aria-hidden /> Ver e imprimir
          </a>
          <a href={`${api}?formato=plantilla&descargar=1&mensaje=${encodeURIComponent(message)}`} className={buttonClass("secondary", "md")} download>
            <Download className="size-4" aria-hidden /> Descargar plantilla (SVG)
          </a>
        </div>
      </div>
    </div>
  );
}
