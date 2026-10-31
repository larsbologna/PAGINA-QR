// Configuración de IA de este navegador. La clave es del propio usuario (cada uno paga
// sus tokens) y se guarda solo en este navegador: nunca se sube a ningún servidor nuestro.

export const AI_MODELS = [
  { id: "claude-opus-5-5", label: "Claude Opus 5.5 (recomendado, mejor calidad)" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5 (más económico)" },
  { id: "claude-haiku-5-5", label: "Claude Haiku 5.5 (el más económico)" },
] as const;

export type AiModelId = (typeof AI_MODELS)[number]["id"];

export interface AiSettings {
  apiKey: string;
  model: AiModelId;
}

const KEY = "carrusel-studio:ai";

export function loadAiSettings(): AiSettings {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Partial<AiSettings>;
    const model = AI_MODELS.some((m) => m.id === raw.model) ? (raw.model as AiModelId) : "claude-opus-5-5";
    return { apiKey: typeof raw.apiKey === "string" ? raw.apiKey : "", model };
  } catch {
    return { apiKey: "", model: "claude-opus-5-5" };
  }
}

export function saveAiSettings(s: AiSettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* sin almacenamiento */
  }
}

export function aiConfigured(): boolean {
  return loadAiSettings().apiKey.trim().length > 0;
}
