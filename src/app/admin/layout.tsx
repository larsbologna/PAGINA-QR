import { requireSuperadmin } from "@/server/auth/current";
import { config } from "@/server/config";
import { AppShell, type NavItem } from "@/components/shell/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireSuperadmin();
  const nav: NavItem[] = [
    { href: "/admin", label: "Negocios", icon: "businesses", exact: true },
    { href: "/admin/negocios/nuevo", label: "Nuevo negocio", icon: "plus", exact: true },
    { href: "/admin/auditoria", label: "Auditoría", icon: "audit" },
  ];
  return (
    <AppShell
      productName={config.productName}
      header={
        <div className="px-1">
          <p className="text-sm font-semibold">Panel maestro</p>
          <p className="text-xs text-muted">Superadministrador</p>
        </div>
      }
      nav={nav}
      userEmail={user.email}
     
    >
      {children}
    </AppShell>
  );
}
