"use client";

import { useState } from "react";

export interface JsonFormState {
  error?: string;
  fields?: Record<string, string>;
}

/** Envía un formulario como JSON a un endpoint y, si responde redirectTo, hace una carga completa. */
export function useJsonForm(endpoint: string) {
  const [state, setState] = useState<JsonFormState>({});
  const [pending, setPending] = useState(false);

  async function submit(data: Record<string, unknown>) {
    if (pending) return;
    setPending(true);
    setState({});
    try {
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = (await res.json().catch(() => ({}))) as { redirectTo?: string; error?: string; fields?: Record<string, string> };
      if (res.ok && json.redirectTo) {
        window.location.assign(json.redirectTo);
        return; // queda "pendiente" mientras navega
      }
      setState({ error: json.error ?? (json.fields ? undefined : "No se pudo completar la operación."), fields: json.fields });
    } catch {
      setState({ error: "No hay conexión con el servidor. Probá de nuevo." });
    }
    setPending(false);
  }
  return { state, pending, submit };
}
