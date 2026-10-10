import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import { requireUser } from "@/server/auth/current";
import { listUserBusinesses } from "@/server/auth/access";
import { config } from "@/server/config";
import { EmptyState } from "@/components/ui/empty-state";
import { DemoBadge, Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/shell/logout-button";

export const metadata: Metadata = { title: "Mis negocios" };

export default async function PanelIndex() {
  const user = await requireUser();
  const businesses = await listUserBusinesses(user);
  const available = user.role === "SUPERADMIN" ? businesses : businesses.filter((b) => b.status === "ACTIVE");
  if (user.role !== "SUPERADMIN" && available.length === 1) redirect(`/panel/${available[0]!.slug}`);

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{config.productName}</h1>
        <LogoutButton withIcon={false} className="text-sm text-muted hover:text-ink" />
      </div>
      <div className="rounded-xl border border-line bg-white">
        {available.length === 0 ? (
          <EmptyState icon={Building2} title="Todavía no tenés negocios asignados">
            Si tu cuenta fue suspendida o todavía no aceptaste una invitación, contactá al proveedor del servicio.
          </EmptyState>
        ) : (
          <ul className="divide-y divide-line">
            {available.map((b) => (
              <li key={b.id}>
                <Link href={`/panel/${b.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-slate-50">
                  <span className="font-medium">{b.name}</span>
                  <span className="flex gap-2">
                    {b.isDemo && <DemoBadge />}
                    {b.status !== "ACTIVE" && <Badge tone="red">Suspendido</Badge>}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {user.role === "SUPERADMIN" && (
        <ButtonLink href="/admin" variant="secondary" className="mt-4">
          Ir al panel maestro
        </ButtonLink>
      )}
    </main>
  );
}
