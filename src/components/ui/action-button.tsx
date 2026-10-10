"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { SubmitButton } from "./submit-button";

/** Botón que ejecuta una acción del servidor y muestra su error, si lo hay. */
export function ActionButton({
  action,
  children,
  pendingText,
  variant = "ghost",
  confirmText,
}: {
  action: () => Promise<ActionState | void>;
  children: React.ReactNode;
  pendingText?: string;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  confirmText?: string;
}) {
  const [state, formAction] = useActionState(async () => (await action()) ?? { ok: true }, null);
  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
      className="inline-flex flex-col items-end"
    >
      <SubmitButton variant={variant} size="sm" pendingText={pendingText}>
        {children}
      </SubmitButton>
      {state?.error && <p role="alert" className="mt-1 max-w-56 text-right text-xs text-red-700">{state.error}</p>}
    </form>
  );
}
