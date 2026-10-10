import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/server/auth/current";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Mi cuenta" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <Link href={user.role === "SUPERADMIN" ? "/admin" : "/panel"} className="text-sm text-muted hover:text-ink">← Volver al panel</Link>
      <h1 className="mt-4 mb-6 text-xl font-semibold">Mi cuenta</h1>
      <Card>
        <CardHeader title="Datos" />
        <CardBody className="text-sm">
          <p><span className="text-muted">Email:</span> {user.email}</p>
          <p className="mt-1"><span className="text-muted">Rol:</span> {user.role === "SUPERADMIN" ? "Superadministrador" : "Usuario de negocio"}</p>
        </CardBody>
      </Card>
      <Card className="mt-4">
        <CardHeader title="Cambiar contraseña" />
        <CardBody>
          <PasswordForm />
        </CardBody>
      </Card>
    </main>
  );
}
