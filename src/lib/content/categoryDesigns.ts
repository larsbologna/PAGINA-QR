import type { ContentCategory, DesignConfig } from "../types";
import { DEFAULT_DESIGN } from "../defaults";

// Diseño por defecto de cada tipo de carrusel. Se aplica al elegir el tipo mientras
// el diseño no esté personalizado; si ya lo cambiaste, se ofrece aplicarlo a mano.

const OVERRIDES: Record<ContentCategory, Partial<DesignConfig>> = {
  // Oscuro y contundente: bloques de color y mockups.
  negocio: {},
  // Editorial claro: papel crema, serif elegante, diagramas simples.
  crecimiento: {
    background: "#f4efe6",
    surface: "#e9e1d3",
    text: "#1b1916",
    accent: "#c2410c",
    titleFont: "playfair",
    bodyFont: "dmsans",
    titleCase: "normal",
    titleSize: 124,
    style: "editorial",
    intensity: 55,
    imageStyle: "diagramas",
  },
  // Frases grandes sobre un fondo con aura de color.
  motivacion: {
    background: "#0f0a1c",
    surface: "#1c1430",
    text: "#ffffff",
    accent: "#b38cff",
    titleFont: "bebas",
    bodyFont: "manrope",
    titleCase: "upper",
    titleSize: 150,
    subtitleSize: 50,
    style: "gradient",
    intensity: 75,
    imageStyle: "diagramas",
  },
  // Cálido y sobrio, pensado para acompañar fotos propias.
  proceso: {
    background: "#121110",
    surface: "#1f1c1a",
    text: "#f5f1ea",
    accent: "#ff7a59",
    titleFont: "space",
    bodyFont: "inter",
    titleCase: "normal",
    titleSize: 116,
    style: "minimal",
    intensity: 60,
    imageStyle: "fotos",
  },
  // Claro y ordenado, con grilla técnica y azul de foco.
  habitos: {
    background: "#f5f7fb",
    surface: "#e3e9f4",
    text: "#0d1b33",
    accent: "#2457f5",
    titleFont: "sora",
    bodyFont: "inter",
    titleCase: "normal",
    titleSize: 112,
    style: "tech",
    intensity: 55,
    imageStyle: "diagramas",
  },
};

export function designFor(category: ContentCategory): DesignConfig {
  return { ...DEFAULT_DESIGN, ...OVERRIDES[category] };
}

function sameDesign(a: DesignConfig, b: DesignConfig): boolean {
  return (Object.keys(DEFAULT_DESIGN) as (keyof DesignConfig)[]).every((k) => a[k] === b[k]);
}

/** El diseño no fue tocado: es el de inicio o el de algún tipo. */
export function isStockDesign(design: DesignConfig): boolean {
  return sameDesign(design, DEFAULT_DESIGN) || (Object.keys(OVERRIDES) as ContentCategory[]).some((c) => sameDesign(design, designFor(c)));
}

export function matchesCategoryDesign(design: DesignConfig, category: ContentCategory): boolean {
  return sameDesign(design, designFor(category));
}
