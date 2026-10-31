"use client";
import { Portal } from "@/components/ui/Portal";
import { useEffect, useRef, useState } from "react";
import { iconPreview, iconValue, searchIcons, type IconHit } from "@/lib/icons";
import { IconGlyph } from "@/components/visuals/IconGlyph";

const QUICK = ["cohete", "objetivo", "corazón", "estrella", "check", "dinero", "clientes", "idea", "reloj", "calendario", "crecimiento", "mente", "libro", "rayo", "trofeo", "mensaje", "casa", "café"];
const EMOJIS = ["🚀", "🎯", "💡", "🔥", "✅", "⭐", "💪", "🧠", "📈", "⏰", "❤️", "🙌", "📚", "☕", "🌱", "💬", "🏆", "✨"];

function Preview({ hit }: { hit: IconHit }) {
  const [svg, setSvg] = useState<{ viewBox: string; body: string } | null>(null);
  useEffect(() => {
    let alive = true;
    iconPreview(hit).then((s) => alive && setSvg(s));
    return () => {
      alive = false;
    };
  }, [hit]);
  if (!svg) return <span className="h-7 w-7 animate-pulse rounded bg-white/5" />;
  // Íconos de las bibliotecas empaquetadas (Lucide/Tabler), no contenido externo.
  return <svg width="28" height="28" viewBox={svg.viewBox} dangerouslySetInnerHTML={{ __html: svg.body }} />;
}

/** Botón que muestra el ícono actual y abre el buscador (más de 8000 íconos + emojis). */
export function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="space-y-1.5">
      <div className="text-xs font-medium text-muted">{label}</div>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl border border-line bg-bg px-3 py-2 text-left text-sm text-white/80 transition hover:border-line-strong"
      >
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-white/5">
          <IconGlyph value={value} size={22} color="currentColor" />
        </span>
        <span className="flex-1">{value ? "Cambiar ícono" : "Elegir ícono"}</span>
      </button>
      {open && (
        <IconSearchDialog
          onPick={(v) => {
            onChange(v);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}

function IconSearchDialogContent({ onPick, onClose }: { onPick: (value: string) => void; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<IconHit[] | null>(null);
  const [error, setError] = useState("");
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      searchIcons(query)
        .then((h) => alive && setHits(h))
        .catch(() => alive && setError("No se pudo cargar la biblioteca de íconos."));
    }, 180);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Buscar ícono" className="animate-rise flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
        <div className="border-b border-line p-4">
          <div className="flex items-center gap-2">
            <input
              ref={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscá en español o inglés: cohete, dinero, mente, rocket…"
              aria-label="Buscar ícono"
              className="flex-1 rounded-xl border border-line bg-bg px-3 py-2.5 text-sm outline-none focus:border-accent/60"
            />
            <button type="button" onClick={onClose} className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-white" aria-label="Cerrar">
              ✕
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {QUICK.map((q) => (
              <button key={q} type="button" onClick={() => setQuery(q)} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-muted hover:border-line-strong hover:text-white">
                {q}
              </button>
            ))}
          </div>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-4">
          <div className="mb-2 text-[11px] font-semibold tracking-wide text-faint uppercase">Emojis</div>
          <div className="mb-5 flex flex-wrap gap-1">
            {EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => onPick(e)} className="grid h-11 w-11 place-items-center rounded-xl text-2xl hover:bg-white/10" aria-label={`Emoji ${e}`}>
                {e}
              </button>
            ))}
          </div>
          <div className="mb-2 text-[11px] font-semibold tracking-wide text-faint uppercase">Íconos {hits ? `(${hits.length}${hits.length >= 120 ? "+" : ""})` : ""}</div>
          {error && <p className="text-sm text-red-300">{error}</p>}
          {!hits && !error && <p className="text-sm text-muted">Cargando biblioteca…</p>}
          {hits?.length === 0 && <p className="text-sm text-muted">Sin resultados. Probá con otra palabra (también en inglés).</p>}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
            {hits?.map((h) => (
              <button
                key={`${h.set}:${h.name}`}
                type="button"
                title={`${h.name} (${h.set})`}
                aria-label={`Ícono ${h.name}`}
                onClick={async () => {
                  const v = await iconValue(h.set, h.name);
                  if (v) onPick(v);
                }}
                className="flex h-16 flex-col items-center justify-center gap-1 rounded-xl text-white/85 transition hover:bg-accent hover:text-accent-ink"
              >
                <Preview hit={h} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function IconSearchDialog(props: { onPick: (value: string) => void; onClose: () => void }) {
  return (
    <Portal>
      <IconSearchDialogContent {...props} />
    </Portal>
  );
}
