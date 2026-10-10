import "server-only";

type Level = "info" | "warn" | "error";

/**
 * Registro técnico estructurado. Por diseño NO recibe comentarios de clientes,
 * notas, contraseñas ni tokens: solo identificadores y metadatos mínimos.
 */
export function log(level: Level, event: string, meta: Record<string, string | number | boolean | null | undefined> = {}) {
  if (process.env.NODE_ENV === "test") return;
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...meta });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export function errorMeta(err: unknown): Record<string, string> {
  if (err instanceof Error) return { error: err.name, message: err.message.slice(0, 200) };
  return { error: "unknown" };
}
