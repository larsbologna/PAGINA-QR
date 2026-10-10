import { requireSuperadmin } from "@/server/auth/current";
import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { CreateBusinessForm } from "@/components/admin/create-business-form";

export const metadata: Metadata = { title: "Nuevo negocio" };

export default async function NewBusinessPage() {
  await requireSuperadmin();
  return (
    <div className="max-w-2xl">
      <PageHeader title="Nuevo negocio" description="Empieza sin opiniones: los datos de producción nunca se mezclan con los de demostración." />
      <Card>
        <CardBody>
          <CreateBusinessForm />
        </CardBody>
      </Card>
    </div>
  );
}
