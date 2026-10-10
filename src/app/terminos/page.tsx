import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { TERMS_SECTIONS } from "@/content/legal";

export const metadata: Metadata = { title: "Términos y condiciones" };

export default function TermsPage() {
  return <LegalPage title="Términos y condiciones" sections={TERMS_SECTIONS} />;
}
