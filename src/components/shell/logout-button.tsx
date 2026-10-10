"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/cn";

/** Cierra sesión y recarga /login por completo, descartando la caché del router. */
export function LogoutButton({ className, withIcon = true }: { className?: string; withIcon?: boolean }) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        window.location.assign("/login");
      }}
      className={cn("disabled:opacity-60", className)}
    >
      {withIcon && <LogOut className="size-4" aria-hidden />}
      {pending ? "Cerrando…" : "Cerrar sesión"}
    </button>
  );
}
