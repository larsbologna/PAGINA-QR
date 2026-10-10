import type { Metadata } from "next";
import Link from "next/link";
import { requireManageAccess } from "@/server/auth/current";
import { listCategories } from "@/server/services/categories";
import { logoUrl } from "@/server/services/businesses";
import { publicFeedbackUrl } from "@/server/config";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BrandingForm } from "@/components/settings/branding-form";
import { LogoForm } from "@/components/settings/logo-form";
import { CategoriesEditor } from "@/components/settings/categories-editor";
import { ThresholdsForm } from "@/components/settings/thresholds-form";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { access } = await requireManageAccess(slug);
  const b = access.business;
  const categories = await listCategories(b.id);
  const logo = logoUrl(b);

  return (
    <>
      <PageHeader title="Configuración" description="Personalizá la página que ven tus clientes al escanear el QR." />
      <div className="space-y-4">
        <Card>
          <CardHeader title="Identidad y mensajes" />
          <CardBody>
            <BrandingForm
              slug={b.slug}
              initial={{
                name: b.name,
                slug: b.slug,
                logoUrl: logo,
                brandColor: b.brandColor,
                welcomeMessage: b.welcomeMessage,
                thankYouMessage: b.thankYouMessage,
                googleReviewUrl: b.googleReviewUrl,
                isDemo: b.isDemo,
              }}
              categories={categories.filter((c) => c.status === "ACTIVE").map((c) => ({ id: c.id, name: c.name }))}
            />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Logo" />
          <CardBody>
            <LogoForm slug={b.slug} name={b.name} logoUrl={logo} color={b.brandColor} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Categorías de feedback" description="Los motivos que el cliente puede elegir (opcional) al opinar." />
          <CardBody>
            <CategoriesEditor slug={b.slug} categories={categories.map((c) => ({ id: c.id, name: c.name, status: c.status, uses: c._count.selections }))} />
          </CardBody>
        </Card>
        <Card id="criterios">
          <CardHeader title="Criterios de clasificación" description="Qué se considera opinión positiva, neutral o negativa en las estadísticas." />
          <CardBody>
            <ThresholdsForm slug={b.slug} positiveMin={b.positiveMin} negativeMax={b.negativeMax} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Página pública" />
          <CardBody className="space-y-2 text-sm">
            <p className="break-all">
              <a href={publicFeedbackUrl(b.slug)} target="_blank" rel="noopener noreferrer" className="font-medium text-brand-700 hover:underline">
                {publicFeedbackUrl(b.slug)}
              </a>
            </p>
            <p className="text-muted">
              Esta dirección es fija para que los QR impresos sigan funcionando. Si necesitás cambiarla, pedíselo al proveedor del servicio: los QR anteriores
              seguirán redirigiendo. <Link href={`/panel/${b.slug}/qr`} className="text-brand-700 hover:underline">Ir al código QR</Link>
            </p>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
