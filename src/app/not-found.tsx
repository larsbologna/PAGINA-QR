import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-brand-700">Error 404</p>
      <h1 className="mt-2 text-2xl font-semibold">No encontramos esta página</h1>
      <p className="mt-2 max-w-sm text-sm text-muted">El enlace puede estar mal escrito, o no tenés permiso para ver este contenido.</p>
      <ButtonLink href="/" variant="secondary" className="mt-6">
        Ir al inicio
      </ButtonLink>
    </main>
  );
}
