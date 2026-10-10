"use client";

import { Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useJsonForm } from "@/lib/use-json-form";

export function ResetForm({ token }: { token: string }) {
  const { state, pending, submit } = useJsonForm("/api/auth/reset");
  const f = state.fields ?? {};
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const d = new FormData(e.currentTarget);
        submit({ token, password: d.get("password"), confirm: d.get("confirm") });
      }}
      className="space-y-4"
    >
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Contraseña nueva" htmlFor="password" hint="Mínimo 10 caracteres." error={f.password}>
        <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={10} aria-invalid={!!f.password} />
      </Field>
      <Field label="Repetí la contraseña" htmlFor="confirm" error={f.confirm}>
        <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required aria-invalid={!!f.confirm} />
      </Field>
      <Button type="submit" className="w-full" size="lg" disabled={pending} aria-busy={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Guardando…" : "Guardar y entrar"}
      </Button>
    </form>
  );
}
