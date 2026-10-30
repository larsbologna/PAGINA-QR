"use client";
import type { ContentCategory } from "@/lib/types";
import { CATEGORY_LIST } from "@/lib/content/categories";

const ICONS: Record<ContentCategory, React.ReactNode> = {
  negocio: <path d="M3 21h18M5 21V8l7-5 7 5v13M9 21v-6h6v6" />,
  crecimiento: <path d="M4 20c4-1 6-4 7-9M11 11c1-4 4-6 9-7-1 5-3 8-9 7zM11 11c-3-2-6-2-8-1 1 3 4 4 8 1" />,
  motivacion: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  proceso: <path d="M3 17l5-5 4 4 8-8M15 8h5v5" />,
  habitos: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4M8 14l2 2 4-4" />
    </>
  ),
};

function Icon({ id, size = 22 }: { id: ContentCategory; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      {ICONS[id]}
    </svg>
  );
}

/** Tarjetas grandes para elegir el tipo de carrusel antes de empezar. */
export function CategoryCards({ value, onChange }: { value: ContentCategory | ""; onChange: (c: ContentCategory) => void }) {
  return (
    <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="Tipo de carrusel">
      {CATEGORY_LIST.map((c) => {
        const active = value === c.id;
        return (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(c.id)}
            className={`group flex flex-col gap-2 rounded-2xl border p-4 text-left transition ${
              active ? "border-accent bg-accent/10 ring-2 ring-accent/25" : "border-line bg-panel hover:border-line-strong"
            }`}
          >
            <span className="flex items-center gap-2.5">
              <span className={`grid h-9 w-9 place-items-center rounded-xl ${active ? "bg-accent text-accent-ink" : "bg-white/5 text-accent"}`}>
                <Icon id={c.id} size={19} />
              </span>
              <span className="font-semibold">{c.label}</span>
            </span>
            <span className="text-xs leading-snug text-muted">{c.description}</span>
            <span className="text-[11px] leading-snug text-faint">Ej.: {c.examples[0]}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Versión compacta para el panel de configuración. */
export function CategoryChips({ value, onChange }: { value: ContentCategory | ""; onChange: (c: ContentCategory) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted">Tipo de carrusel</div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de carrusel">
        {CATEGORY_LIST.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={value === c.id}
            title={c.description}
            onClick={() => onChange(c.id)}
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition ${
              value === c.id ? "border-accent bg-accent text-accent-ink" : "border-line bg-bg text-white/75 hover:border-line-strong hover:text-white"
            }`}
          >
            <Icon id={c.id} size={13} />
            {c.label}
          </button>
        ))}
      </div>
      {!value && <p className="text-[11px] text-amber-300/90">Elegí el tipo antes de proponer la estructura.</p>}
    </div>
  );
}
