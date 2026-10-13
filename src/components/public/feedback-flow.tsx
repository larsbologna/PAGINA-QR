"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Loader2, Star } from "lucide-react";
import { BusinessLogo } from "@/components/business-logo";
import { RATING_LABELS } from "@/lib/rating";
import { COMMENT_MAX } from "@/lib/validation";
import { textOnColor, accessibleOnWhite } from "@/lib/color";
import { cn } from "@/lib/cn";

export interface PublicBusiness {
  name: string;
  slug: string;
  logoUrl: string | null;
  brandColor: string;
  welcomeMessage: string;
  thankYouMessage: string;
  googleReviewUrl: string | null;
  isDemo: boolean;
}

/**
 * Pasos del recorrido:
 *  rate   → el cliente elige de 1 a 5 estrellas.
 *  google → (5 estrellas y enlace configurado) botón para continuar a Google Maps.
 *  form   → (1 a 4 estrellas, o si eligió comentar en privado) comentario, motivos y contacto opcional.
 *  done   → confirmación.
 */
type Step = "rate" | "google" | "form" | "done";

function newSubmissionKey(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function FeedbackFlow({
  business,
  categories,
  preview = false,
}: {
  business: PublicBusiness;
  categories: { id: string; name: string }[];
  /** En modo vista previa no se envía nada al servidor. */
  preview?: boolean;
}) {
  const [step, setStep] = useState<Step>("rate");
  const [rating, setRating] = useState<number | null>(null);
  const [hover, setHover] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [wantsContact, setWantsContact] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submissionKey = useRef<string>("");
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    submissionKey.current = newSubmissionKey();
  }, []);

  useEffect(() => {
    if (step !== "rate") headingRef.current?.focus();
  }, [step]);

  const brand = business.brandColor;
  const brandText = textOnColor(brand);
  const brandOnWhite = accessibleOnWhite(brand);
  const google = business.googleReviewUrl;

  function choose(value: number) {
    setRating(value);
    setError(null);
    // Pequeña pausa para que se vea la animación de la estrella elegida.
    setTimeout(() => setStep(value === 5 && google ? "google" : "form"), 220);
  }

  function toggleCategory(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  /** Avisa al servidor (sin bloquear la navegación) que se abrió Google. */
  function trackGoogleClick() {
    if (preview) return;
    try {
      const body = new Blob([JSON.stringify({ slug: business.slug })], { type: "application/json" });
      if (!navigator.sendBeacon?.("/api/public/google-click", body)) {
        void fetch("/api/public/google-click", { method: "POST", body, keepalive: true });
      }
    } catch {
      /* la métrica nunca debe impedir ir a Google */
    }
  }

  /** 5 estrellas → Google: registra la puntuación y el clic, y deja seguir el enlace. */
  function continueToGoogle() {
    trackGoogleClick();
    if (preview) return;
    void fetch("/api/public/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug: business.slug, rating: 5, submissionKey: submissionKey.current }),
      keepalive: true,
    }).catch(() => undefined);
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === null || sending) return;
    setError(null);
    if (wantsContact && !contact.phone.trim() && !contact.email.trim()) {
      setError("Dejá un teléfono o un email para que puedan contactarte.");
      return;
    }
    if (preview) {
      setStep("done");
      return;
    }
    setSending(true);
    const website = String(new FormData(e.currentTarget).get("website") ?? "");
    try {
      const res = await fetch("/api/public/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: business.slug,
          rating,
          comment: comment.trim(),
          categoryIds: selected,
          submissionKey: submissionKey.current,
          website,
          ...(wantsContact ? { contact: { consent: true, ...contact } } : {}),
        }),
      });
      if (res.ok) {
        setStep("done");
        return;
      }
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      setError(data?.error ?? "No pudimos enviar tu opinión. Probá de nuevo.");
    } catch {
      // La clave de envío se mantiene: si el primer intento llegó, el reintento no duplica.
      setError("No pudimos enviar tu opinión. Revisá tu conexión y probá de nuevo.");
    } finally {
      setSending(false);
    }
  }

  const display = hover ?? rating ?? 0;
  const inputClass =
    "mt-1 block w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20";

  const googleLink = (label: string, variant: "primary" | "link") =>
    google ? (
      <a
        href={google}
        rel="noopener noreferrer"
        onClick={variant === "primary" && step === "google" ? continueToGoogle : trackGoogleClick}
        target={variant === "primary" && step === "google" && !preview ? undefined : "_blank"}
        className={
          variant === "primary"
            ? "flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold shadow-sm transition-opacity hover:opacity-90"
            : "font-medium underline"
        }
        style={variant === "primary" ? { background: brand, color: brandText } : { color: brandOnWhite }}
      >
        {label}
        {variant === "primary" && <ExternalLink className="size-4" aria-hidden />}
      </a>
    ) : null;

  const backToStars = (
    <button
      type="button"
      onClick={() => {
        setStep("rate");
        setError(null);
      }}
      className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"
    >
      <ArrowLeft className="size-4" aria-hidden /> Cambiar puntuación
    </button>
  );

  return (
    <div className="@container flex min-h-full flex-col">
      {business.isDemo && (
        <div className="bg-violet-700 px-4 py-2 text-center text-xs font-medium text-white">
          DEMO · Página de demostración. Las opiniones enviadas aquí son de prueba.
        </div>
      )}
      <div className="h-1.5" style={{ background: brand }} />
      <main className="mx-auto w-full max-w-md flex-1 px-5 pt-8 pb-10">
        <header className="flex flex-col items-center text-center">
          <BusinessLogo name={business.name} logoUrl={business.logoUrl} color={brand} size={72} />
          <p className="mt-4 text-sm font-medium text-slate-600">{business.name}</p>
        </header>

        {step === "rate" && (
          <fieldset className="mt-2">
            <legend className="mt-2 w-full text-center text-2xl font-semibold tracking-tight text-ink">{business.welcomeMessage}</legend>
            <p className="mt-2 text-center text-sm text-muted">Tocá una estrella para calificar.</p>
            <div className="mt-6 flex justify-center gap-1 @sm:gap-2" role="radiogroup" aria-label="Puntuación de 1 a 5 estrellas" onMouseLeave={() => setHover(null)}>
              {[1, 2, 3, 4, 5].map((value) => {
                const active = value <= display;
                return (
                  <label
                    key={value}
                    className="cursor-pointer rounded-xl p-1 transition-transform active:scale-95 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600"
                    onMouseEnter={() => setHover(value)}
                  >
                    <input
                      type="radio"
                      name="rating"
                      value={value}
                      checked={rating === value}
                      onChange={() => choose(value)}
                      className="sr-only"
                      aria-label={`${value} ${value === 1 ? "estrella" : "estrellas"}: ${RATING_LABELS[value]}`}
                    />
                    <Star
                      className={cn(
                        "size-11 transition-colors duration-150 @sm:size-14",
                        active ? "fill-star text-star" : "fill-transparent text-slate-300",
                        rating === value && "animate-pop",
                      )}
                      strokeWidth={1.5}
                      aria-hidden
                    />
                  </label>
                );
              })}
            </div>
            <p className="mt-2 h-6 text-center text-sm font-medium text-slate-700" aria-live="polite">
              {display ? RATING_LABELS[display] : ""}
            </p>
          </fieldset>
        )}

        {step === "google" && (
          <section className="animate-fade-up mt-6 text-center" aria-labelledby="google-title">
            <div className="flex justify-center gap-1" aria-label="5 de 5 estrellas" role="img">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star key={i} className="size-8 fill-star text-star" aria-hidden />
              ))}
            </div>
            <h1 id="google-title" ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold tracking-tight focus:outline-none">
              ¡Gracias por las 5 estrellas!
            </h1>
            <p className="mt-2 text-base text-slate-600">
              ¿Nos ayudás contándolo en Google Maps? Te lleva 30 segundos y ayuda a que más personas conozcan {business.name}.
            </p>
            <div className="mt-8">{googleLink("Continuar a Google Maps", "primary")}</div>
            <button
              type="button"
              onClick={() => setStep("form")}
              className="mt-5 text-sm font-medium underline"
              style={{ color: brandOnWhite }}
            >
              Prefiero dejar un comentario privado
            </button>
            <div className="mt-6">{backToStars}</div>
            {preview && <p className="mt-4 text-xs font-medium text-violet-700">Vista previa: no se registra nada.</p>}
          </section>
        )}

        {step === "form" && rating !== null && (
          <form onSubmit={submit} className="animate-fade-up mt-6 space-y-6" noValidate aria-labelledby="form-title">
            <div className="text-center">
              <div className="flex justify-center gap-1" role="img" aria-label={`${rating} de 5 estrellas: ${RATING_LABELS[rating]}`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className={cn("size-7", i <= rating ? "fill-star text-star" : "fill-transparent text-slate-300")} strokeWidth={1.5} aria-hidden />
                ))}
              </div>
              <h1 id="form-title" ref={headingRef} tabIndex={-1} className="mt-3 text-xl font-semibold tracking-tight focus:outline-none">
                {rating === 5 ? "Contanos qué te gustó" : "Contanos qué podemos mejorar"}
              </h1>
              <p className="mt-1 text-sm text-muted">Tu comentario es privado: lo recibe solo {business.name}.</p>
              <div className="mt-2">{backToStars}</div>
            </div>

            <div>
              <label htmlFor="comment" className="block text-base font-semibold text-ink">
                ¿Qué te pareció tu experiencia?
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
                rows={4}
                maxLength={COMMENT_MAX}
                placeholder="Contanos lo que quieras…"
                className={inputClass}
              />
              <p className="mt-1 text-right text-xs text-muted" aria-live="polite">
                {comment.length}/{COMMENT_MAX}
              </p>
            </div>

            {categories.length > 0 && (
              <fieldset>
                <legend className="text-base font-semibold text-ink">¿Sobre qué querés contarnos?</legend>
                <p className="mt-0.5 text-sm text-muted">Opcional. Podés elegir varias.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories.map((c) => {
                    const on = selected.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={cn(
                          "cursor-pointer select-none rounded-full border px-3.5 py-2 text-sm font-medium transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-brand-600",
                          on ? "border-transparent" : "border-line bg-white text-slate-700 hover:bg-slate-50",
                        )}
                        style={on ? { background: brand, color: brandText } : undefined}
                      >
                        <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleCategory(c.id)} />
                        {on && <Check className="-ml-0.5 mr-1 inline size-3.5" aria-hidden />}
                        {c.name}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            )}

            <fieldset className="rounded-xl border border-line p-4">
              <legend className="sr-only">Datos de contacto (opcional)</legend>
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={wantsContact}
                  onChange={(e) => setWantsContact(e.target.checked)}
                  className="mt-1 size-5 accent-current"
                  style={{ color: brand }}
                />
                <span>
                  <span className="block text-base font-semibold text-ink">Quiero que me contacten</span>
                  <span className="block text-sm text-muted">Opcional. Tus datos solo los ve {business.name} para responderte.</span>
                </span>
              </label>
              {wantsContact && (
                <div className="animate-fade-up mt-4 space-y-3">
                  <div>
                    <label htmlFor="contact-name" className="text-sm font-medium">Nombre</label>
                    <input id="contact-name" autoComplete="name" maxLength={80} value={contact.name} onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="contact-phone" className="text-sm font-medium">Teléfono o WhatsApp</label>
                    <input id="contact-phone" type="tel" inputMode="tel" autoComplete="tel" maxLength={30} value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} className={inputClass} />
                  </div>
                  <div>
                    <label htmlFor="contact-email" className="text-sm font-medium">Email</label>
                    <input id="contact-email" type="email" inputMode="email" autoComplete="email" maxLength={160} value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} className={inputClass} />
                  </div>
                  <p className="text-xs text-muted">Completá al menos el teléfono o el email.</p>
                </div>
              )}
            </fieldset>

            {/* Campo trampa para bots: oculto para personas y lectores de pantalla. */}
            <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">No completar</label>
              <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            {error && (
              <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={sending}
              aria-busy={sending}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-xl text-base font-semibold shadow-sm transition-opacity disabled:opacity-70"
              style={{ background: brand, color: brandText }}
            >
              {sending && <Loader2 className="size-5 animate-spin" aria-hidden />}
              {sending ? "Enviando…" : "Enviar opinión"}
            </button>

            {google && (
              <p className="text-center text-sm text-muted">
                ¿Preferís dejar una reseña pública? {googleLink("Ir a Google Maps", "link")}
              </p>
            )}
          </form>
        )}

        {step === "done" && (
          <section className="animate-fade-up mt-8 text-center" aria-labelledby="done-title">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-7" aria-hidden />
            </div>
            <h1 id="done-title" ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold tracking-tight focus:outline-none">
              ¡Recibimos tu opinión!
            </h1>
            <p className="mt-2 text-base text-slate-600">{business.thankYouMessage}</p>
            {wantsContact && <p className="mt-2 text-sm text-slate-600">{business.name} te va a contactar con los datos que dejaste.</p>}
            {google && (
              <div className="mt-8 rounded-2xl border border-line bg-white p-5 text-left">
                <p className="font-semibold text-ink">¿Querés compartir tu experiencia en Google?</p>
                <p className="mt-1 text-sm text-slate-600">Es opcional. Si querés dejar una reseña pública, la escribís vos en Google Maps.</p>
                <div className="mt-4">{googleLink("Dejar reseña en Google", "primary")}</div>
              </div>
            )}
            <p className="mt-8 text-sm text-muted">Ya podés cerrar esta página cuando quieras.</p>
            {preview && <p className="mt-2 text-xs font-medium text-violet-700">Vista previa: esta opinión no se guardó.</p>}
          </section>
        )}
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-muted">
        Tu opinión la recibe solo {business.name}.{" "}
        <a href="/privacidad" className="underline" target={preview ? "_blank" : undefined}>
          Privacidad
        </a>
      </footer>
    </div>
  );
}
