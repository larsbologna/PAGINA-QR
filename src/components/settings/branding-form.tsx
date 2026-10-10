"use client";

import { useActionState, useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { updateBrandingAction } from "@/app/panel/[slug]/actions";
import { Field, Input, Textarea } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { Alert } from "@/components/ui/alert";
import { FeedbackFlow, type PublicBusiness } from "@/components/public/feedback-flow";
import { checkGoogleUrl } from "@/lib/google-url";
import { HEX_COLOR } from "@/lib/color";

export function BrandingForm({
  slug,
  initial,
  categories,
}: {
  slug: string;
  initial: PublicBusiness;
  categories: { id: string; name: string }[];
}) {
  const [state, action] = useActionState(updateBrandingAction.bind(null, slug), null);
  const [values, setValues] = useState({
    name: initial.name,
    brandColor: initial.brandColor,
    welcomeMessage: initial.welcomeMessage,
    thankYouMessage: initial.thankYouMessage,
    googleReviewUrl: initial.googleReviewUrl ?? "",
  });
  const [previewKey, setPreviewKey] = useState(0);
  const set = (k: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setValues((v) => ({ ...v, [k]: e.target.value }));

  const google = useMemo(() => (values.googleReviewUrl.trim() ? checkGoogleUrl(values.googleReviewUrl) : null), [values.googleReviewUrl]);
  const colorOk = HEX_COLOR.test(values.brandColor);
  const err = (k: string) => state?.fields?.[k];

  const preview: PublicBusiness = {
    ...initial,
    name: values.name || initial.name,
    brandColor: colorOk ? values.brandColor : initial.brandColor,
    welcomeMessage: values.welcomeMessage || initial.welcomeMessage,
    thankYouMessage: values.thankYouMessage || initial.thankYouMessage,
    googleReviewUrl: google?.ok ? google.url : null,
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <form action={action} className="space-y-5">
        {state?.error && <Alert tone="error">{state.error}</Alert>}
        {state?.ok && <Alert tone="success">{state.message}</Alert>}
        <Field label="Nombre público del negocio" htmlFor="name" error={err("name")}>
          <Input id="name" name="name" value={values.name} onChange={set("name")} required maxLength={80} aria-invalid={!!err("name")} />
        </Field>
        <Field label="Color principal" htmlFor="brandColor" hint="Se usa en botones y detalles de la página pública. El texto se ajusta solo para que se lea bien." error={err("brandColor") ?? (!colorOk ? "Usá el formato #RRGGBB." : undefined)}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Elegir color"
              value={colorOk ? values.brandColor : "#0f766e"}
              onChange={(e) => setValues((v) => ({ ...v, brandColor: e.target.value }))}
              className="h-10 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
            />
            <Input id="brandColor" name="brandColor" value={values.brandColor} onChange={set("brandColor")} className="max-w-36 font-mono" maxLength={7} aria-invalid={!colorOk} />
          </div>
        </Field>
        <Field label="Mensaje de bienvenida" htmlFor="welcomeMessage" hint="Ej.: ¿Cómo fue tu experiencia?" error={err("welcomeMessage")}>
          <Input id="welcomeMessage" name="welcomeMessage" value={values.welcomeMessage} onChange={set("welcomeMessage")} maxLength={120} required />
        </Field>
        <Field label="Mensaje de agradecimiento" htmlFor="thankYouMessage" error={err("thankYouMessage")}>
          <Textarea id="thankYouMessage" name="thankYouMessage" value={values.thankYouMessage} onChange={set("thankYouMessage")} maxLength={200} rows={2} required />
        </Field>
        <Field
          label="Enlace de Google (Perfil de Empresa / Maps)"
          htmlFor="googleReviewUrl"
          error={err("googleReviewUrl") ?? (google && !google.ok ? google.error : undefined)}
          hint={
            <>
              Pegá el enlace “Pedir reseñas” de tu Perfil de Empresa de Google (g.page/r/…/review), el enlace de Google Maps o el Place ID.
              Se ofrece a <strong>todos</strong> los clientes, sin importar su puntuación.
            </>
          }
        >
          <Input
            id="googleReviewUrl"
            name="googleReviewUrl"
            value={values.googleReviewUrl}
            onChange={set("googleReviewUrl")}
            placeholder="https://g.page/r/…/review"
            inputMode="url"
            maxLength={500}
            aria-invalid={!!(google && !google.ok)}
          />
        </Field>
        {google?.ok && (
          <p className="-mt-3 text-sm text-emerald-700">
            Enlace válido ({google.kind === "review" ? "abre directamente el formulario de reseña" : "abre tu perfil en Google Maps"}).{" "}
            <a href={google.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 underline">
              Probar <ExternalLink className="size-3" aria-hidden />
            </a>
          </p>
        )}
        <div className="flex gap-2">
          <SubmitButton pendingText="Guardando…" disabled={!colorOk || !!(google && !google.ok)}>Guardar cambios</SubmitButton>
        </div>
      </form>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium">Vista previa para el cliente</p>
          <button type="button" className="text-xs font-medium text-brand-700 hover:underline" onClick={() => setPreviewKey((k) => k + 1)}>
            Reiniciar
          </button>
        </div>
        <div className="mx-auto h-[640px] w-full max-w-[360px] overflow-y-auto rounded-[2rem] border-8 border-slate-900 bg-white shadow-lg">
          <FeedbackFlow key={previewKey} business={preview} categories={categories} preview />
        </div>
        <p className="mt-2 text-center text-xs text-muted">En la vista previa no se guarda ninguna opinión.</p>
      </div>
    </div>
  );
}
