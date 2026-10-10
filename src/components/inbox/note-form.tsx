"use client";

import { useActionState, useEffect, useRef } from "react";
import { addNoteAction } from "@/app/panel/[slug]/actions";
import { Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { NOTE_MAX } from "@/lib/validation";

export function NoteForm({ slug, feedbackId }: { slug: string; feedbackId: string }) {
  const [state, action] = useActionState(addNoteAction.bind(null, slug, feedbackId), null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="space-y-2">
      <label htmlFor="note-body" className="text-sm font-medium">Agregar nota interna</label>
      <Textarea
        id="note-body"
        name="body"
        rows={3}
        maxLength={NOTE_MAX}
        required
        placeholder="Ej.: Hablamos con el equipo de cocina sobre los tiempos."
        aria-invalid={!!state?.fields?.body}
      />
      {state?.fields?.body && <p className="text-sm text-red-700">{state.fields.body}</p>}
      {state?.error && <p className="text-sm text-red-700">{state.error}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">Solo la ve tu equipo. Nunca se muestra al cliente.</p>
        <SubmitButton size="sm" pendingText="Guardando…">Guardar nota</SubmitButton>
      </div>
      {state?.ok && <p role="status" className="text-sm text-emerald-700">{state.message}</p>}
    </form>
  );
}
