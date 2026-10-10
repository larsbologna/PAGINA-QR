import type { Metadata } from "next";
import Link from "next/link";
import { getBusinessAccess } from "@/server/auth/current";
import { publicFeedbackUrl } from "@/server/config";
import { printTemplateSvg } from "@/server/services/qr";
import { PrintButton } from "@/components/qr/print-button";

export const metadata: Metadata = { title: "Imprimir QR" };

export default async function PrintQrPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ mensaje?: string }> }) {
  const { slug } = await params;
  const { mensaje } = await searchParams;
  const { access } = await getBusinessAccess(slug);
  const b = access.business;
  const message = (typeof mensaje === "string" ? mensaje : "").trim().slice(0, 80) || "Contanos cómo fue tu experiencia";
  const svg = await printTemplateSvg({ url: publicFeedbackUrl(b.slug), businessName: b.name, message, brandColor: b.brandColor });

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3">
        <Link href={`/panel/${b.slug}/qr`} className="text-sm text-muted hover:text-ink">← Volver</Link>
        <PrintButton />
      </div>
      <div
        className="mx-auto w-[105mm] max-w-full border border-line bg-white print:border-0 [&_svg]:h-auto [&_svg]:w-full"
        // Plantilla generada en el servidor; el nombre y el mensaje se escapan como XML.
        dangerouslySetInnerHTML={{ __html: svg.replace(/^<\?xml[^>]*>\s*/, "") }}
      />
    </div>
  );
}
