"use client";

import { useActionState } from "react";
import { updateThresholdsAction } from "@/app/panel/[slug]/actions";
import { Field, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";

export function ThresholdsForm({ slug, positiveMin, negativeMax }: { slug: string; positiveMin: number; negativeMax: number }) {
  const [state, action] = useActionState(updateThresholdsAction.bind(null, slug), null);
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.message}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Positiva desde" htmlFor="positiveMin">
          <Select id="positiveMin" name="positiveMin" defaultValue={positiveMin}>
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} estrellas o más</option>)}
          </Select>
        </Field>
        <Field label="Negativa hasta" htmlFor="negativeMax">
          <Select id="negativeMax" name="negativeMax" defaultValue={negativeMax}>
            {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} {n === 1 ? "estrella" : "estrellas"} o menos</option>)}
          </Select>
        </Field>
      </div>
      <p className="text-xs text-muted">Lo que queda en el medio se cuenta como neutral. Solo cambia cómo se agrupan las estadísticas, nunca las opiniones.</p>
      <SubmitButton variant="secondary" pendingText="Guardando…">Guardar criterios</SubmitButton>
    </form>
  );
}
