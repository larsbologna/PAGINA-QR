import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { PRIVACY_SECTIONS } from "@/content/legal";

export const metadata: Metadata = { title: "Política de privacidad" };

export default function PrivacyPage() {
  return <LegalPage title="Política de privacidad" sections={PRIVACY_SECTIONS} />;
}
