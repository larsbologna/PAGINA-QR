"use client";
import { useEffect, useRef, useState } from "react";
import { friendlyAuthError, logout, resetPassword, type Session } from "@/lib/firebase/accounts";

/** Avatar con menú: datos de la cuenta, cambio de contraseña, clientes (admin) y salir. */
export function AccountMenu({ session, onOpenAdmin, beforeLogout }: { session: Session; onOpenAdmin: () => void; beforeLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const email = session.user.email ?? "";
  const name = session.account?.name || email;

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Mi cuenta"
        aria-expanded={open}
        className="grid h-8 w-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white ring-1 ring-line transition hover:ring-accent"
      >
        {(name || "?").charAt(0).toUpperCase()}
      </button>
      {open && (
        <div role="menu" className="animate-rise absolute top-10 right-0 z-40 w-64 overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl">
          <div className="border-b border-line p-4">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="truncate text-xs text-muted">{email}</div>
          </div>
          {session.isAdmin && (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onOpenAdmin();
              }}
              className="w-full px-4 py-2.5 text-left text-sm text-accent hover:bg-white/5"
            >
              Administrar clientes
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              try {
                await resetPassword(email);
                setNotice("Te enviamos un correo para elegir una contraseña nueva.");
              } catch (e) {
                setNotice(friendlyAuthError(e));
              }
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/5"
          >
            Cambiar contraseña
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              await beforeLogout().catch(() => undefined);
              await logout();
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-white/85 hover:bg-white/5"
          >
            Cerrar sesión
          </button>
          {notice && <p className="border-t border-line p-3 text-xs text-muted">{notice}</p>}
        </div>
      )}
    </div>
  );
}
