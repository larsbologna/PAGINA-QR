import type { ContentGenerator } from "./generator";
import { templateGenerator } from "./templateGenerator";

// La IA se carga recién al usarla (el SDK no pesa en la carga inicial).
const aiGenerator: ContentGenerator = {
  id: "ai",
  label: "IA (Claude)",
  description: "Escribe la propuesta completa con IA usando tu propia clave. Revisá y ajustá cada texto antes de aprobar.",
  generatePlan: async (req) => (await import("../ai/planAi")).planWithAi(req),
};

// Proveedores de contenido. Las plantillas funcionan siempre y sin costo; la IA solo
// aparece habilitada cuando el usuario carga su propia clave (ver lib/ai/settings.ts).
export const GENERATORS: ContentGenerator[] = [templateGenerator, aiGenerator];

export function getGenerator(id: string): ContentGenerator {
  return GENERATORS.find((g) => g.id === id) ?? templateGenerator;
}
