import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { findBusinessForPublic, getPublicCategories, logoUrl } from "@/server/services/businesses";
import { FeedbackFlow } from "@/components/public/feedback-flow";
import { BusinessLogo } from "@/components/business-logo";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await findBusinessForPublic(slug);
  return {
    title: found ? `Tu opinión sobre ${found.business.name}` : "Opiniones",
    robots: { index: false, follow: false },
  };
}

export default async function PublicFeedbackPage({ params }: Props) {
  const { slug } = await params;
  const found = await findBusinessForPublic(slug);
  if (!found) notFound();
  if (found.redirectTo) permanentRedirect(`/r/${found.redirectTo}`);
  const b = found.business;

  if (b.status !== "ACTIVE") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-white px-6 text-center">
        <BusinessLogo name={b.name} logoUrl={logoUrl(b)} color={b.brandColor} size={64} />
        <h1 className="mt-4 text-xl font-semibold">{b.name}</h1>
        <p className="mt-2 max-w-xs text-sm text-muted">Esta página de opiniones no está disponible en este momento. Gracias por tu interés.</p>
      </main>
    );
  }

  const categories = await getPublicCategories(b.id);
  return (
    <div className="min-h-dvh bg-white">
      <FeedbackFlow
        business={{
          name: b.name,
          slug: b.slug,
          logoUrl: logoUrl(b),
          brandColor: b.brandColor,
          welcomeMessage: b.welcomeMessage,
          thankYouMessage: b.thankYouMessage,
          googleReviewUrl: b.googleReviewUrl,
          isDemo: b.isDemo,
        }}
        categories={categories}
      />
    </div>
  );
}
