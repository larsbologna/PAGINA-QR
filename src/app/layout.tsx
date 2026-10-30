import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/bricolage-grotesque";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/sora";
import "@fontsource-variable/manrope";
import "@fontsource-variable/dm-sans";
import "@fontsource-variable/playfair-display";
import "@fontsource/anton";
import "@fontsource/bebas-neue";
import "@fontsource/archivo-black";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carrusel Studio",
  description: "Generador de carruseles para Instagram con exportación PNG.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}
