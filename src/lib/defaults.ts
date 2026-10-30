import type { ContentBrief, DesignConfig, Project } from "./types";
import { uid } from "./ids";

export interface Palette {
  id: string;
  label: string;
  background: string;
  surface: string;
  text: string;
  accent: string;
}

export const PALETTES: Palette[] = [
  { id: "noche-lima", label: "Noche lima", background: "#0b0b0c", surface: "#18181b", text: "#ffffff", accent: "#c6f432" },
  { id: "grafito-celeste", label: "Grafito celeste", background: "#0c1117", surface: "#161e28", text: "#f4f8ff", accent: "#5cc8ff" },
  { id: "negro-dorado", label: "Negro dorado", background: "#0a0908", surface: "#1a1714", text: "#fbf7ef", accent: "#e8c071" },
  { id: "violeta", label: "Violeta eléctrico", background: "#0f0a1c", surface: "#1c1430", text: "#ffffff", accent: "#b38cff" },
  { id: "coral", label: "Coral", background: "#120c0b", surface: "#22181a", text: "#fff7f4", accent: "#ff7a59" },
  { id: "crema", label: "Crema editorial", background: "#f4efe6", surface: "#e7dfd1", text: "#171513", accent: "#d9480f" },
  { id: "papel-azul", label: "Papel azul", background: "#f5f7fb", surface: "#e3e9f4", text: "#0d1b33", accent: "#2457f5" },
];

export const DEFAULT_BRIEF: ContentBrief = {
  topic: "",
  businessName: "",
  goal: "",
  audience: "",
  problem: "",
  benefit: "",
  offer: "",
  cta: "",
  tone: "directo",
  extra: "",
};

export const DEFAULT_DESIGN: DesignConfig = {
  background: PALETTES[0].background,
  surface: PALETTES[0].surface,
  text: PALETTES[0].text,
  accent: PALETTES[0].accent,
  titleFont: "bricolage",
  bodyFont: "inter",
  titleSize: 120,
  subtitleSize: 48,
  bodySize: 34,
  align: "left",
  titleCase: "upper",
  style: "bold",
  intensity: 60,
  imageStyle: "mockups",
  showFooter: true,
};

export function createProject(name = "Carrusel sin título"): Project {
  const now = Date.now();
  return {
    id: uid("p_"),
    name,
    createdAt: now,
    updatedAt: now,
    stage: "brief",
    brief: { ...DEFAULT_BRIEF },
    design: { ...DEFAULT_DESIGN },
    format: "1080x1440",
    slideCount: 10,
    slides: [],
  };
}
