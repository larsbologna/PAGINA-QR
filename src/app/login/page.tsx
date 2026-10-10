import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";
import { getCurrentUser } from "@/server/auth/current";
import { config } from "@/server/config";

export const metadata: Metadata = { title: "Ingresar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user) redirect(user.role === "SUPERADMIN" ? "/admin" : "/panel");
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-semibold text-ink">
          <span className="flex size-8 items-center justify-center rounded-lg bg-brand-700 text-sm text-white">R</span>
          {config.productName}
        </Link>
        <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-lg font-semibold">Ingresá a tu panel</h1>
          <p className="mt-1 mb-6 text-sm text-muted">Accedé con el email con el que te invitaron.</p>
          <LoginForm next={typeof next === "string" ? next : undefined} />
        </div>
        <p className="mt-6 text-center text-xs text-muted">
          ¿No tenés cuenta? El acceso se otorga por invitación del proveedor del servicio.
        </p>
      </div>
    </main>
  );
}
