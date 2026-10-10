import type { Metadata } from "next";
import { getBusinessAccess } from "@/server/auth/current";
import { publicFeedbackUrl, config } from "@/server/config";
import { qrSvg } from "@/server/services/qr";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";
import { QrTools } from "@/components/qr/qr-tools";

export const metadata: Metadata = { title: "Código QR" };

export default async function QrPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const url = publicFeedbackUrl(b.slug);
  const svg = await qrSvg(url);
  const notHttps = !config.appUrl.startsWith("https://");

  return (
    <>
      <PageHeader title="Código QR" description="Apunta siempre a la misma dirección, aunque cambie el diseño de la página." />
      {notHttps && (
        <Alert tone="warning" className="mb-4" title="Revisá la URL antes de imprimir">
          La aplicación está configurada con {config.appUrl}. En producción, configurá APP_URL con tu dominio https antes de imprimir los QR.
        </Alert>
      )}
      <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr]">
        <Card>
          <CardHeader title="Vista previa" />
          <CardBody>
            <div
              className="mx-auto aspect-square w-full max-w-[280px] [&_svg]:h-full [&_svg]:w-full"
              role="img"
              aria-label={`Código QR que abre ${url}`}
              // SVG generado localmente por la librería qrcode a partir de nuestra propia URL.
              dangerouslySetInnerHTML={{ __html: svg }}
            />
            <p className="mt-3 text-center text-xs break-all text-muted">{url}</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Descargas" />
          <CardBody>
            <QrTools slug={b.slug} publicUrl={url} printHref={`/panel/${b.slug}/qr/imprimir`} />
          </CardBody>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader title="Consejos de colocación" />
        <CardBody>
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Imprimilo de al menos 3 × 3 cm, sobre fondo blanco y sin plastificado brillante si hay mucha luz.</li>
            <li>Ubicalo donde el cliente espera o paga: mostrador, mesas, caja o en la factura.</li>
            <li>Probalo con 2 o 3 celulares distintos antes de imprimir en cantidad.</li>
            <li>No ofrezcas descuentos ni beneficios a cambio de reseñas en Google: lo prohíben sus políticas.</li>
          </ul>
        </CardBody>
      </Card>
    </>
  );
}
