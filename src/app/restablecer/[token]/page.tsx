import type { Metadata } from "next";
import { findValidReset } from "@/server/services/password-reset";
import { config } from "@/server/config";
import { ButtonLink } from "@/components/ui/button";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Restablecer contraseña", referrer: "no-referrer" };

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const reset = await findValidReset(token);
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-brand-700">{config.productName}</p>
        {reset ? (
          <>
            <h1 className="mt-1 text-lg font-semibold">Elegí una contraseña nueva</h1>
            <p className="mt-1 mb-6 text-sm text-muted">Para {reset.user.email}. Se cerrarán las sesiones abiertas.</p>
            <ResetForm token={token} />
          </>
        ) : (
          <>
            <h1 className="mt-1 text-lg font-semibold">Enlace no válido</h1>
            <p className="mt-2 text-sm text-muted">El enlace venció o ya fue utilizado. Pedile uno nuevo al proveedor del servicio.</p>
            <ButtonLink href="/login" variant="secondary" className="mt-6 w-full">Ir a ingresar</ButtonLink>
          </>
        )}
      </div>
    </main>
  );
}
