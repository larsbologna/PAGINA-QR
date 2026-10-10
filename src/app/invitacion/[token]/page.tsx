import type { Metadata } from "next";
import { findValidInvitation } from "@/server/services/members";
import { config } from "@/server/config";
import { AcceptForm } from "./accept-form";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Invitación", referrer: "no-referrer" };

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await findValidInvitation(token);
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-medium text-brand-700">{config.productName}</p>
        {inv ? (
          <>
            <h1 className="mt-1 text-lg font-semibold">Te invitaron a gestionar {inv.business.name}</h1>
            <p className="mt-1 mb-6 text-sm text-muted">
              Rol: {inv.role === "OWNER" ? "administrador del negocio" : "miembro del equipo"}.
            </p>
            <AcceptForm token={token} email={inv.email} userExists={inv.userExists} />
          </>
        ) : (
          <>
            <h1 className="mt-1 text-lg font-semibold">Invitación no válida</h1>
            <p className="mt-2 text-sm text-muted">
              El enlace venció, ya fue utilizado o fue revocado. Pedile al proveedor del servicio un enlace nuevo.
            </p>
            <ButtonLink href="/login" variant="secondary" className="mt-6 w-full">
              Ir a ingresar
            </ButtonLink>
          </>
        )}
      </div>
    </main>
  );
}
