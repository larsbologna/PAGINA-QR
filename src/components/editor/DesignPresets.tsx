"use client";
import { useEffect, useState } from "react";
import type { DesignConfig } from "@/lib/types";
import { presets, StorageFullError, type DesignPreset } from "@/lib/storage";
import { getFont } from "@/lib/fonts";
import { uid } from "@/lib/ids";
import { IconPlus, IconTrash } from "@/components/ui/icons";

/** Diseños guardados para reutilizar en otros carruseles. */
export function DesignPresets({ design, onApply }: { design: DesignConfig; onApply: (d: DesignConfig) => void }) {
  const [list, setList] = useState<DesignPreset[]>([]);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    presets.list().then(setList);
  }, []);

  const saveCurrent = async () => {
    const n = name.trim();
    if (!n) return;
    try {
      await presets.save({ id: uid("d_"), name: n, design: { ...design }, createdAt: Date.now() });
      setList(await presets.list());
      setNaming(false);
      setName("");
      setError("");
    } catch (e) {
      setError(e instanceof StorageFullError ? e.message : "No se pudo guardar el diseño.");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted">Mis diseños</span>
        {!naming && (
          <button type="button" onClick={() => setNaming(true)} className="flex items-center gap-1 text-xs text-accent hover:brightness-125">
            <IconPlus size={13} /> Guardar el actual
          </button>
        )}
      </div>
      {naming && (
        <div className="flex gap-2">
          <input
            autoFocus
            aria-label="Nombre del diseño"
            placeholder="Ej.: Oscuro amarillo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveCurrent();
              if (e.key === "Escape") setNaming(false);
            }}
            className="min-w-0 flex-1 rounded-lg border border-line bg-bg px-2 py-1.5 text-xs outline-none focus:border-accent/60"
          />
          <button type="button" onClick={saveCurrent} disabled={!name.trim()} className="rounded-lg bg-accent px-3 text-xs font-semibold text-accent-ink disabled:opacity-40">
            Guardar
          </button>
        </div>
      )}
      {error && <p className="text-[11px] text-red-300">{error}</p>}
      {list.length === 0 && !naming && <p className="text-[11px] text-faint">Guardá colores, tipografías y tamaños para reutilizarlos en otros carruseles.</p>}
      <ul className="space-y-1.5">
        {list.map((p) => (
          <li key={p.id} className="group flex items-center gap-2 rounded-xl border border-line bg-bg p-1.5 pr-2 transition hover:border-line-strong">
            <button type="button" onClick={() => onApply(p.design)} className="flex min-w-0 flex-1 items-center gap-2 text-left" title="Aplicar este diseño">
              <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[11px] font-bold" style={{ background: p.design.background, color: p.design.text, fontFamily: getFont(p.design.titleFont).family }}>
                Aa
                <span className="absolute right-1 bottom-1 h-1.5 w-3 rounded-full" style={{ background: p.design.accent }} />
              </span>
              <span className="truncate text-xs">{p.name}</span>
            </button>
            <button
              type="button"
              aria-label={`Eliminar diseño ${p.name}`}
              onClick={async () => {
                await presets.remove(p.id);
                setList(await presets.list());
              }}
              className="rounded p-1 text-faint opacity-0 transition group-hover:opacity-100 hover:text-red-300 focus:opacity-100"
            >
              <IconTrash size={13} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
