"use client";

import { useActionState } from "react";
import { changePasswordAction } from "./actions";
import { Field, Input } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";

export function PasswordForm() {
  const [state, action] = useActionState(changePasswordAction, null);
  const f = state?.fields ?? {};
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.message}</Alert>}
      <Field label="Contraseña actual" htmlFor="current" error={f.current}>
        <Input id="current" name="current" type="password" autoComplete="current-password" required />
      </Field>
      <Field label="Nueva contraseña" htmlFor="next" hint="Mínimo 10 caracteres." error={f.next}>
        <Input id="next" name="next" type="password" autoComplete="new-password" required minLength={10} />
      </Field>
      <Field label="Repetí la nueva contraseña" htmlFor="confirm" error={f.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required />
      </Field>
      <SubmitButton pendingText="Guardando…">Cambiar contraseña</SubmitButton>
    </form>
  );
}
