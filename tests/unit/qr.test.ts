import { describe, expect, it } from "vitest";
import { PNG } from "pngjs";
import jsQR from "jsqr";
import { qrPng, qrSvg, printTemplateSvg, qrFileName, parseQrSize } from "@/server/services/qr";

function decode(png: Buffer): string | null {
  const img = PNG.sync.read(png);
  return jsQR(new Uint8ClampedArray(img.data), img.width, img.height)?.data ?? null;
}

describe("generador de QR", () => {
  const url = "https://reputacion.test/r/cafe-la-esquina";

  it.each([256, 512, 1024, 2048] as const)("el PNG de %ipx se escanea y apunta a la URL pública", async (size) => {
    const png = await qrPng(url, size);
    const img = PNG.sync.read(png);
    expect(img.width).toBe(size);
    expect(decode(png)).toBe(url);
  });

  it("genera SVG válido y plantilla de impresión con el nombre escapado", async () => {
    const svg = await qrSvg(url);
    expect(svg).toContain("<svg");
    const tpl = await printTemplateSvg({ url, businessName: "Café <Malicioso> & Cía", message: "Contanos cómo fue tu experiencia", brandColor: "#0f766e" });
    expect(tpl).toContain("Café &lt;Malicioso&gt; &amp; Cía");
    expect(tpl).not.toContain("<Malicioso>");
    expect(tpl).toContain('width="105mm"');
  });

  it("nombra los archivos con el nombre del negocio y valida tamaños", () => {
    expect(qrFileName("Café La Esquina", "png", "1024")).toBe("qr-cafe-la-esquina-1024.png");
    expect(parseQrSize("99999")).toBe(1024);
    expect(parseQrSize("512")).toBe(512);
  });
});
