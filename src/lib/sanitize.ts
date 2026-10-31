import DOMPurify from "dompurify";

// Todo SVG que no escribimos nosotros (generado por IA, importado, o que viene dentro
// de un proyecto .json) pasa por acá antes de dibujarse: se quitan scripts, eventos,
// estilos y enlaces externos. Solo quedan formas, texto, degradados y filtros.

let configured = false;

function purifier() {
  if (!configured) {
    DOMPurify.addHook("afterSanitizeAttributes", (node) => {
      for (const attr of ["href", "xlink:href"]) {
        const v = node.getAttribute?.(attr);
        if (v && !v.startsWith("#") && !/^data:image\/(png|jpe?g|webp|gif);base64,/i.test(v)) node.removeAttribute(attr);
      }
    });
    configured = true;
  }
  return DOMPurify;
}

const OPTIONS = {
  USE_PROFILES: { svg: true, svgFilters: true },
  FORBID_TAGS: ["foreignObject", "script", "style", "iframe", "a"],
  FORBID_ATTR: ["style"],
};

/** Devuelve un <svg> completo y seguro, o "" si no hay un SVG válido. */
export function sanitizeSvg(markup: string): string {
  if (typeof window === "undefined") return "";
  const clean = purifier().sanitize(markup, OPTIONS) as unknown as string;
  return /^\s*<svg[\s>]/i.test(clean) ? clean.trim() : "";
}

/** Sanea el contenido interno de un SVG (lo que va entre <svg> y </svg>). */
export function sanitizeSvgFragment(body: string): string {
  if (typeof window === "undefined") return "";
  const wrapped = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg">${body}</svg>`);
  return wrapped.replace(/^<svg[^>]*>/i, "").replace(/<\/svg>\s*$/i, "");
}
