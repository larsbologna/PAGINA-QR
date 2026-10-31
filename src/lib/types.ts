// Modelo de datos del generador. Todo lo que se guarda o se exporta pasa por estos tipos.

export type FormatId = "1080x1440" | "1080x1350";

/** Tipo de contenido del carrusel: define estructura, textos sugeridos y visuales. */
export type ContentCategory = "negocio" | "crecimiento" | "motivacion" | "proceso" | "habitos";

export type Tone = "profesional" | "directo" | "educativo" | "persuasivo" | "cercano";

export type Align = "left" | "center" | "right";

export type VisualStyle = "minimal" | "bold" | "editorial" | "tech" | "gradient";

export type ImageStyle = "mockups" | "3d" | "diagramas" | "capturas" | "graficos" | "fotos";

export type TitleCase = "upper" | "normal";

/** Papel narrativo de cada slide dentro del carrusel. */
export type SlideRole = "hook" | "problem" | "example" | "how" | "proof" | "tip" | "cta";

/** Elemento visual que acompaña al texto. Los componentes viven en components/visuals. */
export type VisualKind =
  | "none"
  | "photo"
  | "phone"
  | "stats"
  | "steps"
  | "comparison"
  | "checklist"
  | "quote"
  | "qr"
  | "chat"
  | "review"
  | "cta-button"
  // Biblioteca ampliada
  | "blocks"
  | "icon-hero"
  | "big-number"
  | "progress"
  | "donut"
  | "line-chart"
  | "habit-tracker"
  | "timeline"
  | "pyramid"
  | "funnel"
  | "matrix"
  | "cycle"
  | "venn"
  | "do-dont"
  | "myth-fact"
  | "table"
  | "post"
  | "notifications"
  | "sticky-notes"
  | "polaroid"
  | "svg"
  // Visuales de la plantilla de Google Maps
  | "store-contrast"
  | "maps-compare"
  | "maps-search"
  | "presence-mix"
  | "qr-stand"
  | "review-reply"
  | "whatsapp-chat"
  | "photo-reviews";

export interface Visual {
  kind: VisualKind;
  /** Textos y valores propios de cada visual (etiquetas, cifras de ejemplo, etc.). */
  props: Record<string, string>;
  /** Imagen subida por el usuario (data URL). Se usa en "photo" y como fondo opcional. */
  image?: string;
}

export interface SlideOverrides {
  background?: string;
  text?: string;
  accent?: string;
  align?: Align;
  /** Multiplicador sobre el tamaño de títulos del diseño general (0.6 a 1.4). */
  titleScale?: number;
  /** Multiplicador sobre subtítulos y textos de apoyo. */
  textScale?: number;
}

export interface Slide {
  id: string;
  role: SlideRole;
  title: string;
  subtitle: string;
  body: string;
  visual: Visual;
  overrides: SlideOverrides;
}

export interface ContentBrief {
  /** Vacío hasta que se elige el tipo de carrusel. */
  category: ContentCategory | "";
  topic: string;
  businessName: string;
  goal: string;
  audience: string;
  problem: string;
  benefit: string;
  offer: string;
  cta: string;
  tone: Tone;
  extra: string;
}

export interface DesignConfig {
  background: string;
  surface: string;
  text: string;
  accent: string;
  titleFont: string;
  bodyFont: string;
  /** Tamaño de referencia del título en px de exportación. */
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  align: Align;
  titleCase: TitleCase;
  style: VisualStyle;
  /** 0 a 100: cuánto pesan los elementos decorativos. */
  intensity: number;
  imageStyle: ImageStyle;
  /** Nombre y numeración discretos en el margen inferior. */
  showFooter: boolean;
}

/** brief: cargando datos · plan: revisando la propuesta · edit: slides aprobados. */
export type ProjectStage = "brief" | "plan" | "edit";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  stage: ProjectStage;
  brief: ContentBrief;
  design: DesignConfig;
  format: FormatId;
  slideCount: number;
  slides: Slide[];
  /** Cuántas veces se volvió a proponer (cada versión cambia diseño, visuales y textos). */
  proposalVersion?: number;
}
