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

export interface Look {
  name: string;
  design: Partial<DesignConfig>;
}

// Diseños alternativos por tipo: al volver a proponer se rota entre el principal y estos.
const ALT_LOOKS: Record<ContentCategory, Look[]> = {
  negocio: [
    {
      name: "Papel azul",
      design: { background: "#f5f7fb", surface: "#e3e9f4", text: "#0d1b33", accent: "#2457f5", titleFont: "sora", bodyFont: "inter", titleCase: "normal", titleSize: 112, style: "minimal", intensity: 55, imageStyle: "diagramas" },
    },
    {
      name: "Negro dorado",
      design: { background: "#0a0908", surface: "#1a1714", text: "#fbf7ef", accent: "#e8c071", titleFont: "playfair", bodyFont: "dmsans", titleCase: "normal", titleSize: 118, style: "editorial", intensity: 60, imageStyle: "mockups" },
    },
  ],
  crecimiento: [
    {
      name: "Verde calma",
      design: { background: "#0f1714", surface: "#18241f", text: "#f1f7f3", accent: "#8fd9a8", titleFont: "manrope", bodyFont: "inter", titleCase: "normal", titleSize: 116, style: "minimal", intensity: 55, imageStyle: "diagramas" },
    },
    {
      name: "Aura lavanda",
      design: { background: "#f6f2fb", surface: "#e9e1f4", text: "#1f1530", accent: "#7c3aed", titleFont: "sora", bodyFont: "dmsans", titleCase: "normal", titleSize: 112, style: "gradient", intensity: 65, imageStyle: "graficos" },
    },
  ],
  motivacion: [
    {
      name: "Negro coral",
      design: { background: "#0c0a0a", surface: "#1c1716", text: "#ffffff", accent: "#ff7a59", titleFont: "anton", bodyFont: "inter", titleCase: "upper", titleSize: 140, subtitleSize: 48, style: "bold", intensity: 70, imageStyle: "diagramas" },
    },
    {
      name: "Crema clásica",
      design: { background: "#f4efe6", surface: "#e9e1d3", text: "#1b1916", accent: "#b45309", titleFont: "playfair", bodyFont: "dmsans", titleCase: "normal", titleSize: 130, subtitleSize: 46, style: "editorial", intensity: 50, imageStyle: "diagramas" },
    },
  ],
  proceso: [
    {
      name: "Libreta",
      design: { background: "#f7f4ee", surface: "#ebe5d9", text: "#1c1a17", accent: "#2563eb", titleFont: "dmsans", bodyFont: "inter", titleCase: "normal", titleSize: 112, style: "minimal", intensity: 55, imageStyle: "fotos" },
    },
    {
      name: "Noche técnica",
      design: { background: "#0c1117", surface: "#161e28", text: "#f4f8ff", accent: "#5cc8ff", titleFont: "space", bodyFont: "inter", titleCase: "normal", titleSize: 114, style: "tech", intensity: 60, imageStyle: "diagramas" },
    },
  ],
  habitos: [
    {
      name: "Lima enérgico",
      design: { background: "#0b0b0c", surface: "#18181b", text: "#ffffff", accent: "#c6f432", titleFont: "bricolage", bodyFont: "inter", titleCase: "upper", titleSize: 116, style: "bold", intensity: 60, imageStyle: "diagramas" },
    },
    {
      name: "Menta suave",
      design: { background: "#f2f8f5", surface: "#e0eee7", text: "#0f2a1f", accent: "#059669", titleFont: "manrope", bodyFont: "inter", titleCase: "normal", titleSize: 112, style: "minimal", intensity: 50, imageStyle: "graficos" },
    },
  ],
};

const MAIN_LOOK_NAME: Record<ContentCategory, string> = {
  negocio: "Oscuro lima",
  crecimiento: "Editorial crema",
  motivacion: "Aura violeta",
  proceso: "Cálido sobrio",
  habitos: "Azul ordenado",
};

/** Diseños disponibles para un tipo: el principal primero. */
export function looksFor(category: ContentCategory): { name: string; design: DesignConfig }[] {
  return [
    { name: MAIN_LOOK_NAME[category], design: designFor(category) },
    ...ALT_LOOKS[category].map((l) => ({ name: l.name, design: { ...DEFAULT_DESIGN, ...l.design } })),
  ];
}

/** Diseño de la versión N de la propuesta (rota entre los diseños del tipo). */
export function lookFor(category: ContentCategory, version: number): { name: string; design: DesignConfig } {
  const looks = looksFor(category);
  return looks[((version % looks.length) + looks.length) % looks.length];
}

export function designFor(category: ContentCategory): DesignConfig {
  return { ...DEFAULT_DESIGN, ...OVERRIDES[category] };
}

function sameDesign(a: DesignConfig, b: DesignConfig): boolean {
  return (Object.keys(DEFAULT_DESIGN) as (keyof DesignConfig)[]).every((k) => a[k] === b[k]);
}

/** El diseño no fue tocado: es el de inicio o alguno de los diseños de los tipos. */
export function isStockDesign(design: DesignConfig): boolean {
  return sameDesign(design, DEFAULT_DESIGN) || (Object.keys(OVERRIDES) as ContentCategory[]).some((c) => looksFor(c).some((l) => sameDesign(design, l.design)));
}

/** El diseño es uno de los del tipo (el principal o una alternativa). */
export function matchesCategoryDesign(design: DesignConfig, category: ContentCategory): boolean {
  return looksFor(category).some((l) => sameDesign(design, l.design));
}
