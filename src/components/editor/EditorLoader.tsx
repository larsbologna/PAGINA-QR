"use client";
import dynamic from "next/dynamic";

// El editor depende de localStorage, medidas del DOM y valores aleatorios: se dibuja
// solo en el navegador para evitar diferencias entre servidor y cliente.
export const EditorLoader = dynamic(() => import("./EditorBoot").then((m) => m.EditorBoot), {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-bg text-sm text-muted">
      <span className="animate-pulse">Cargando editor…</span>
    </div>
  ),
});
