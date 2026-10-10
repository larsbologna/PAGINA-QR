"use client";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="es-AR">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 32, textAlign: "center" }}>
        <h1>Algo salió mal</h1>
        <p>Ocurrió un error inesperado. Probá de nuevo en unos segundos.</p>
        <button onClick={reset} style={{ padding: "8px 16px", marginTop: 16 }}>
          Reintentar
        </button>
      </body>
    </html>
  );
}
