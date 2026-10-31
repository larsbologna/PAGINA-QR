"use client";
import { useEffect, useState } from "react";
import { AI_MODELS, loadAiSettings, saveAiSettings, type AiModelId } from "@/lib/ai/settings";
import { Button, Select } from "@/components/ui/controls";

/** Configuración de IA opcional: cada usuario usa su propia clave y paga sus tokens. */
export function AiSettingsDialog({ onClose }: { onClose: (changed: boolean) => void }) {
  const initial = loadAiSettings();
  const [apiKey, setApiKey] = useState(initial.apiKey);
  const [model, setModel] = useState<AiModelId>(initial.model);
  const [show, setShow] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const save = () => {
    saveAiSettings({ apiKey: apiKey.trim(), model });
    onClose(true);
  };

  const test = async () => {
    saveAiSettings({ apiKey: apiKey.trim(), model });
    setTesting(true);
    setStatus(null);
    try {
      const { testAiKey } = await import("@/lib/ai/claude");
      await testAiKey();
      setStatus({ ok: true, text: "La clave funciona." });
    } catch (e) {
      setStatus({ ok: false, text: e instanceof Error ? e.message : "No se pudo verificar." });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose(false)}>
      <div role="dialog" aria-modal="true" aria-labelledby="ai-title" className="animate-rise w-full max-w-lg overflow-hidden rounded-3xl border border-line bg-panel shadow-2xl">
        <div className="border-b border-line p-6">
          <h2 id="ai-title" className="font-display text-2xl font-bold">
            IA opcional
          </h2>
          <p className="mt-1 text-sm text-muted">Todo funciona gratis sin IA. Con tu clave podés escribir carruseles completos y crear dibujos a pedido.</p>
        </div>
        <div className="space-y-4 p-6">
          <div className="space-y-1.5">
            <label htmlFor="ai-key" className="block text-xs font-medium text-muted">
              Clave de API de Anthropic
            </label>
            <div className="flex gap-2">
              <input
                id="ai-key"
                type={show ? "text" : "password"}
                autoComplete="off"
                spellCheck={false}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-…"
                className="flex-1 rounded-xl border border-line bg-bg px-3 py-2 font-mono text-sm outline-none focus:border-accent/60"
              />
              <Button variant="ghost" onClick={() => setShow((s) => !s)}>
                {show ? "Ocultar" : "Ver"}
              </Button>
            </div>
            <p className="text-[11px] leading-snug text-faint">
              Se crea en console.anthropic.com → API Keys. El uso se cobra en esa cuenta. La clave se guarda solo en este navegador y se envía únicamente a Anthropic.
            </p>
          </div>
          <Select label="Modelo" value={model} onChange={setModel} options={AI_MODELS.map((m) => ({ value: m.id, label: m.label }))} />
          {status && <p className={`rounded-xl p-3 text-sm ${status.ok ? "bg-emerald-500/10 text-emerald-300" : "bg-red-500/10 text-red-300"}`}>{status.text}</p>}
        </div>
        <div className="flex flex-wrap justify-end gap-2 border-t border-line p-4">
          {initial.apiKey && (
            <Button
              variant="danger"
              onClick={() => {
                saveAiSettings({ apiKey: "", model });
                onClose(true);
              }}
            >
              Borrar clave
            </Button>
          )}
          <span className="flex-1" />
          <Button variant="outline" onClick={test} disabled={!apiKey.trim() || testing}>
            {testing ? "Probando…" : "Probar"}
          </Button>
          <Button variant="primary" onClick={save}>
            Guardar
          </Button>
        </div>
      </div>
    </div>
  );
}
