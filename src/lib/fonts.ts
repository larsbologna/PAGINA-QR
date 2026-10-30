// Fuentes empaquetadas con @fontsource (se sirven desde el propio sitio, así la
// exportación PNG las incrusta sin depender de Google Fonts).

export interface FontOption {
  id: string;
  label: string;
  family: string;
  /** Peso a usar en títulos. */
  titleWeight: number;
}

export const FONTS: FontOption[] = [
  { id: "bricolage", label: "Bricolage Grotesque", family: "'Bricolage Grotesque Variable', sans-serif", titleWeight: 800 },
  { id: "space", label: "Space Grotesk", family: "'Space Grotesk Variable', sans-serif", titleWeight: 700 },
  { id: "inter", label: "Inter", family: "'Inter Variable', sans-serif", titleWeight: 800 },
  { id: "sora", label: "Sora", family: "'Sora Variable', sans-serif", titleWeight: 800 },
  { id: "manrope", label: "Manrope", family: "'Manrope Variable', sans-serif", titleWeight: 800 },
  { id: "dmsans", label: "DM Sans", family: "'DM Sans Variable', sans-serif", titleWeight: 800 },
  { id: "anton", label: "Anton", family: "'Anton', sans-serif", titleWeight: 400 },
  { id: "bebas", label: "Bebas Neue", family: "'Bebas Neue', sans-serif", titleWeight: 400 },
  { id: "archivo", label: "Archivo Black", family: "'Archivo Black', sans-serif", titleWeight: 400 },
  { id: "playfair", label: "Playfair Display", family: "'Playfair Display Variable', serif", titleWeight: 800 },
];

export function getFont(id: string): FontOption {
  return FONTS.find((f) => f.id === id) ?? FONTS[0];
}
