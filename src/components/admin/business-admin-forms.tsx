"use client";

import { useActionState } from "react";
import { deleteBusinessAction, setPlanAction, updateBusinessAdminAction } from "@/app/admin/actions";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { INDUSTRIES } from "@/lib/industries";
import { PLAN_KEYS, PLAN_LABELS } from "@/lib/plans";

export interface AdminBusinessData {
  id: string;
  name: string;
  slug: string;
  industry: string;
  contactEmail: string | null;
  internalNotes: string | null;
  googleReviewUrl: string | null;
  retentionMonths: number;
  plan: string;
}

export function AdminDataForm({ b }: { b: AdminBusinessData }) {
  const [state, action] = useActionState(updateBusinessAdminAction.bind(null, b.id), null);
  const f = state?.fields ?? {};
  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.message}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nombre" htmlFor="name" error={f.name}>
          <Input id="name" name="name" defaultValue={b.name} required maxLength={80} />
        </Field>
        <Field label="Identificador de URL" htmlFor="slug" error={f.slug} hint="Si lo cambiás, la URL anterior (y los QR impresos) redirige a la nueva.">
          <Input id="slug" name="slug" defaultValue={b.slug} required maxLength={60} />
        </Field>
        <Field label="Rubro" htmlFor="industry">
          <Select id="industry" name="industry" defaultValue={b.industry}>
            {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </Select>
        </Field>
        <Field label="Conservación de opiniones (meses)" htmlFor="retentionMonths" error={f.retentionMonths}>
          <Input id="retentionMonths" name="retentionMonths" type="number" min={1} max={120} defaultValue={b.retentionMonths} required />
        </Field>
        <Field label="Enlace de Google" htmlFor="googleReviewUrl" error={f.googleReviewUrl} className="sm:col-span-2">
          <Input id="googleReviewUrl" name="googleReviewUrl" defaultValue={b.googleReviewUrl ?? ""} inputMode="url" />
        </Field>
        <Field label="Email de contacto" htmlFor="contactEmail" error={f.contactEmail}>
          <Input id="contactEmail" name="contactEmail" type="email" defaultValue={b.contactEmail ?? ""} />
        </Field>
        <Field label="Notas internas del servicio" htmlFor="internalNotes" hint="Solo visibles para el superadministrador." className="sm:col-span-2">
          <Textarea id="internalNotes" name="internalNotes" rows={3} maxLength={2000} defaultValue={b.internalNotes ?? ""} />
        </Field>
      </div>
      <SubmitButton pendingText="Guardando…">Guardar datos</SubmitButton>
    </form>
  );
}

export function PlanForm({ id, plan }: { id: string; plan: string }) {
  const [state, action] = useActionState(setPlanAction.bind(null, id), null);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.message}</Alert>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Plan" htmlFor="plan">
          <Select id="plan" name="plan" defaultValue={plan}>
            {PLAN_KEYS.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
          </Select>
        </Field>
        <Field label="Vencimiento (opcional)" htmlFor="endsAt">
          <Input id="endsAt" name="endsAt" type="date" />
        </Field>
      </div>
      <SubmitButton variant="secondary" pendingText="Guardando…">Asignar plan</SubmitButton>
    </form>
  );
}

export function DeleteBusinessForm({ id, slug }: { id: string; slug: string }) {
  const [state, action] = useActionState(deleteBusinessAction.bind(null, id), null);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label={<>Para eliminar el negocio y <strong>todas</strong> sus opiniones, notas y configuraciones, escribí <code className="rounded bg-slate-100 px-1">{slug}</code></>} htmlFor="confirm">
        <Input id="confirm" name="confirm" autoComplete="off" required />
      </Field>
      <SubmitButton variant="danger" pendingText="Eliminando…">Eliminar definitivamente</SubmitButton>
    </form>
  );
}
