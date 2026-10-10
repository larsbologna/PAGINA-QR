"use client";

import { Loader2 } from "lucide-react";
import { Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { useJsonForm } from "@/lib/use-json-form";

export function LoginForm({ next }: { next?: string }) {
  const { state, pending, submit } = useJsonForm("/api/auth/login");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        submit({ email: f.get("email"), password: f.get("password"), next: next ?? "" });
      }}
      className="space-y-4"
      noValidate
    >
      {state.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required inputMode="email" />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      <Button type="submit" className="w-full" size="lg" disabled={pending} aria-busy={pending}>
        {pending && <Loader2 className="size-4 animate-spin" aria-hidden />}
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}
