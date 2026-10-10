import "server-only";
import QRCode from "qrcode";
import { slugify } from "@/lib/slug";

/**
 * Generación de QR 100 % local (librería `qrcode`), sin servicios externos.
 * Nivel de corrección "Q" (~25 %) y margen de 4 módulos: robusto para impresión.
 */
const QR_OPTIONS = { errorCorrectionLevel: "Q" as const, margin: 4, color: { dark: "#000000", light: "#ffffff" } };

export const QR_SIZES = [256, 512, 1024, 2048] as const;
export type QrSize = (typeof QR_SIZES)[number];

export function parseQrSize(raw: string | null): QrSize {
  const n = Number.parseInt(raw ?? "", 10);
  return (QR_SIZES as readonly number[]).includes(n) ? (n as QrSize) : 1024;
}

export function qrPng(url: string, size: QrSize): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...QR_OPTIONS, type: "png", width: size });
}

export function qrSvg(url: string, size?: number): Promise<string> {
  return QRCode.toString(url, { ...QR_OPTIONS, type: "svg", ...(size ? { width: size } : {}) });
}

export function qrFileName(businessName: string, ext: "png" | "svg", suffix = ""): string {
  const base = slugify(businessName) || "negocio";
  return `qr-${base}${suffix ? `-${suffix}` : ""}.${ext}`;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c]!);
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else line = (line + " " + w).trim();
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

/**
 * Plantilla de impresión vectorial (tamaño A6: 105 × 148 mm) con el nombre del
 * negocio, un mensaje y el QR. Se puede imprimir directamente o enviar a imprenta.
 */
export async function printTemplateSvg(opts: { url: string; businessName: string; message: string; brandColor: string }): Promise<string> {
  const qr = QRCode.create(opts.url, { errorCorrectionLevel: "Q" });
  const n = qr.modules.size;
  const margin = 4;
  const total = n + margin * 2;
  let path = "";
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (qr.modules.get(y, x)) path += `M${x + margin} ${y + margin}h1v1h-1z`;
    }
  }
  const W = 1050, H = 1480; // unidades = 0,1 mm
  const qrSize = 700;
  const qrX = (W - qrSize) / 2, qrY = 430;
  const nameLines = wrap(opts.businessName, 24);
  const msgLines = wrap(opts.message, 30);
  const color = /^#[0-9a-fA-F]{6}$/.test(opts.brandColor) ? opts.brandColor : "#0f766e";
  const nameSvg = nameLines
    .map((l, i) => `<text x="${W / 2}" y="${150 + i * 66}" font-size="58" font-weight="700" text-anchor="middle" fill="#111827">${escapeXml(l)}</text>`)
    .join("");
  const msgSvg = msgLines
    .map((l, i) => `<text x="${W / 2}" y="${(nameLines.length > 1 ? 330 : 290) + i * 50}" font-size="42" text-anchor="middle" fill="#374151">${escapeXml(l)}</text>`)
    .join("");
  const displayUrl = opts.url.replace(/^https?:\/\//, "");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="105mm" height="148mm" viewBox="0 0 ${W} ${H}" font-family="Helvetica, Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#ffffff"/>
  <rect x="0" y="0" width="${W}" height="24" fill="${color}"/>
  ${nameSvg}
  ${msgSvg}
  <rect x="${qrX - 20}" y="${qrY - 20}" width="${qrSize + 40}" height="${qrSize + 40}" rx="24" fill="#ffffff" stroke="#e5e7eb" stroke-width="4"/>
  <svg x="${qrX}" y="${qrY}" width="${qrSize}" height="${qrSize}" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges">
    <rect width="${total}" height="${total}" fill="#ffffff"/>
    <path d="${path}" fill="#000000"/>
  </svg>
  <text x="${W / 2}" y="${qrY + qrSize + 110}" font-size="36" text-anchor="middle" fill="#374151">Escaneá el código con la cámara de tu celular</text>
  <text x="${W / 2}" y="${qrY + qrSize + 170}" font-size="30" text-anchor="middle" fill="#6b7280">${escapeXml(displayUrl)}</text>
  <rect x="0" y="${H - 24}" width="${W}" height="24" fill="${color}"/>
</svg>`;
}
