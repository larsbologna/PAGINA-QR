"use client";

import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-[60dvh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-xl font-semibold">Algo salió mal</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        Ocurrió un error inesperado. Ya quedó registrado. Probá de nuevo en unos segundos.
      </p>
      <Button variant="secondary" className="mt-6" onClick={reset}>
        Reintentar
      </Button>
    </main>
  );
}
