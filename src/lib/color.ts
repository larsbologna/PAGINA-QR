export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

export function relativeLuminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Color de texto (blanco o casi negro) con mejor contraste sobre el color de marca. */
export function textOnColor(hex: string): string {
  if (!HEX_COLOR.test(hex)) return "#ffffff";
  return contrastRatio(hex, "#ffffff") >= contrastRatio(hex, "#111827") ? "#ffffff" : "#111827";
}

/** Oscurece un color hasta que tenga contraste AA (4.5:1) sobre blanco. */
export function accessibleOnWhite(hex: string): string {
  if (!HEX_COLOR.test(hex)) return "#0f766e";
  let n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  for (let i = 0; i < 20; i++) {
    const current = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
    if (contrastRatio(current, "#ffffff") >= 4.5) return current;
    r = Math.floor(r * 0.88); g = Math.floor(g * 0.88); b = Math.floor(b * 0.88);
    n = (r << 16) | (g << 8) | b;
  }
  return `#${n.toString(16).padStart(6, "0")}`;
}
