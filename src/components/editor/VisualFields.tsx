"use client";
import { useRef, useState } from "react";
import type { VisualField } from "@/lib/visuals";
import { parseItems, type BlockItem } from "@/lib/visuals";
import { DEFAULT_ICONS } from "@/lib/defaultIcons";
import { sanitizeSvg } from "@/lib/sanitize";
import { aiConfigured } from "@/lib/ai/settings";
import type { SlideTheme } from "@/components/slide/theme";
import { Button, Select, TextArea, TextInput } from "@/components/ui/controls";
import { IconPlus, IconSparkle, IconTrash } from "@/components/ui/icons";
import { IconPicker } from "./IconPicker";

/** Editor de un campo de visual según su tipo. */
export function VisualFieldEditor({
  field,
  value,
  onChange,
  theme,
  onOpenAiSettings,
}: {
  field: VisualField;
  value: string;
  onChange: (v: string) => void;
  theme: SlideTheme;
  onOpenAiSettings: () => void;
}) {
  switch (field.type) {
    case "icon":
      return <IconPicker label={field.label} value={value} onChange={onChange} />;
    case "select":
      return <Select label={field.label} value={value} onChange={onChange} options={field.options ?? []} />;
    case "items":
      return <ItemsEditor value={value} onChange={onChange} />;
    case "svg":
      return <SvgEditor value={value} onChange={onChange} theme={theme} onOpenAiSettings={onOpenAiSettings} />;
    default:
      return field.multiline ? (
        <TextArea label={field.label} rows={3} value={value} onChange={onChange} hint={field.hint} />
      ) : (
        <TextInput label={field.label} value={value} onChange={onChange} hint={field.hint} />
      );
  }
}

const FALLBACK_ICONS = Object.values(DEFAULT_ICONS);

function ItemsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const items = parseItems(value);
  const save = (next: BlockItem[]) => onChange(JSON.stringify(next));
  const update = (i: number, patch: Partial<BlockItem>) => save(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-muted">Bloques ({items.length} de 8)</div>
      {items.map((it, i) => (
        <div key={i} className="space-y-2 rounded-xl border border-line bg-bg/60 p-2.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-faint">#{i + 1}</span>
            <span className="flex-1" />
            <button
              type="button"
              aria-label={`Subir bloque ${i + 1}`}
              disabled={i === 0}
              onClick={() => save(items.map((x, j) => (j === i - 1 ? items[i] : j === i ? items[i - 1] : x)))}
              className="rounded px-1.5 text-xs text-muted hover:text-white disabled:opacity-20"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label={`Quitar bloque ${i + 1}`}
              onClick={() => save(items.filter((_, j) => j !== i))}
              className="rounded p-1 text-muted hover:text-red-300"
            >
              <IconTrash size={13} />
            </button>
          </div>
          <IconPicker label="Ícono" value={it.icon} onChange={(v) => update(i, { icon: v })} />
          <TextInput label="Título" value={it.title} onChange={(v) => update(i, { title: v })} />
          <TextInput label="Texto" value={it.text} onChange={(v) => update(i, { text: v })} />
        </div>
      ))}
      <Button
        variant="outline"
        className="w-full"
        disabled={items.length >= 8}
        onClick={() => save([...items, { icon: FALLBACK_ICONS[items.length % FALLBACK_ICONS.length], title: "Nuevo bloque", text: "" }])}
      >
        <IconPlus /> Agregar bloque
      </Button>
    </div>
  );
}

function SvgEditor({ value, onChange, theme, onOpenAiSettings }: { value: string; onChange: (v: string) => void; theme: SlideTheme; onOpenAiSettings: () => void }) {
  const [request, setRequest] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paste, setPaste] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const hasAi = aiConfigured();

  const create = async () => {
    if (!request.trim()) return;
    setBusy(true);
    setError("");
    try {
      const { generateSvg } = await import("@/lib/ai/visualAi");
      const out = await generateSvg(request, { background: theme.bg, surface: theme.surface, text: theme.text, accent: theme.accent });
      onChange(out.svg);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo crear el dibujo.");
    } finally {
      setBusy(false);
    }
  };

  const useSvg = (markup: string) => {
    const clean = sanitizeSvg(markup);
    if (!clean) {
      setError("Eso no parece un SVG válido.");
      return;
    }
    setError("");
    onChange(clean);
    setPaste("");
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
        <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
          <IconSparkle size={14} /> Crear con IA
        </div>
        {hasAi ? (
          <>
            <textarea
              rows={3}
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Ej.: una persona subiendo una escalera hecha de libros, con una bandera arriba"
              aria-label="Describí el dibujo"
              className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-accent/60"
            />
            <Button variant="primary" className="mt-2 w-full" onClick={create} disabled={busy || !request.trim()}>
              {busy ? "Dibujando… (puede tardar un minuto)" : value ? "Crear otro" : "Crear dibujo"}
            </Button>
            <p className="mt-1.5 text-[11px] text-faint">Usa los colores de este slide. Consume tokens de tu clave.</p>
          </>
        ) : (
          <p className="text-xs leading-snug text-muted">
            Para crear dibujos con IA cargá tu clave en{" "}
            <button type="button" onClick={onOpenAiSettings} className="text-accent underline">
              configuración de IA
            </button>
            . Sin IA, podés pegar o subir un SVG hecho en cualquier programa.
          </p>
        )}
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium text-muted">O usá tu propio SVG</div>
        <textarea
          rows={2}
          value={paste}
          onChange={(e) => setPaste(e.target.value)}
          placeholder="Pegá acá el código <svg>…</svg>"
          aria-label="Pegar código SVG"
          className="w-full resize-y rounded-lg border border-line bg-bg px-3 py-2 font-mono text-xs outline-none focus:border-accent/60"
        />
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" disabled={!paste.trim()} onClick={() => useSvg(paste)}>
            Usar código
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => file.current?.click()}>
            Subir .svg
          </Button>
        </div>
        <input
          ref={file}
          type="file"
          accept=".svg,image/svg+xml"
          className="hidden"
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) useSvg(await f.text());
            e.target.value = "";
          }}
        />
      </div>
      {error && <p className="text-xs text-red-300">{error}</p>}
      {value && (
        <Button variant="ghost" className="w-full" onClick={() => onChange("")}>
          Quitar dibujo
        </Button>
      )}
    </div>
  );
}
