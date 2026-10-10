import Link from "next/link";
import { BarChart3, MessageSquareText, QrCode, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { config } from "@/server/config";

const features = [
  { icon: QrCode, title: "QR personalizado", text: "Un código para el mostrador, la mesa o una tarjeta. Tus clientes opinan en segundos, sin registrarse." },
  { icon: MessageSquareText, title: "Opiniones organizadas", text: "Todas las opiniones privadas en un solo lugar, con filtros, notas internas y estado de revisión." },
  { icon: BarChart3, title: "Qué mejorar", text: "Estadísticas reales: promedio, evolución y los temas que más se repiten en las opiniones." },
  { icon: ShieldCheck, title: "Google, sin trampas", text: "Todos los clientes ven el acceso a tu perfil de Google, sin importar la puntuación que dieron." },
];

export default function HomePage() {
  return (
    <main className="min-h-dvh bg-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-6">
        <span className="flex items-center gap-2 font-semibold">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">R</span>
          {config.productName}
        </span>
        <ButtonLink href="/login" variant="secondary" size="sm">
          Ingresar
        </ButtonLink>
      </header>
      <section className="mx-auto max-w-5xl px-4 pt-12 pb-16 sm:px-6 sm:pt-20">
        <p className="text-sm font-medium text-brand-700">Gestión de reputación para negocios locales</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-ink sm:text-5xl">
          Escuchá a tus clientes y descubrí qué mejorar.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 sm:text-lg">
          Un QR personalizado para que tus clientes compartan su experiencia. Las opiniones quedan organizadas en un panel
          privado donde ves qué funciona, qué problemas se repiten y qué conviene mejorar. Además, facilitamos el acceso a
          tu perfil de Google para quienes quieran dejar una reseña pública.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <ButtonLink href="/login" size="lg">
            Ingresar al panel
          </ButtonLink>
        </div>
      </section>
      <section className="border-t border-line bg-canvas">
        <div className="mx-auto grid max-w-5xl gap-6 px-4 py-14 sm:grid-cols-2 sm:px-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-xl border border-line bg-white p-5">
              <f.icon className="size-5 text-brand-700" aria-hidden />
              <h2 className="mt-3 font-semibold">{f.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">{f.text}</p>
            </div>
          ))}
        </div>
        <p className="mx-auto max-w-5xl px-4 pb-10 text-xs text-muted sm:px-6">
          {config.productName} ayuda a recoger opiniones y a facilitar el acceso al perfil público del negocio. No modifica el
          posicionamiento en Google ni garantiza resultados.
          {" · "}
          <Link href="/privacidad" className="underline">Privacidad</Link>
          {" · "}
          <Link href="/terminos" className="underline">Términos</Link>
        </p>
      </section>
    </main>
  );
}
