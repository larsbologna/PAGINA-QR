"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { SubmitButton } from "@/components/ui/submit-button";
import { CopyField } from "./copy-field";

/** Genera un enlace de restablecimiento de contraseña y lo muestra una vez para copiarlo. */
export function ResetLinkButton({ action, email }: { action: () => Promise<ActionState>; email: string }) {
  const [state, formAction] = useActionState(async () => action(), null);
  return (
    <div className="w-full">
      <form action={formAction}>
        <SubmitButton variant="ghost" size="sm" pendingText="Generando…">Restablecer contraseña</SubmitButton>
      </form>
      {state?.error && <p className="mt-1 text-xs text-red-700">{state.error}</p>}
      {state?.ok && state.data?.link && (
        <div className="mt-2 rounded-lg bg-slate-50 p-3">
          <CopyField label={`Enlace para ${email} — ${state.message}`} value={state.data.link} />
        </div>
      )}
    </div>
  );
}
