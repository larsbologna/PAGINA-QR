"use client";
import dynamic from "next/dynamic";

// El editor depende de localStorage, medidas del DOM y valores aleatorios: se dibuja
// solo en el navegador para evitar diferencias entre servidor y cliente.
// Con Firebase configurado se exige cuenta (AuthGate); si no, modo local sin cuentas.
export const EditorLoader = dynamic(
  async () => {
    const { accountsEnabled } = await import("@/config/firebase");
    if (accountsEnabled()) return (await import("@/components/auth/AuthGate")).AuthGate;
    return (await import("./EditorBoot")).EditorBoot;
  },
  {
  ssr: false,
  loading: () => (
    <div className="grid h-dvh place-items-center bg-bg text-sm text-muted">
      <span className="animate-pulse">Cargando editor…</span>
    </div>
  ),
  },
);
