"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  BarChart3, Building2, ClipboardList, FileText, LayoutDashboard, Menu, MessageSquareText, QrCode, Settings,
  ShieldCheck, Users, X, Lightbulb, UserCircle, PlusCircle, Loader2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { LogoutButton } from "./logout-button";

const ICONS = {
  dashboard: LayoutDashboard,
  inbox: MessageSquareText,
  analysis: Lightbulb,
  reports: FileText,
  qr: QrCode,
  settings: Settings,
  team: Users,
  businesses: Building2,
  audit: ClipboardList,
  admin: ShieldCheck,
  chart: BarChart3,
  account: UserCircle,
  plus: PlusCircle,
} as const;

export type IconName = keyof typeof ICONS;

/** Ícono del ítem; mientras la página destino carga, muestra un indicador de progreso. */
function NavIcon({ icon }: { icon: IconName }) {
  const { pending } = useLinkStatus();
  const Icon = pending ? Loader2 : ICONS[icon];
  return <Icon className={cn("size-4 shrink-0", pending && "animate-spin")} aria-hidden />;
}

export interface NavItem {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  badge?: number;
}

export function AppShell({
  productName,
  header,
  nav,
  secondaryNav,
  userEmail,
  banner,
  children,
}: {
  productName: string;
  header: ReactNode;
  nav: NavItem[];
  secondaryNav?: NavItem[];
  userEmail: string;
  banner?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const isActive = (item: NavItem) => (item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`));

  const renderNav = (items: NavItem[]) => (
    <ul className="space-y-0.5">
      {items.map((item) => {
        const active = isActive(item);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-brand-50 text-brand-800" : "text-slate-600 hover:bg-slate-100 hover:text-ink",
              )}
            >
              <NavIcon icon={item.icon} />
              <span className="flex-1 truncate">{item.label}</span>
              {!!item.badge && (
                <span className="rounded-full bg-brand-700 px-1.5 py-0.5 text-[11px] leading-none font-semibold text-white" aria-label={`${item.badge} sin revisar`}>
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-line px-4">
        <span className="flex size-7 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">R</span>
        <span className="truncate text-sm font-semibold">{productName}</span>
      </div>
      <div className="border-b border-line px-3 py-3">{header}</div>
      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 py-3">
        {renderNav(nav)}
        {secondaryNav && secondaryNav.length > 0 && <div className="mt-4 border-t border-line pt-4">{renderNav(secondaryNav)}</div>}
      </nav>
      <div className="border-t border-line px-3 py-3">
        <Link href="/cuenta" className="block truncate rounded-lg px-3 py-1.5 text-xs text-muted hover:bg-slate-100" title={userEmail}>
          {userEmail}
        </Link>
        <LogoutButton className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-ink" />
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh lg:pl-64 print:pl-0">
      <aside className="no-print fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>

      <div className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur lg:hidden no-print">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <span className="flex size-7 items-center justify-center rounded-lg bg-brand-700 text-xs font-bold text-white">R</span>
          {productName}
        </span>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex size-10 items-center justify-center rounded-lg text-slate-700 hover:bg-slate-100"
          aria-label="Abrir menú"
          aria-expanded={open}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Menú">
          <div className="absolute inset-0 bg-slate-900/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 flex size-10 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100"
              aria-label="Cerrar menú"
            >
              <X className="size-5" aria-hidden />
            </button>
            {sidebar}
          </div>
        </div>
      )}

      {banner}
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8 print:max-w-none print:p-0">{children}</main>
    </div>
  );
}
