import type { NextConfig } from "next";

// GITHUB_PAGES=1 genera un sitio estático para GitHub Pages, servido en
// https://larsbologna.github.io/PAGINA-QR/carousel-google-maps/. La raíz de ese sitio
// sigue siendo la redirección de los QR impresos (web/redirect), por eso acá no hay
// redirect de "/" en ese modo.
const githubPages = process.env.GITHUB_PAGES === "1";

const nextConfig: NextConfig = githubPages
  ? {
      output: "export",
      basePath: "/PAGINA-QR",
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {
      async redirects() {
        return [{ source: "/", destination: "/carousel-google-maps", permanent: false }];
      },
    };

export default nextConfig;
