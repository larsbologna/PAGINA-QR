import type { ContentBrief, ImageStyle, Slide } from "../types";

export interface PlanRequest {
  brief: ContentBrief;
  count: number;
  imageStyle: ImageStyle;
  /** Número de versión: 0 la primera vez; cada «proponer de nuevo» suma uno y cambia el enfoque. */
  version?: number;
  /** Títulos de la propuesta anterior, para no repetirlos. */
  previousTitles?: string[];
}

/**
 * Cualquier fuente de contenido (plantillas hoy, una API de IA mañana) implementa
 * esta interfaz. El editor solo conoce ContentGenerator, así que sumar IA es
 * agregar un proveedor nuevo en providers.ts sin tocar la interfaz.
 */
export interface ContentGenerator {
  id: string;
  label: string;
  /** Qué hace realmente, mostrado en la interfaz sin exagerar. */
  description: string;
  generatePlan(req: PlanRequest): Promise<Slide[]>;
}
