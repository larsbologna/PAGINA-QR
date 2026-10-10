"use client";

import { useActionState } from "react";
import { removeLogoAction, uploadLogoAction } from "@/app/panel/[slug]/actions";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { BusinessLogo } from "@/components/business-logo";

export function LogoForm({ slug, name, logoUrl, color }: { slug: string; name: string; logoUrl: string | null; color: string }) {
  const [state, action] = useActionState(uploadLogoAction.bind(null, slug), null);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <BusinessLogo name={name} logoUrl={logoUrl} color={color} size={80} className="border border-line" />
      <div className="flex-1 space-y-3">
        {state?.error && <Alert tone="error">{state.error}</Alert>}
        {state?.ok && <Alert tone="success">{state.message}</Alert>}
        <form action={action} className="flex flex-wrap items-center gap-2">
          <label htmlFor="logo" className="sr-only">Archivo de logo</label>
          <input
            id="logo"
            name="logo"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            required
            className="block w-full max-w-xs text-sm file:mr-3 file:rounded-lg file:border file:border-line file:bg-white file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-slate-50"
          />
          <SubmitButton variant="secondary" pendingText="Subiendo…">Subir logo</SubmitButton>
        </form>
        <p className="text-xs text-muted">PNG, JPG o WEBP de hasta 512 KB. Ideal: cuadrado, 512 × 512 px, con fondo blanco o transparente.</p>
        {logoUrl && (
          <form action={removeLogoAction.bind(null, slug)}>
            <SubmitButton variant="ghost" size="sm" pendingText="Quitando…">Quitar logo</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
