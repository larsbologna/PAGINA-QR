"use client";
import { getFontEmbedCSS, toBlob } from "html-to-image";
import type { Format } from "../formats";

// Captura de slides con html-to-image: copia el DOM real a un SVG y lo pinta en un
// canvas del tamaño exacto del formato. Usa las mismas fuentes, sombras y SVG que la
// vista previa, por eso es lo más fiel al editor.

/** Espera a que las fuentes del slide estén listas y a que se asienten las medidas. */
export async function settle(families: string[]): Promise<void> {
  if (typeof document === "undefined") return;
  await Promise.all(
    families.flatMap((f) => [document.fonts.load(`400 40px ${f}`), document.fonts.load(`700 40px ${f}`), document.fonts.load(`800 40px ${f}`)]),
  ).catch(() => undefined);
  await document.fonts.ready;
  // Dos cuadros: uno para el ajuste de textos y otro para que los visuales se reescalen.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  await new Promise((r) => setTimeout(r, 60));
}

export class SlideCapturer {
  private fontCSS: string | null = null;

  constructor(private format: Format) {}

  async capture(node: HTMLElement): Promise<Blob> {
    const { width, height } = this.format;
    // El CSS de fuentes se arma una vez (solo las familias usadas) y se reutiliza.
    // Sin preferredFontFormat: ese filtro descarta las fuentes variables, que se
    // declaran como format("woff2-variations"), y el PNG saldría con otra tipografía.
    if (this.fontCSS === null) this.fontCSS = await getFontEmbedCSS(node);
    const blob = await toBlob(node, {
      width,
      height,
      canvasWidth: width,
      canvasHeight: height,
      pixelRatio: 1,
      skipAutoScale: true,
      cacheBust: false,
      fontEmbedCSS: this.fontCSS,
      type: "image/png",
    });
    if (!blob) throw new Error("No se pudo generar la imagen.");
    return blob;
  }
}
