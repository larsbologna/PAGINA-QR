import { getBusinessAccess } from "@/server/auth/current";
import { listUserBusinesses } from "@/server/auth/access";
import { countPendingToImprove } from "@/server/services/feedback";
import { logoUrl } from "@/server/services/businesses";
import { config } from "@/server/config";
import { AppShell, type NavItem } from "@/components/shell/app-shell";
import { BusinessSwitcher } from "@/components/shell/business-switcher";
import { BusinessLogo } from "@/components/business-logo";
import { DemoBadge } from "@/components/ui/badge";

export default async function BusinessPanelLayout({ children, params }: { children: React.ReactNode; params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { user, access } = await getBusinessAccess(slug);
  const b = access.business;
  const [pending, businesses] = await Promise.all([countPendingToImprove(b.id), listUserBusinesses(user)]);
  const base = `/panel/${b.slug}`;

  // Menú corto a propósito: lo que el dueño usa todos los días.
  const nav: NavItem[] = [
    { href: base, label: "Progreso", icon: "chart", exact: true },
    { href: `${base}/mejorar`, label: "Para mejorar", icon: "inbox", badge: pending },
    { href: `${base}/qr`, label: "Código QR", icon: "qr" },
    ...(access.canManage ? ([{ href: `${base}/configuracion`, label: "Configuración", icon: "settings" }] as NavItem[]) : []),
  ];
  const secondaryNav: NavItem[] = user.role === "SUPERADMIN" ? [{ href: "/admin", label: "Panel maestro", icon: "admin", exact: true }] : [];

  const header = (
    <div>
      <div className="flex items-center gap-3 px-1">
        <BusinessLogo name={b.name} logoUrl={logoUrl(b)} color={b.brandColor} size={36} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{b.name}</p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            {access.role === "SUPERADMIN" ? "Superadministrador" : access.role === "OWNER" ? "Administrador" : "Miembro"}
            {b.isDemo && <DemoBadge />}
          </p>
        </div>
      </div>
      {businesses.length > 1 && (
        <div className="mt-3">
          <BusinessSwitcher current={b.slug} options={businesses.map((x) => ({ slug: x.slug, name: x.name }))} />
        </div>
      )}
    </div>
  );

  const banner =
    b.isDemo || b.status !== "ACTIVE" ? (
      <div className={`no-print px-4 py-2 text-center text-xs font-medium text-white ${b.status !== "ACTIVE" ? "bg-red-700" : "bg-violet-700"}`}>
        {b.status !== "ACTIVE"
          ? "Cuenta suspendida: la página pública no recibe opiniones y el equipo del negocio no puede ingresar."
          : "DEMO · Negocio de demostración con opiniones ficticias. No mezcla datos con negocios reales."}
      </div>
    ) : undefined;

  return (
    <AppShell productName={config.productName} header={header} nav={nav} secondaryNav={secondaryNav} userEmail={user.email} banner={banner}>
      {children}
    </AppShell>
  );
}
