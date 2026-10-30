import type { ContentGenerator } from "./generator";
import { templateGenerator } from "./templateGenerator";

// Proveedores de contenido disponibles. Hoy solo plantillas: no hay ninguna API de IA
// configurada. Para sumar una, implementá ContentGenerator (por ejemplo llamando a una
// ruta /api/generate que use la clave guardada en una variable de entorno del servidor)
// y agregala a esta lista. La interfaz la muestra sola.
export const GENERATORS: ContentGenerator[] = [templateGenerator];

export function getGenerator(id: string): ContentGenerator {
  return GENERATORS.find((g) => g.id === id) ?? templateGenerator;
}
