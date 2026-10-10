"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ExternalLink, Loader2, Star } from "lucide-react";
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

type Step = "rate" | "done";

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
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const submissionKey = useRef<string>("");
  const formRef = useRef<HTMLDivElement>(null);
  const doneRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    submissionKey.current = newSubmissionKey();
  }, []);

  useEffect(() => {
    if (step === "done") doneRef.current?.focus();
  }, [step]);

  const brand = business.brandColor;
  const brandText = textOnColor(brand);
  const brandOnWhite = accessibleOnWhite(brand);

  function choose(value: number) {
    const first = rating === null;
    setRating(value);
    setAnimKey((k) => k + 1);
    setError(null);
    if (first) setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
  }

  function toggleCategory(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (rating === null || sending) return;
    setError(null);
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
          <form onSubmit={submit} className="mt-2" noValidate>
            <fieldset>
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
                        key={rating === value ? animKey : undefined}
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

            {rating !== null && (
              <div ref={formRef} className="animate-fade-up mt-6 space-y-6 scroll-mt-4">
                <div>
                  <label htmlFor="comment" className="block text-base font-semibold text-ink">
                    ¿Qué te pareció tu experiencia?
                  </label>
                  <p className="mt-0.5 text-sm text-muted">Opcional. No incluyas datos personales.</p>
                  <textarea
                    id="comment"
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
                    rows={4}
                    maxLength={COMMENT_MAX}
                    placeholder="Contanos lo que quieras…"
                    className="mt-2 block w-full rounded-xl border border-line bg-white px-3.5 py-3 text-base text-ink placeholder:text-slate-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
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
              </div>
            )}

            {business.googleReviewUrl && (
              <p className="mt-8 text-center text-sm text-muted">
                ¿Preferís dejar una reseña pública?{" "}
                <a href={business.googleReviewUrl} target="_blank" rel="noopener noreferrer" className="font-medium underline" style={{ color: brandOnWhite }}>
                  Ir a Google
                </a>
              </p>
            )}
          </form>
        )}

        {step === "done" && (
          <section className="animate-fade-up mt-8 text-center" aria-labelledby="done-title">
            <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <Check className="size-7" aria-hidden />
            </div>
            <h1 id="done-title" ref={doneRef} tabIndex={-1} className="mt-4 text-2xl font-semibold tracking-tight focus:outline-none">
              ¡Recibimos tu opinión!
            </h1>
            <p className="mt-2 text-base text-slate-600">{business.thankYouMessage}</p>

            {business.googleReviewUrl && (
              <div className="mt-8 rounded-2xl border border-line bg-white p-5 text-left">
                <p className="font-semibold text-ink">¿Querés compartir tu experiencia en Google?</p>
                <p className="mt-1 text-sm text-slate-600">
                  Es opcional. Tu opinión anterior es privada para {business.name}; si querés dejar una reseña pública, la escribís vos en Google.
                </p>
                <a
                  href={business.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white text-base font-semibold text-ink shadow-sm hover:bg-slate-50"
                >
                  Dejar reseña en Google
                  <ExternalLink className="size-4" aria-hidden />
                </a>
              </div>
            )}
            <p className="mt-8 text-sm text-muted">Ya podés cerrar esta página cuando quieras.</p>
            {preview && <p className="mt-2 text-xs font-medium text-violet-700">Vista previa: esta opinión no se guardó.</p>}
          </section>
        )}
      </main>
      <footer className="px-5 pb-6 text-center text-xs text-muted">
        Tu opinión es anónima y la recibe solo {business.name}.{" "}
        <a href="/privacidad" className="underline" target={preview ? "_blank" : undefined}>
          Privacidad
        </a>
      </footer>
    </div>
  );
}
