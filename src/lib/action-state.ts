export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  fields?: Record<string, string>;
  /** Datos extra que la acción devuelve a la interfaz (por ejemplo, un enlace de invitación). */
  data?: Record<string, string>;
} | null;
