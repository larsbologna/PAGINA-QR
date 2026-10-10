import type { Metadata, Viewport } from "next";
import "./globals.css";

const productName = process.env.PRODUCT_NAME?.trim() || "Reputación OS";

export const metadata: Metadata = {
  title: { default: productName, template: `%s · ${productName}` },
  description: "Opiniones de clientes con QR, panel privado y acceso a reseñas de Google para negocios locales.",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
