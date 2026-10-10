"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/action-state";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { CopyField } from "./copy-field";

export function InviteForm({ action, allowOwner = true }: { action: (prev: ActionState, form: FormData) => Promise<ActionState>; allowOwner?: boolean }) {
  const [state, formAction] = useActionState(action, null);
  return (
    <div className="space-y-4">
      <form action={formAction} className="grid gap-3 sm:grid-cols-[1fr_180px_auto] sm:items-start sm:[&>button]:mt-7">
        <Field label="Email" htmlFor="invite-email" error={state?.fields?.email}>
          <Input id="invite-email" name="email" type="email" required placeholder="persona@negocio.com" aria-invalid={!!state?.fields?.email} />
        </Field>
        <Field label="Rol" htmlFor="invite-role" hint="Administrador también configura el negocio y su equipo.">
          <Select id="invite-role" name="role" defaultValue="MEMBER">
            <option value="MEMBER">Miembro</option>
            {allowOwner && <option value="OWNER">Administrador</option>}
          </Select>
        </Field>
        <SubmitButton pendingText="Creando…">Crear invitación</SubmitButton>
      </form>
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && state.data?.link && (
        <Alert tone="success" title={state.message}>
          <div className="mt-2">
            <CopyField label="Enlace de invitación (se muestra una sola vez)" value={state.data.link} />
          </div>
        </Alert>
      )}
    </div>
  );
}
