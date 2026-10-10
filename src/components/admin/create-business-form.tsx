"use client";

import { useActionState, useState } from "react";
import { createBusinessAction } from "@/app/admin/actions";
import { Field, Input, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button";
import { CopyField } from "@/components/team/copy-field";
import { INDUSTRIES } from "@/lib/industries";
import { PLAN_KEYS, PLAN_LABELS } from "@/lib/plans";
import { slugify } from "@/lib/slug";

export function CreateBusinessForm() {
  const [state, action] = useActionState(createBusinessAction, null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [industry, setIndustry] = useState("comercio");
  const f = state?.fields ?? {};

  if (state?.ok && state.data) {
    return (
      <div className="space-y-4">
        <Alert tone="success" title={state.message}>
          La página pública ya está activa y se crearon las categorías del rubro.
        </Alert>
        <CopyField label="Enlace público (QR)" value={state.data.publicUrl!} />
        {state.data.link && <CopyField label="Invitación para el dueño (se muestra una sola vez, vence en 7 días)" value={state.data.link} />}
        <div className="flex flex-wrap gap-2 pt-2">
          <ButtonLink href={`/admin/negocios/${state.data.id}`}>Ver ficha del negocio</ButtonLink>
          <ButtonLink href={`/panel/${state.data.slug}/qr`} variant="secondary">Descargar QR</ButtonLink>
          <ButtonLink href={`/panel/${state.data.slug}/configuracion`} variant="secondary">Personalizar</ButtonLink>
          {/* Recarga completa para empezar con un formulario limpio. */}
          <button type="button" onClick={() => window.location.assign("/admin/negocios/nuevo")} className="inline-flex h-10 items-center px-3 text-sm font-medium text-slate-600 hover:underline">
            Crear otro
          </button>
        </div>
      </div>
    );
  }

  const preset = INDUSTRIES.find((i) => i.id === industry);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <Field label="Nombre del negocio" htmlFor="name" error={f.name}>
        <Input id="name" name="name" required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!f.name} />
      </Field>
      <Field label="Identificador de la URL (opcional)" htmlFor="slug" error={f.slug} hint={`Quedará: /r/${slug || slugify(name) || "nombre-del-negocio"}. Si lo dejás vacío se genera solo.`}>
        <Input id="slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase())} placeholder={slugify(name)} maxLength={60} aria-invalid={!!f.slug} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Rubro" htmlFor="industry" hint={preset ? `Categorías: ${preset.categories.join(", ")}` : undefined}>
          <Select id="industry" name="industry" value={industry} onChange={(e) => setIndustry(e.target.value)}>
            {INDUSTRIES.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
          </Select>
        </Field>
        <Field label="Plan" htmlFor="plan">
          <Select id="plan" name="plan" defaultValue="BASICO">
            {PLAN_KEYS.map((p) => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
          </Select>
        </Field>
      </div>
      <Field label="Enlace de Google (opcional)" htmlFor="googleReviewUrl" error={f.googleReviewUrl} hint="Enlace “Pedir reseñas” del Perfil de Empresa, de Google Maps o Place ID. Se puede cargar después.">
        <Input id="googleReviewUrl" name="googleReviewUrl" inputMode="url" placeholder="https://g.page/r/…/review" aria-invalid={!!f.googleReviewUrl} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Email del dueño (opcional)" htmlFor="ownerEmail" error={f.ownerEmail} hint="Se genera un enlace de invitación para que cree su acceso.">
          <Input id="ownerEmail" name="ownerEmail" type="email" aria-invalid={!!f.ownerEmail} />
        </Field>
        <Field label="Email de contacto interno (opcional)" htmlFor="contactEmail" error={f.contactEmail}>
          <Input id="contactEmail" name="contactEmail" type="email" aria-invalid={!!f.contactEmail} />
        </Field>
      </div>
      <SubmitButton pendingText="Creando…">Crear negocio</SubmitButton>
    </form>
  );
}
